import { Chord, n, r } from "./score.ts"
import { noteNameToKey } from "./dsl.ts"
import { notes } from "./notes.ts"
import { readFileSync } from "node:fs"

export interface ParseOptions {
  barLength: number
  timeSignature: number
}

function parseRow(row: string, barLength: number): { noteName: string; patterns: string[] } {
  const parts = row.split("|")
  const noteName = parts[0].trim()
  const patterns = parts.slice(1)
  patterns.pop() // We end on a | which adds an unecessary pattern.

  for (const pattern of patterns) {
    if (pattern.length != barLength) {
      throw new Error(`Bar length mismatch: expected ${barLength}, got ${pattern.length}`)
    }
  }

  return { noteName, patterns }
}

function patternsToChords(
  noteName: string,
  patterns: string[],
  options: ParseOptions,
): Chord[] {

  // Iterate over all bars for the row, treating it like one massive bar.
  // The length of the bars is checked in `parseRow`; and notes are allowed to
  // cross Bar lines, which is handled when pushing chords to the builder.

  // TODO: This is relying on the pre-computed notes in notes.ts, which
  // doesn't allow for changing from A=440.
  const key = noteNameToKey(noteName)
  const pitch = (notes as Record<string, { frequency: number }>)[key]
  if (!pitch) {
    throw new Error(`Unknown note: ${noteName}`)
  }

  const ret: Chord[] = []

  const push = (ret: Chord[], currLen: number, isRest: boolean): void => {
    const len = (currLen / options.barLength) * options.timeSignature
    if (isRest) {
      ret.push(r(len))
    } else {
      ret.push(n({ frequency: pitch.frequency, pitch: "" }, len, 1))
    }
  }

  let currLen = 0
  let ringing = false
  const _pattern = patterns.join("")
  for (let i = 0; i < _pattern.length; i++) {
    const char = _pattern[i]
    switch (char) {
    case "-":
      if (ringing) {
        push(ret, currLen, false)
        currLen = 1
        ringing = false
      } else {
        currLen++
      }
      break
    case "1":
      push(ret, currLen, !ringing)
      currLen = 1
      ringing = true
      break
    case "0":
      if (ringing) {
        currLen++
      } else {
        throw new Error("Unexpected sustain of not ringing note")
      }
      break
    default:
      throw new Error(`Unexpected char: ${char}`)
    }
  }
  // Push the last note - even if it's a rest. Otherwise we miss a note or corrupt
  // the length of the bar.
  push(ret, currLen, !ringing)

  return ret
}

export function parseTse(content: string, options: ParseOptions): Chord[][] {
  const lines = content.split("\n").filter((line) => line.trim() !== "")
  const rows = lines.map((line) => parseRow(line, options.barLength))

  const chords: Chord[][] = []

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    let noteName: string
    if (rowIdx === 0) {
      noteName = rows[0].noteName
    } else if (row.noteName) {
      noteName = row.noteName
    } else {
      continue
    }

    const rowChords = patternsToChords(noteName, row.patterns, options)
    if (rowChords) {
      chords.push(rowChords)
    }
  }

  return chords
}

export function parseTseFile(fileName: string, options: ParseOptions): Chord[][] {
  return parseTse(readFileSync(fileName, "utf8"), options)
}
