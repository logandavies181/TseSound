import { ScoreBuilder } from "./builders.ts"
import { InstrumentSection, ScoreFile } from "./csound.ts"
import { c, n, Bar, Pitch } from "./score.ts"

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
      outall afilt
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

// const score = `
//   i1 0   1 1
//   i1 1   1 1
//
//   i2 0.25 1 1
//   i2 0.75 1 1
//   i2 1.25 1 1
//   i2 1.75 1 1
//
//   i3 0.5   1 1
//   i3 1.5   1 1
//
//   e
// `

const a4 = Pitch.fromFrequency(440)
const c5 = Pitch.fromFrequency(523.25)
const d5 = Pitch.fromFrequency(587.33)
const e5 = Pitch.fromFrequency(659.26)
const f5 = Pitch.fromFrequency(698.46)
const g5 = Pitch.fromFrequency(783.99)
const a5 = Pitch.fromFrequency(880)
const b5 = Pitch.fromFrequency(987.77)

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
scorebuilder.pushChords(0, 1, chords)
const score = scorebuilder.render()

const file = new ScoreFile(options, instrumentsSection, score)
file.render()
