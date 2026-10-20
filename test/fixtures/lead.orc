instr lead
  TSE_DEFAULT_ARGS

  TSE_HELLO

  kEnv mxadsr 0.01, 0.1, 0.5, 1

  aSig0 vco2 iAmp, iFreq, 4, 0.5
  aSig = aSig0 * kEnv

  TSE_PAN
  TSE_OUTS
  TSE_REVERB
endin
