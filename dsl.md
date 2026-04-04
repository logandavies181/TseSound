# DSL

TseSound has a simple DSL format for specifying basic music performance.

## Note names

Western note names are specified by the following notation in order to make them easy to type and be acceptable as
identifiers in JS/TS.

```pseudocode
name := <letter>[sharp_or_flat]<digit>

letter := /[a-gA-G]{1}/

sharp_or_flat := /[sSbB]{0,1}/

digit := /[0-9]{1}/
```

The note names are specified without a fundamental frequency (i.e. A=440) as the tuning is applied later.
