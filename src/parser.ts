import { Chord, n, r } from "./score.ts"
import { NoteName, noteNameToKey, parseNoteName, printNoteName, semitoneDifference } from "./dsl.ts"
import { notes } from "./notes.ts"
import { readFileSync } from "node:fs"

export interface ParseOptions {
  timeSignature: number
}

export interface SubBarDef {
  // Number of iotas in sub-bar.
  length: number
  // Corresponding number of iotas consumed in main bar.
  iotas: number
}

export interface Header {
  iotaCount: number
  subBars: SubBarDef[]
}

function parseHeader(lines: string[]): { header: Header; bodyLines: string[]; numHeaderLines: number } {
  let iotaCount: number | null = null
  const subBars: SubBarDef[] = []

  const bodyLines: string[] = []
  let inHeader = true

  let numHeaderLines = 0
  for (const line of lines) {
    const gutter = line.slice(0, 3).trim()

    if (inHeader) {
      numHeaderLines++
      if (gutter === "/") {
        inHeader = false
        continue
      }

      if (gutter === "#") {
        continue
      }

      if (gutter === "=") {
        const parts = line.split("|")
        const value = parts[1].trim()
        iotaCount = parseInt(value, 10)
        continue
      }

      if (gutter === "()") {
        const parts = line.split("|")
        const expr = parts[1].trim()
        const [length, iotas] = expr.split(":").map(Number)
        subBars.push({ length, iotas })
        continue
      }
    } else {
      bodyLines.push(line)
    }
  }

  if (iotaCount === null) {
    throw new Error("Iota count not declared")
  }

  bodyLines.pop()

  return { header: { iotaCount, subBars }, bodyLines, numHeaderLines }
}

function validateIndicativeNotes(
  definitiveNote: NoteName,
  indicativeNotes: { note: NoteName; rowIdx: number }[],
  startLine: number,
) {
  let prevNote = definitiveNote
  let prevIdx = 0
  for (const { note: indicative, rowIdx } of indicativeNotes) {
    const diff = semitoneDifference(indicative, prevNote)
    const expectedDiff = rowIdx - prevIdx
    if (diff !== expectedDiff) {
      throw new Error(
        `Indicative note mismatch on line ${rowIdx + startLine}: expected semitone ${expectedDiff} between ${printNoteName(prevNote)} and ${printNoteName(indicative)}, got ${diff}`,
      )
    }
    prevIdx = rowIdx
    prevNote = indicative
  }
}

function patternsToChords(
  noteNameString: string,
  patterns: string[],
  options: ParseOptions,
  barLength: number,
  subBars: SubBarDef[],
): Chord[] {

  // FIXME: actually allow blank notenames as intended
  if (noteNameString.trim() === "") {
    noteNameString = "c9"
  }

  // TODO: this forces A=440Hz
  // We're also parsing the noteName a second time where we could avoid it.
  const key = noteNameToKey(noteNameString)
  const pitch = (notes as Record<string, { frequency: number }>)[key]
  if (!pitch) {
    throw new Error(`Unknown note: ${noteNameString}`)
  }

  const ret: Chord[] = []

  const push = (ret: Chord[], currLen: number, isRest: boolean): void => {
    const len = (currLen / barLength) * options.timeSignature
    if (isRest) {
      ret.push(r(len))
    } else {
      ret.push(n({ frequency: pitch.frequency, pitch: "" }, len, 1))
    }
  }

  let subBarIdx = -1
  let inSubBar = false
  let lenRatio = 1
  let subBarStart = 0
  let currLen = 0
  let ringing = false
  const combinedPattern = patterns.join("")

  for (let i = 0; i < combinedPattern.length; i++) {
    const char = combinedPattern[i]
    switch (char) {
      case "(": {
        if (inSubBar) {
          throw "Cannot enter nested sub-bar"
        }
        inSubBar = true
        subBarStart = i
        subBarIdx++
        const subBar = subBars[subBarIdx]
        lenRatio = subBar.iotas / subBar.length
        break
      }
      case ")": {
        if (!inSubBar) {
          throw "Unexpected end of sub-bar"
        }

        const subBarDef = subBars[subBarIdx]
        const sblen = i - subBarStart - 1
        const expectedSbLen = subBarDef.length
        if (expectedSbLen !== sblen) {
          throw `Unexpected sub-bar length. Expected ${expectedSbLen}, got ${sblen}`
        }

        lenRatio = 1
        inSubBar = false
        break
      }
      case "-": {
        if (ringing) {
          push(ret, currLen, false)
          currLen = lenRatio
          ringing = false
        } else {
          currLen += lenRatio
        }
        break
      }
      case "1": {
        push(ret, currLen, !ringing)
        currLen = lenRatio
        ringing = true
        break
      }
      case "0": {
        if (ringing) {
          currLen += lenRatio
        } else {
          throw new Error("Unexpected sustain of not ringing note")
        }
        break
      }
      default: {
        throw new Error(`Unexpected char: ${char}`)
      }
    }
  }
  push(ret, currLen, !ringing)

  return ret
}

export function parseTse(content: string, options: ParseOptions): Chord[][] {
  const lines = content.split("\n")
  const { header, bodyLines, numHeaderLines } = parseHeader(lines)

  const barCount = bodyLines[0].split("|").length - 2
  const rows = bodyLines.map((line, idx) => {
    const parts = line.split("|")
    const noteNameString = parts[0].trim()
    const patterns = parts.slice(1)
    patterns.pop() // get rid of errant empty last item.

    if (patterns.length !== barCount)
      throw `Unexpected number of bars on row ${numHeaderLines + idx}`

    return {
      noteNameString,
      patterns,
    }
  })

  const definitiveNote = parseNoteName(rows[0].noteNameString)
  if (definitiveNote == null) throw "Definitive Note Name not set"

  const indicativeNotes: { note: NoteName; rowIdx: number }[] = []
  for (let i = 1; i < rows.length; i++) {
    const parsed = parseNoteName(rows[i].noteNameString)
    if (parsed) {
      indicativeNotes.push({ note: parsed, rowIdx: i })
    }
  }
  validateIndicativeNotes(definitiveNote, indicativeNotes, numHeaderLines + 1)

  const chords: Chord[][] = []

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    // TODO: need to get iota count for current bar. Currently isn't changeable per bar like intended.
    try {
      chords.push(patternsToChords(row.noteNameString, row.patterns, options, header.iotaCount, header.subBars))
    } catch (e: unknown) {
      throw new Error(`Error on line ${numHeaderLines + rowIdx}:`, { cause: e })
    }
  }

  return chords
}

export function parseTseFile(fileName: string, options: ParseOptions): Chord[][] {
  return parseTse(readFileSync(fileName, "utf-8"), options)
}
