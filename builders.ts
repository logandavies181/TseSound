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

export type Filter = string

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

  constructor(
    public synths: Synth[] = []
  ) {}

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

  addFilter(f: Filter): InstrumentBuilder {
    this.filters.push(f)
    return this
  }

  private renderSynths(): string {
    let count = 1
    let sb = ""
    const outputParts: string[] = []
    for (const synth of this.synths) {
      sb += `      a${count} ${synth.opcode}\n`
      outputParts.push(`a${count} * ${synth.weight ?? 1.0/this.synths.length}`)
      count++
    }

    sb += `      aMix = ${outputParts.join(" + ")}\n`

    return sb
  }

  private renderVoice(v: Voice): string {
    return `
      iFreq = p4 * ${v.detune}
      iDur = p3
      iAmp = p5

      ${this.renderSynths()}

      ;; TODO: make envelope its own option.
      kEnv mxadsr 0.05, 0.2, 1, 1
      aWithEnv = aMix * kEnv

      kPan = ${v.pan}
      aSigL = aWithEnv * cos((kPan) * $M_PI_2)
      aSigR = aWithEnv * sin((kPan) * $M_PI_2)

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
