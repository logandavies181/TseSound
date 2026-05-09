# DSL

TseSound has a simple DSL format for specifying basic music performance.

## Extension

TseSound DSL files use a .tse extension.

## Encoding and allowed characters

DSL files are encoded in UTF-8 and the following characters are allowed: /[a-gA-G0-9sS|\- \n=/#()]/

## Iotas

DSL files are agnostic of time signature and tempo. Each character is one "iota" and represents the length of whatever
the bar happens to be when used, divided by the declared number of iotas per bar.

## Gutter Section

The first 3 characters on any line form the Gutter Section. This section is used for declaring
[Note Names](#Note-Names).

Each row specifies a different Western even-tempered note, one semitone below the last.

The first Note Name is authoritative, the rest are purely for the reader, and any incorrectness in this section is
considered an error.

## Header Section

The first section of the file is the Header Section. It contains metadata and performance information on separate lines.

Different types of Header Section lines are discriminated by the first pattern in the gutter section.

`=` indicates the Iota Counter Line. This line declares the expected number of iotas for the bar. Subsequent bars after
the first may omit this to copy the previous bar.

`#` indicates the Comment Line. This line is ignored.

`()` indicates the Tuplet Line. This is used to declare the ratio of sub-bars.

Empty Lines are allowed and are ignored.

`/` indicates the end of the Header Section.

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

## Performance Section

This section expresses the performance of notes. Characters have the following meanings:

`|` separates bars; as well as the Gutter Section from the Performance Section. `-` is the absence of a note. `1` is the
start of a note. `0` is the continued ringing of a note. `(` starts a sub-bar. `)` ends a sub-bar.

## Sub-bars

Sub-bars are used to express tuplet note lengths. The sub-bar's length and the number of iotas it consumes are declared
in the Tuplet Line in the Header Section by a sub-bar-expression.

Sub-bar-expressions should be in the same row as the corresponding `(`, but this is not enforced, and expressions are
used in the same order they are defined.

Sub-bar-expressions have the following format:

```pseudocode
sub-bar-expression := <length_of_sub-bar>:<number_of_iotas_consumed>
```
