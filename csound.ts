export type OptionsSection = string

export type InstrumentSection = {
  sampleRate: number
  mps: number
  dbfs: number
  numChannels: number
  instruments: Instrument[]
}

export type Instrument = {
  idx: number
  code: string
}

export type ScoreSection = string

export class ScoreFile {
  options: OptionsSection
  instruments: InstrumentSection
  score: ScoreSection

  constructor(options: OptionsSection, instruments: InstrumentSection, score: ScoreSection) {
    this.options = options
    this.instruments = instruments
    this.score = score
  }

  render() {
    console.log(
      `<CsoundSynthesizer>
<CsOptions>
${this.options}
</CsOptions>
<CsInstruments>
sr     = ${this.instruments.sampleRate}
ksmps  = ${this.instruments.mps}
0dbfs  = ${this.instruments.dbfs}
nchnls = ${this.instruments.numChannels}

${this.instruments.instruments
  .map(
    (instrument) => `
instr ${instrument.idx}
  ${instrument.code}
endin
`,
  )
  .join("\n")}
</CsInstruments>
<CsScore>
${this.score}
</CsScore>
</CsoundSynthesizer>`,
    )
  }
}
