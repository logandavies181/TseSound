import { Bar, Chord, ScoreLine } from "./score.ts"

export type OrcRenderer = (source: string) => string

export const renderHelloWorld: OrcRenderer = (source) => source.replaceAll("TSE_HELLO", 'prints "Hello world"')

type OrcInstrument = {
  name: string
  source: string
}

export class BuilderV2 {
  private instruments: OrcInstrument[] = []
  private bars: Bar[] = []
  private instrumentInfo: Set<string> = new Set()
  private orcRenderers: OrcRenderer[] = [renderHelloWorld]

  addOrcRenderer(renderer: OrcRenderer): this {
    this.orcRenderers.push(renderer)
    return this
  }

  addInstrument(name: string): this {
    if (this.instrumentInfo.has(name)) {
      throw new Error(`Instrument with name ${name} already added.`)
    }

    const filename = `${name}.orc`
    const source = Deno.readTextFileSync(filename)
    const declarations = [...source.matchAll(/^\s*instr\s+([A-Za-z_]\w*)\s*$/gm)]
    if (declarations.length !== 1 || declarations[0][1] !== name) {
      throw new Error(
        `Expected ORC file "${filename}" to declare exactly one instrument named "${name}"`,
      )
    }

    this.instrumentInfo.add(name)
    this.instruments.push({ name, source })
    return this
  }

  private getInstrumentName(name: string): string {
    if (!this.instrumentInfo.has(name)) {
      throw new Error(`Instrument "${name}" not found`)
    }
    return name
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

    const instrument = this.getInstrumentName(instrumentName)
    let currBar = bar
    let offset = 0
    for (const chord of chords) {
      for (let i = 0; i < chord.pitches.length; i++) {
        const pitch = chord.pitches[i]
        const duration = chord.duration
        this.bars[currBar].contents.push(
          new ScoreLine(instrument, { pitch, duration }, offset, amplitude),
        )
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
    const instruments = this.instruments.map((instrument) => {
      const source = this.orcRenderers.reduce(
        (data, renderer) => renderer(data),
        instrument.source,
      )
      const declarations = [...source.matchAll(/^\s*instr\s+([A-Za-z_]\w*)\s*$/gm)]
      if (declarations.length !== 1 || declarations[0][1] !== instrument.name) {
        throw new Error(
          `Expected ORC renderer output for "${instrument.name}" to retain exactly one matching instrument declaration`,
        )
      }
      return source
    })

    return `<CsoundSynthesizer>
<CsOptions>
</CsOptions>
<CsInstruments>
sr     = 48000
ksmps  = 128
0dbfs  = 1
nchnls = 2

${instruments.join("\n")}
</CsInstruments>
<CsScore>

;; End function section

${scoreLines.join("\n")}
</CsScore>
</CsoundSynthesizer>`
  }
}
