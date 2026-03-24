import { Instrument } from "./csound.ts"
import { Bar, Chord, ScoreLine } from "./score.ts"

export type Envelope = string

export type Filter = {
  name: string
  args: string
}

export type RawSection = {
  code: string
  location: RawSectionLocation
}

export enum RawSectionLocation {
  start,
  afterFilters,
}

export type Synth = {
  opcode: string
  weight?: number
}

export type Voice = {
  detune: number
  pan: number
}

class MetaInstrument {
  private voices: Voice[] = [{
    detune: 1,
    pan: 0.5
  }]
  private filters: Filter[] = []
  private envelopes: Envelope[] = []
  private rawSections: RawSection[] = []
  hasReverb = false

  constructor(
    public name: string,
    public synths: Synth[]
  ) {}

  clone(): MetaInstrument {
    const ret = new MetaInstrument(this.name, this.synths.map(s => ({ opcode: s.opcode, weight: s.weight })))
    for (const voice of this.voices) ret.addVoice({ ...voice })
    for (const filter of this.filters) ret.addFilter(filter.name, filter.args)
    for (const envelope of this.envelopes) ret.addEnvelope(envelope)
    for (const rawSection of this.rawSections) ret.addRaw(rawSection.code, rawSection.location)
    ret.hasReverb = this.hasReverb
    return ret
  }

  addVoice(v: Voice): MetaInstrument {
    this.voices.push(v)
    return this
  }

  addMirroredVoice(v: Voice): MetaInstrument {
    this.voices.push(v)
    this.voices.push({
      detune: 1 - Math.abs(1 - v.detune),
      pan: 1 - v.pan,
    })
    return this
  }

  addFilter(name: string, args: string): MetaInstrument {
    this.filters.push({ name, args })
    return this
  }

  addEnvelope(e: Envelope): MetaInstrument {
    this.envelopes.push(e)
    return this
  }

  addRaw(code: string, location?: RawSectionLocation): MetaInstrument {
    this.rawSections.push({ code, location: location ?? RawSectionLocation.start })
    return this
  }

  withReverb(): MetaInstrument {
    this.hasReverb = true
    return this
  }

  numVoices(): number {
    return this.voices.length
  }

  private renderSynths(): string {
    let count = 1
    let sb = "\n"
    const outputParts: string[] = []
    for (const synth of this.synths) {
      sb += `      a${count} ${synth.opcode}\n`
      outputParts.push(`a${count} * ${synth.weight ?? 1.0 / this.synths.length}`)
      count++
    }
    sb += `      aMix = ${outputParts.join(" + ")}\n`
    return sb
  }

  private renderFilters(): string {
    let count = 1
    let sb = "aFilt0 = aMix\n"
    for (const filt of this.filters) {
      sb += `      aFilt${count} ${filt.name} aFilt${count - 1}, ${filt.args}\n`
      count++
    }
    sb += `      aFilt = aFilt${count - 1}\n`
    for (const rs of this.rawSections) {
      if (rs.location == RawSectionLocation.afterFilters) {
        sb += `      ${rs.code}\n`
      }
    }
    return sb
  }

  private renderEnvelopes(): string {
    let count = 0
    let sb = "\n"
    const outputParts: string[] = []
    for (const env of this.envelopes) {
      sb += `      kEnv${count} ${env}\n`
      outputParts.push(`kEnv${count} `)
      count++
    }
    sb += `      kEnv = ${outputParts.join(" * ")}\n`
    return sb
  }

  private renderVoice(v: Voice, reverbIdx?: number): string {
    return `
      iFreq = p4 * ${v.detune}
      iDur = p3
      iAmp = p5

      ${this.rawSections.filter(rs => rs.location == RawSectionLocation.start).map(rs => rs.code).join("\n      ")}

      ${this.renderSynths()}

      ${this.renderFilters()}

      ${this.renderEnvelopes()}

      aMixFiltered = aFilt * kEnv

      kPan = ${v.pan}
      aSigL = aMixFiltered * cos((kPan) * $M_PI_2)
      aSigR = aMixFiltered * sin((kPan) * $M_PI_2)

      outs  aSigL, aSigR

      ${reverbIdx && this.hasReverb ? `ga${reverbIdx}L += aSigL` : ""}
      ${reverbIdx && this.hasReverb ? `ga${reverbIdx}R += aSigR` : ""}
    `
  }

