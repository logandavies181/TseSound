export type OrcInstrument = {
  name: string
  source: string
}

export type OrcRenderer = (source: string, instrument: OrcInstrument) => string

/** rendererFactory */
function rf(pattern: string, output: string): OrcRenderer {
  return (source: string) => source.replaceAll(pattern, output)
}

export const renderHelloWorld: OrcRenderer = (source) => source.replaceAll("TSE_HELLO", 'prints "Hello world"')

export const renderDefArgs = rf("TSE_DEFAULT_ARGS", `
  iFreq = p4
  iDur = p3
  iAmp = p5
`)

export const renderSignal = rf("TSE_SIGNAL", "aSig")

// TODO: allow configuration of pan center: kPan
export const renderPan = rf("TSE_PATH", `
  kPan = 0.5
  aSigL = aMixFiltered * cos((kPan) * $M_PI_2)
  aSigR = aMixFiltered * sin((kPan) * $M_PI_2)
`)


export const renderOuts = rf("TSE_OUTS", "outs aSigL, aSigR")

export const renderReverb = (source: string, instrument: OrcInstrument) => source.replaceAll("TSE_REVERB", `
  ga${instrument.name}L += aSigL
  ga${instrument.name}R += aSigR
`)

export const defaultOrcRenderers: OrcRenderer[] = [renderHelloWorld, renderDefArgs, renderSignal, renderOuts, renderOuts, renderReverb]
