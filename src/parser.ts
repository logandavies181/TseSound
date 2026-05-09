import { Chord, n, r } from "./score.ts"
import { noteNameToKey, parseNoteName, semitonesBetween } from "./dsl.ts"
import { notes } from "./notes.ts"

export interface ParseOptions {
  timeSignature: number
}

export interface SubBarDef {
  length: number
  iotas: number
}

export interface Header {
  iotaCount: number
  subBars: SubBarDef[]
}

function parseHeader(lines: string[]): { header: Header; bodyLines: string[] } {
  let iotaCount: number | null = null
  const subBars: SubBarDef[] = []

  const bodyLines: string[] = []
  let inHeader = true

  for (const line of lines) {
    const gutter = line.slice(0, 3).trim()

    if (inHeader) {
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

  return { header: { iotaCount, subBars }, bodyLines }
}

function countIotas(pattern: string, subBars: SubBarDef[]): number {
  let count = 0
  let subBarDepth = 0
  let subBarStart = 0
  let subBarLen = 0
  let subBarIdx = 0

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]
    if (char === "(") {
      if (subBarDepth === 0) {
        subBarStart = i
        subBarLen = 0
      }
      subBarDepth++
    } else if (char === ")") {
      subBarDepth--
      if (subBarDepth === 0) {
        const subBarDef = subBars[subBarIdx++]
        if (subBarDef) {
          count += Math.round((subBarLen / subBarDef.length) * subBarDef.iotas)
        }
      }
    } else if (subBarDepth === 0) {
      count++
    } else {
      subBarLen++
    }
  }

  return count
}

function validateIndicativeNotes(
  definitiveNote: ReturnType<typeof parseNoteName>,
  indicativeNotes: { note: NonNullable<ReturnType<typeof parseNoteName>>; rowIdx: number }[],
) {
  if (!definitiveNote) return

  let prevNote = definitiveNote
  let expectedDiff = -1
  for (const { note: indicative, rowIdx } of indicativeNotes) {
    const diff = semitonesBetween(prevNote, indicative)
    if (diff !== expectedDiff) {
      throw new Error(
        `Indicative note mismatch at row ${rowIdx + 2}: expected semitone ${expectedDiff} from ${prevNote.letter}${prevNote.octave}, got ${indicative.letter}${indicative.octave}`,
      )
    }
    expectedDiff = diff
    prevNote = indicative
  }
}

function parseRow(row: string, barLength: number, subBars: SubBarDef[]): { noteName: string; patterns: string[] } {
  const parts = row.split("|")
  const noteName = parts[0].trim()
  const patterns = parts.slice(1)
  patterns.pop()

  for (const pattern of patterns) {
    const patternIotas = countIotas(pattern, subBars)
    if (patternIotas != barLength) {
      throw new Error(`Bar length mismatch: expected ${barLength}, got ${patternIotas} from pattern "${pattern}"`)
    }
  }

  return { noteName, patterns }
}

function patternsToChords(
  noteName: string,
  patterns: string[],
  options: ParseOptions,
  barLength: number,
  subBars: SubBarDef[],
): Chord[] {
  const key = noteNameToKey(noteName)
  const pitch = (notes as Record<string, { frequency: number }>)[key]
  if (!pitch) {
    throw new Error(`Unknown note: ${noteName}`)
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

  let subBarDepth = 0
  let subBarStart = 0
  let subBarLen = 0
  let currLen = 0
  let ringing = false
  const combinedPattern = patterns.join("")

  for (let i = 0; i < combinedPattern.length; i++) {
    const char = combinedPattern[i]
    switch (char) {
    case "(":
      subBarDepth++
      if (subBarDepth === 1) {
        subBarStart = i
        subBarLen = 0
      }
      break
    case ")":
      if (subBarDepth === 1) {
        const subBarDef = subBars.shift()
        if (subBarDef) {
          currLen += Math.round((subBarLen / subBarDef.length) * subBarDef.iotas)
        }
      }
      subBarDepth--
      break
    case "-":
      if (subBarDepth > 0) {
        subBarLen++
        break
      }
      if (ringing) {
        push(ret, currLen, false)
        currLen = 1
        ringing = false
      } else {
        currLen++
      }
      break
    case "1":
      if (subBarDepth > 0) {
        subBarLen++
        break
      }
      push(ret, currLen, !ringing)
      currLen = 1
      ringing = true
      break
    case "0":
      if (subBarDepth > 0) {
        subBarLen++
        break
      }
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
  push(ret, currLen, !ringing)

  return ret
}

export function parseTse(content: string, options: ParseOptions): Chord[][] {
  const lines = content.split("\n")
  const { header, bodyLines } = parseHeader(lines)

  const barCount = bodyLines[0].split("|").length - 2
  const rows = bodyLines.map((line) => parseRow(line, header.iotaCount, [...header.subBars]))

  const definitiveNote = parseNoteName(rows[0].noteName)
  const indicativeNotes: { note: NonNullable<ReturnType<typeof parseNoteName>>; rowIdx: number }[] = []
  for (let i = 1; i < rows.length; i++) {
    const parsed = parseNoteName(rows[i].noteName)
    if (parsed) {
      indicativeNotes.push({ note: parsed, rowIdx: i })
    }
  }
  validateIndicativeNotes(definitiveNote, indicativeNotes)

  const chords: Chord[][] = []

  for (let barIdx = 0; barIdx < barCount; barIdx++) {
    const barChords: Chord[] = []

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx]
      const pattern = row.patterns[barIdx]
      if (!pattern || pattern.length === 0) {
        barChords.push(r(options.timeSignature))
        continue
      }

      let noteName: string
      if (rowIdx === 0) {
        noteName = rows[0].noteName
      } else if (row.noteName) {
        noteName = row.noteName
      } else {
        barChords.push(r(options.timeSignature))
        continue
      }

      const allPatterns = rows[rowIdx].patterns
      const rowChords = patternsToChords(noteName, allPatterns, options, header.iotaCount, [...header.subBars])
      barChords.push(rowChords[0])
    }

    chords.push(barChords)
  }

  return chords
}
