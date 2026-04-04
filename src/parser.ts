import { Chord, n } from "./score.ts"
import { noteNameToKey } from "./dsl.ts"
import { notes } from "./notes.ts"

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

function patternToChord(
  noteName: string,
  pattern: string,
  options: ParseOptions,
): Chord | null {
  let startOffset: number | null = null

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]
    if (char === "1") {
      startOffset = i
      break
    }
  }

  if (startOffset === null) {
    return null
  }

  let endOffset = startOffset
  for (let i = startOffset + 1; i < pattern.length; i++) {
    if (pattern[i] === "0") {
      endOffset = i
    } else if (pattern[i] === "-") {
      break
    }
  }

  // TODO: This is relying on the pre-computed notes in notes.ts, which
  // doesn't allow for changing from A=440.
  const key = noteNameToKey(noteName)
  const pitch = (notes as Record<string, { frequency: number }>)[key]
  if (!pitch) {
    throw new Error(`Unknown note: ${noteName}`)
  }

  const noteLength = ((endOffset - startOffset + 1) / options.barLength) * options.timeSignature

  return n({ frequency: pitch.frequency, pitch: "" }, noteLength, 0.8)
}

export function parseTse(content: string, options: ParseOptions): Chord[] {
  const lines = content.split("\n").filter((line) => line.trim() !== "")
  const barCount = lines[0].split("|").length - 2

  const rows = lines.map((line) => parseRow(line, options.barLength))

  const chords: Chord[] = []

  for (let barIdx = 0; barIdx < barCount; barIdx++) {
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx]
      const pattern = row.patterns[barIdx]
      if (pattern.length == 0) {
        continue
      }

      let noteName: string
      if (rowIdx === 0) {
        noteName = rows[0].noteName
      } else if (row.noteName) {
        noteName = row.noteName
      } else {
        continue
      }

      const chord = patternToChord(noteName, pattern, options)
      if (chord) {
        chords.push(chord)
      }
    }
  }

  return chords
}
