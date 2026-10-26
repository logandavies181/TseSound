instr lead
  TSE_DEFAULT_ARGS

  TSE_HELLO

  kEnv mxadsr 0.1, 0.1, 0.5, 1

  aSig0 vco2 iAmp, iFreq,   4, 0.5
  aSig1 vco2 iAmp, iFreq*2, 4, 0.5
  aSig2 vco2 iAmp, iFreq*3, 4, 0.5
  aSig = aSig0 * aSig1 * aSig2 * kEnv

  TSE_PAN
  TSE_OUTS
  TSE_REVERB
endin
