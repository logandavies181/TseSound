import { Instrument } from "./csound.ts"

import { Bar, Chord, ScoreLine } from "./score.ts"

export class ScoreBuilder {
  constructor(private bars: Bar[] = []) {}

  push(...bars: Bar[]): number {
    return this.bars.push(...bars)
  }

  pushChords(bar: number, instrumentIdx: number, chords: Chord[], amplitude?: number): void {
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

  renderLines(): string[] {
    let time = 0
    return this.bars.map((itm) => {
      const line = itm.render(time)
      time += itm.barDuration()
      return line
    })
  }

  render(): string {
    return this.renderLines().join("\n")
  }
}

export type Envelope = string

export type Filter = {
  name: string
  args: string
}

export type Synth = {
  opcode: string
  weight?: number
}

export type Voice = {
  detune: number
  pan: number
}

export class InstrumentBuilder {
  private voices: Voice[] = [{
    detune: 1,
    pan: 0.5
  }]
  private filters: Filter[] = []
  private envelopes: Envelope[] = []
  private rawSections: string[] = []

  constructor(
    public synths: Synth[] = []
  ) {}

  clone(): InstrumentBuilder {
    const ret = new InstrumentBuilder(
      this.synths.map(synth => {
        return {opcode: synth.opcode, weight: synth.weight}
      })
    )
    for (const voice of this.voices) {
      ret.addVoice({...voice})
    }
    for (const filter of this.filters) {
      ret.addFilter({...filter})
    }
    for (const envelope of this.envelopes) {
      ret.addEnvelope(envelope)
    }
    for (const rawSection of this.rawSections) {
      ret.addRaw(rawSection)
    }

    return ret
  }

  addVoice(v: Voice): InstrumentBuilder {
    this.voices.push(v)
    return this
  }

  addMirroredVoice(v: Voice): InstrumentBuilder {
    this.voices.push(v)
    this.voices.push({
      detune: 1-Math.abs(1-v.detune),
      pan: 1-v.pan,
    })
    return this
  }

  addFilter(name: string, args: string): InstrumentBuilder {
    this.filters.push({name, args})
    return this
  }

  addEnvelope(e: Envelope): InstrumentBuilder {
    this.envelopes.push(e)
    return this
  }

  addRaw(s: string): InstrumentBuilder {
    this.rawSections.push(s)
    return this
  }

  private renderSynths(): string {
    let count = 1
    let sb = "\n"
    const outputParts: string[] = []
    for (const synth of this.synths) {
      sb += `      a${count} ${synth.opcode}\n`
      outputParts.push(`a${count} * ${synth.weight ?? 1.0/this.synths.length}`)
      count++
    }

    sb += `      aMix = ${outputParts.join(" + ")}\n`

    return sb
  }

  private renderFilters(): string {
    let count = 1
    let sb = "aFilt0 = aMix\n"
    for (const filt of this.filters) {
      sb += `      aFilt${count} ${filt.name} aFilt${count-1}, ${filt.args}\n`
      count++
    }

    sb += `      aFilt = aFilt${count-1}`

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

  private renderVoice(v: Voice): string {
    return `
      iFreq = p4 * ${v.detune}
      iDur = p3
      iAmp = p5

      ${this.rawSections.join("\n      ")}

      ${this.renderSynths()}

      ${this.renderFilters()}

      ${this.renderEnvelopes()}

      aMixFiltered = aFilt * kEnv

      kPan = ${v.pan}
      aSigL = aMixFiltered * cos((kPan) * $M_PI_2)
      aSigR = aMixFiltered * sin((kPan) * $M_PI_2)

      outs  aSigL, aSigR
    `
  }

  render(startIdx: number = 1): Instrument[] {
    let idx = startIdx
    const ret: Instrument[] = []
    for (const v of this.voices) {
      ret.push({
        idx,
        code: this.renderVoice(v)
      })
      idx++
    }

    return ret
  }
}
