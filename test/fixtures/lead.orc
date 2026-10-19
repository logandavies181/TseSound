instr lead
  TSE_DEFAULT_ARGS

  TSE_HELLO

  kEnv mxadsr 0.001, 0.1, 0.5, 0.1

  aSig0 vco2 iAmp, iFreq/2, 4, 0.9
  aSig = aSig0 * kEnv

  TSE_PAN
  TSE_OUTS
  TSE_REVERB
endin
