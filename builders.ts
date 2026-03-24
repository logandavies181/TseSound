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

  private renderVoice(v: Voice, idx: number, reverbIdx: number): string {
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

      ${this.hasReverb ? `ga${reverbIdx}L += aSigL` : ""}
      ${this.hasReverb ? `ga${reverbIdx}R += aSigR` : ""}
    `
  }

  render(startIdx: number): { instruments: Instrument[], reverb: Instrument | null } {
    const instruments: Instrument[] = []
    let reverb: Instrument | null = null
    const reverbIdx = startIdx + 1000

    if (this.hasReverb) {
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
        code: this.renderVoice(v, idx, reverbIdx)
      })
      this.hasReverb = false
      idx++
    }

    return { instruments, reverb }
  }
}

export class Builder {
  private instruments: MetaInstrument[] = []
  private bars: Bar[] = []
  private reverbTracks: number[] = []
  private instrumentStartIdx = 1
  private _instrumentIndexMap: Map<string, number> = new Map()

  withInstrumentStartIdx(idx: number): Builder {
    this.instrumentStartIdx = idx
    return this
  }

  addInstrument(name: string, synths: Synth[]): MetaInstrument {
    const inst = new MetaInstrument(name, synths)
    this.instruments.push(inst)
    return inst
  }

  private renderInstruments(): { instruments: Instrument[], reverbInstruments: Instrument[] } {
    const allInstruments: Instrument[] = []
    const reverbInstruments: Instrument[] = []
    let idx = this.instrumentStartIdx
    this._instrumentIndexMap.clear()

    for (const inst of this.instruments) {
      this._instrumentIndexMap.set(inst.name, idx)
      const { instruments, reverb } = inst.render(idx)
      allInstruments.push(...instruments)
      if (reverb) reverbInstruments.push(reverb)
      idx += instruments.length
    }

    return { instruments: allInstruments, reverbInstruments }
  }

  getInstrumentIndex(name: string): number {
    const idx = this._instrumentIndexMap.get(name)
    if (idx === undefined) {
      throw new Error(`Instrument "${name}" not found`)
    }
    return idx
  }

  push(...bars: Bar[]): number {
    return this.bars.push(...bars)
  }

  pushChords(bar: number, instrumentName: string, chords: Chord[], amplitude?: number): void {
    const instrumentIdx = this.getInstrumentIndex(instrumentName)
    let currBar = bar
    let offset = 0
    for (const chord of chords) {
      for (const pitch of chord.pitches) {
        const duration = chord.duration
        this.bars[currBar].contents.push(new ScoreLine(instrumentIdx, { pitch, duration }, offset, amplitude))
      }
      offset += chord.duration.noteLength

      const timeSignature = this.bars[currBar].timeSignature
      if (offset >= timeSignature) {
        offset -= timeSignature
        currBar++
      }
    }
  }

  addReverbTrack(rt: number): Builder {
    this.reverbTracks.push(rt)
    return this
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
