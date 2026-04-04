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

export type OptionsSection = string

export type ScoreSection = string

export type Function = string

export class ScoreFile {
  constructor(public options: OptionsSection, public instruments: InstrumentSection, public score: ScoreSection, public functions: Function[] = []) {
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
${this.functions.join("\n")}
;; End function section

${this.score}
</CsScore>
</CsoundSynthesizer>`,
    )
  }
}
