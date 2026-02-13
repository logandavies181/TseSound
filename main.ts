import { ScoreBuilder } from "./builders.ts"
import { InstrumentSection, ScoreFile } from "./csound.ts"
import "./notes.ts"
import { c, n, Bar } from "./score.ts"

const options = "-odac"

const instruments = [
  {
    idx: 1,
    code: `
      iFreq = p4 / 4
      iAmp  = p5

      ;               att, dec, lvl, release
      kenv    mxadsr  .001, .2,   1,    1

      ; Simplified concept
      asig1 vco2 0.5, iFreq       ; Saw oscillator
      asig2 vco2 0.5, iFreq*1.005 ; Slightly detuned osc
      asig3 vco2 0.2, iFreq*2       ; Saw oscillator
      asig4 vco2 0.1, iFreq*3       ; Saw oscillator
      asig5 vco2 0.1, iFreq*4       ; Saw oscillator
      asig6 vco2 0.1, iFreq*5       ; Saw oscillator
      asig7 vco2 0.1, iFreq*6       ; Saw oscillator
      asig8 vco2 0.1, iFreq*7       ; Saw oscillator
      asig9 vco2 0.1, iFreq*8       ; Saw oscillator
      amix = (asig1 + asig2 + asig3 + asig4 + asig5 + asig6 + asig7 + asig8 + asig9) * 0.2 * kenv

      kcf  linseg 2000, 2, 500 ; Filter cutoff envelope
      afilt moogladder amix, kcf, 0.3 ; Warm filter
      outall afilt * iAmp
    `,
  },
]

const instrumentsSection: InstrumentSection = {
  sampleRate: 48000,
  mps: 32,
  dbfs: 1,
  numChannels: 2,
  instruments: instruments,
}

const notes = [
  n(e5, 0.5),
  n(d5, 0.5),
  n(c5, 0.5),
  n(d5, 0.5),

  n(e5, 0.5),
  n(e5, 0.5),
  n(e5, 1),

  n(d5, 0.5),
  n(d5, 0.5),
  n(d5, 1),

  n(e5, 0.5),
  n(g5, 0.5),
  n(g5, 1),
  n(e5, 0.5),
  n(d5, 0.5),
  n(c5, 0.5),
  n(d5, 0.5),

  n(e5, 0.5),
  n(e5, 0.5),
  n(e5, 0.5),
  n(e5, 0.5),
  n(d5, 0.5),
  n(d5, 0.5),
  n(e5, 0.5),
  n(d5, 0.5 / 3),
  n(e5, 0.5 / 3),
  n(d5, 0.5 / 3),

  n(c5, 2),
]

const chords = [
  c([c5, e5, g5], 4),

  c([g5, b5, d5], 2),
  c([c5, e5, g5], 2),

  c([c5, e5, g5], 4),

  c([g5, b5, d5], 2),
  c([c5, e5, g5], 2),
]

const bars = ((b: Bar, _n: number) => {
  const ret = []
  for (let i = 0; i < _n; i++) {
    ret.push(new Bar([], b.bpm, b.timeSignature))
  }
  return ret
})(new Bar([], 100, 4), 4)

const scorebuilder = new ScoreBuilder(bars)
scorebuilder.pushChords(0, 1, notes)
scorebuilder.pushChords(0, 1, chords, 0.3)
const score = scorebuilder.render()

const file = new ScoreFile(options, instrumentsSection, score)
file.render()