  render(startIdx: number, reverbIdx?: number): { instruments: Instrument[], reverb?: Instrument } {
    const instruments: Instrument[] = []
    let reverb: Instrument | undefined = undefined

    if (reverbIdx && this.hasReverb) {
      reverb = {
        idx: reverbIdx,
        code: `
    arevL reverb ga${reverbIdx}L, 1.5
    arevR reverb ga${reverbIdx}R, 1.5
    outs arevL, arevR

    ga${reverbIdx}L  = 0
    ga${reverbIdx}R  = 0
  `
      }
    }

    let idx = startIdx
    for (const v of this.voices) {
      instruments.push({
        idx,
        code: this.renderVoice(v, reverbIdx)
      })
      // FIXME, this is really hacky.
      this.hasReverb = false
      idx++
    }

    return { instruments, reverb }
  }
}

type InstrumentInfo = {
  startIdx: number
  numVoices: number
  reverbIdx?: number
}

export class Builder {
  private instruments: MetaInstrument[] = []
  private bars: Bar[] = []
  private reverbTracks: number[] = []
  private nextIdx = 1
  private instrumentInfo: Map<string, InstrumentInfo> = new Map()

  addInstrument(name: string, synths: Synth[], configurator: (mi: MetaInstrument) => void): Builder {
    if (this.instrumentInfo.has(name)) throw `Instrument with name ${name} already added.`
    const inst = new MetaInstrument(name, synths)
    configurator(inst)
    const nextIdx = this.nextIdx
    this.nextIdx += inst.numVoices()
    let reverbIdx: number | undefined
    if (inst.hasReverb) {
      reverbIdx = this.nextIdx
      this.reverbTracks.push(reverbIdx)
      this.nextIdx++;
    }
    this.instrumentInfo.set(name, {
      startIdx: nextIdx,
      numVoices: inst.numVoices(),
      reverbIdx: reverbIdx,
    })
    this.instruments.push(inst)
    return this
  }

  private renderInstruments(): { instruments: Instrument[], reverbInstruments: Instrument[] } {
    const allInstruments: Instrument[] = []
    const reverbInstruments: Instrument[] = []

    for (const inst of this.instruments) {
      const info = this.getInstrumentInfo(inst.name)
      const { instruments, reverb } = inst.render(info.startIdx, info.reverbIdx)
      allInstruments.push(...instruments)
      if (reverb) reverbInstruments.push(reverb)
    }

    return { instruments: allInstruments, reverbInstruments }
  }

  private getInstrumentInfo(name: string): InstrumentInfo {
    const info = this.instrumentInfo.get(name)
    if (!info) {
      throw new Error(`Instrument "${name}" not found`)
    }
    return info
  }

  getReverbIndex(name: string): number | undefined {
    const info = this.getInstrumentInfo(name)
    if (info.reverbIdx === null) {
      throw new Error(`Instrument "${name}" has no reverb`)
    }
    return info.reverbIdx
  }

  addBars(bpm: number, timeSignature: number, n: number): void {
    for (let i = 0; i < n; i++) {
      this.bars.push(new Bar(bpm, timeSignature))
    }
  }

  pushChords(bar: number, instrumentName: string, chords: Chord[], amplitude?: number): void {
    const { startIdx, numVoices } = this.getInstrumentInfo(instrumentName)
    let currBar = bar
    let offset = 0
    for (const chord of chords) {
      for (let i = 0; i < chord.pitches.length; i++) {
        const pitch = chord.pitches[i]
        const duration = chord.duration
        for (let voiceIdx = startIdx; voiceIdx < startIdx + numVoices; voiceIdx++) {
          this.bars[currBar].contents.push(new ScoreLine(voiceIdx, { pitch, duration }, offset, amplitude))
        }
      }
      offset += chord.duration.noteLength

      const timeSignature = this.bars[currBar].timeSignature
      if (offset >= timeSignature) {
        offset -= timeSignature
        currBar++
      }
    }
  }

  renderScoreLines(): string[] {
    let time = 0
    const ret = this.bars.map((itm) => {
      const line = itm.render(time)
      time += itm.barDuration()
      return line
    })
    for (const rt of this.reverbTracks) {
      ret.push(`i${rt} 0 ${time}`)
    }
    return ret
  }

  render(): string {
    const { instruments, reverbInstruments } = this.renderInstruments()
    const scoreLines = this.renderScoreLines()
    const allInstruments = [...instruments, ...reverbInstruments]

    return `<CsoundSynthesizer>
<CsOptions>
</CsOptions>
<CsInstruments>
sr     = 48000
ksmps  = 128
0dbfs  = 1
nchnls = 2

${allInstruments.map(instrument => `
instr ${instrument.idx}
  ${instrument.code}
endin
`).join("\n")}
</CsInstruments>
<CsScore>

;; End function section

${scoreLines.join("\n")}
</CsScore>
</CsoundSynthesizer>`
  }
}
