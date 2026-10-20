<CsoundSynthesizer>
<CsOptions>
</CsOptions>
<CsInstruments>
sr     = 48000
ksmps  = 128
0dbfs  = 1
nchnls = 2


galeadL init 0
galeadR init 0


instr lead
  
  iFreq = p4
  iDur = p3
  iAmp = p5


  prints "Hello world"

  kEnv mxadsr 0.01, 0.1, 0.5, 1

  aSig0 vco2 iAmp, iFreq, 4, 0.5
  aSig = aSig0 * kEnv

  
  kPan = 0.5
  aSigL = aSig * cos((kPan) * $M_PI_2)
  aSigR = aSig * sin((kPan) * $M_PI_2)

  
  
  galeadL += aSigL
  galeadR += aSigR

endin

instr lead_reverb

  kfeedback = 0.75  ; Reverb time (0 to 1)
  kcutoff   = 10000 ; Low-pass filter to tame harsh high-end distortion

  aRevL, aRevR reverbsc galeadL, galeadR, kfeedback, kcutoff

  idrymix = 0.7
  iwetmix = 0.3

  kEnv linsegr 0, 0.3, 1, 0.1, 0.5, 1, 0

  aMasterL = (galeadL * idrymix) + (aRevL * iwetmix * kEnv)
  aMasterR = (galeadR * idrymix) + (aRevR * iwetmix * kEnv)

  aOutL clip aMasterL, 0, 0.90
  aOutR clip aMasterR, 0, 0.90

  outs aOutL, aOutR

  galeadL  = 0
  galeadR  = 0
endin

</CsInstruments>
<CsScore>

;; End function section

i "lead" 0 0.8 440 0.5 
i"lead_reverb" 0 3
</CsScore>
</CsoundSynthesizer>