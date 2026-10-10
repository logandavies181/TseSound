import { Instrument } from "./csound.ts"
import { Bar, Chord, ScoreLine } from "./score.ts"

type InstrumentInfo = {
  startIdx: number
  numVoices: number
}

export class BuilderV2 {
  private instruments: Instrument[] = []
  private bars: Bar[] = []
  private nextIdx = 1
  private instrumentInfo: Map<string, InstrumentInfo> = new Map()

  addInstrument(name: string, orcPath: string): this {
    if (this.instrumentInfo.has(name)) {
      throw new Error(`Instrument with name ${name} already added.`)
    }

    const source = Deno.readTextFileSync(orcPath)
    const declarations = [...source.matchAll(/^\s*instr\s+\d+\b/gm)]
    if (declarations.length !== 1) {
      throw new Error(
        `Expected exactly one instrument declaration in ORC file for "${name}", found ${declarations.length}`,
      )
    }

    const idx = this.nextIdx++
    const code = source.replace(
      /^(\s*instr\s+)\d+\b/m,
      (_match, prefix: string) => `${prefix}${idx}`,
    )
    this.instrumentInfo.set(name, { startIdx: idx, numVoices: 1 })
    this.instruments.push({ idx, code })
    return this
  }

  private getInstrumentInfo(name: string): InstrumentInfo {
    const info = this.instrumentInfo.get(name)
    if (!info) {
      throw new Error(`Instrument "${name}" not found`)
    }
    return info
  }

  addBars(bpm: number, timeSignature: number, n: number): void {
    for (let i = 0; i < n; i++) {
      this.bars.push(new Bar(bpm, timeSignature))
    }
  }

  private _isChordListList(val: Chord[] | Chord[][]): val is Chord[][] {
    return Array.isArray(val[0])
  }

  pushChords(
    bar: number,
    instrumentName: string,
    chords: Chord[] | Chord[][],
    amplitude?: number,
  ): void {
    if (this._isChordListList(chords)) {
      for (const c of chords) {
        this.pushChords(bar, instrumentName, c, amplitude)
      }
      return
    }

    const { startIdx, numVoices } = this.getInstrumentInfo(instrumentName)
    let currBar = bar
    let offset = 0
    for (const chord of chords) {
      for (let i = 0; i < chord.pitches.length; i++) {
        const pitch = chord.pitches[i]
        const duration = chord.duration
        for (
          let voiceIdx = startIdx;
          voiceIdx < startIdx + numVoices;
          voiceIdx++
        ) {
          this.bars[currBar].contents.push(
            new ScoreLine(voiceIdx, { pitch, duration }, offset, amplitude),
          )
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

  pushChordsMany(
    repeats: number,
    bar: number,
    instrumentName: string,
    chords: Chord[] | Chord[][],
    amplitude?: number,
  ): void {
    if (this._isChordListList(chords)) {
      for (const c of chords) {
        this.pushChordsMany(repeats, bar, instrumentName, c, amplitude)
      }
      return
    }
    const repeatedChords: Chord[] = []
    for (let i = 0; i < repeats; i++) {
      repeatedChords.push(...chords)
    }
    this.pushChords(bar, instrumentName, repeatedChords, amplitude)
  }

  renderScoreLines(fromBar = 0): string[] {
    if (!Number.isInteger(fromBar) || fromBar < 0) {
      throw new Error(
        `Invalid fromBar: ${fromBar}. Must be a non-negative integer.`,
      )
    }
    if (this.bars.length > 0 && fromBar >= this.bars.length) {
      throw new Error(
        `Invalid fromBar: ${fromBar}. Exceeds number of bars (${this.bars.length}).`,
      )
    }
    let time = 0
    return this.bars.slice(fromBar).map((bar) => {
      const line = bar.render(time)
      time += bar.barDuration()
      return line
    })
  }

  getNumBars(): number {
    return this.bars.length
  }

  render(fromBar = 0): string {
    const scoreLines = this.renderScoreLines(fromBar)
    return `<CsoundSynthesizer>
<CsOptions>
</CsOptions>
<CsInstruments>
sr     = 48000
ksmps  = 128
0dbfs  = 1
nchnls = 2

${this.instruments.map((instrument) => instrument.code).join("\n")}
</CsInstruments>
<CsScore>

;; End function section

${scoreLines.join("\n")}
</CsScore>
</CsoundSynthesizer>`
  }
}
