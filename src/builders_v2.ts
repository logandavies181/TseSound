import { defaultOrcRenderers, type OrcInstrument, type OrcRenderer } from "./orc_renderers.ts"
import { Bar, type Chord, ScoreLine } from "./score.ts"

export class BuilderV2 {
  private instruments: OrcInstrument[] = []
  private bars: Bar[] = []
  private instrumentInfo: Set<string> = new Set()
  private orcRenderers: OrcRenderer[] = []

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

  renderScoreLines(reverbInstrumentNames: string[], fromBar = 0): string[] {
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
    const ret = this.bars.slice(fromBar).map((bar) => {
      const line = bar.render(time)
      time += bar.barDuration()
      return line
    })
    for (const iname of reverbInstrumentNames) {
      ret.push(`i"${iname}_reverb" 0 ${time}`)
    }
    return ret
  }

  getNumBars(): number {
    return this.bars.length
  }

  renderReverb(instrument: OrcInstrument): string {
    // TODO: make hardcoded value configurable
    return `instr ${instrument.name}_reverb

  arevL reverb ga${instrument.name}L, 1.5
  arevR reverb ga${instrument.name}R, 1.5
  outs arevL, arevR

  ga${instrument.name}L  = 0
  ga${instrument.name}R  = 0
endin
`
  }

  render(fromBar = 0): string {
    const reverbInstrumentNames: string[] = []
    const reverbInstruments: string[] = []
    const instruments = this.instruments.map((instrument) => {
      const source = [...this.orcRenderers, ...defaultOrcRenderers].reduce(
        (data, renderer) => renderer(data, instrument),
        instrument.source,
      )
      if (source.match(/TSE_REVERB/gm)) {
        // TODO: messy
        reverbInstrumentNames.push(instrument.name)
        reverbInstruments.push(this.renderReverb(instrument))
      }
      const declarations = [...source.matchAll(/^\s*instr\s+([A-Za-z_]\w*)\s*$/gm)]
      if (declarations.length !== 1 || declarations[0][1] !== instrument.name) {
        throw new Error(
          `Expected ORC renderer output for "${instrument.name}" to retain exactly one matching instrument declaration`,
        )
      }
      return source
    })

    // We need to render a couple extra notes based on whether we detected any reverb instruments.
    const scoreLines = this.renderScoreLines(reverbInstrumentNames, fromBar)

    return `<CsoundSynthesizer>
<CsOptions>
</CsOptions>
<CsInstruments>
sr     = 48000
ksmps  = 128
0dbfs  = 1
nchnls = 2

${instruments.join("\n")}
${reverbInstruments.join("\n")}
</CsInstruments>
<CsScore>

;; End function section

${scoreLines.join("\n")}
</CsScore>
</CsoundSynthesizer>`
  }
}
