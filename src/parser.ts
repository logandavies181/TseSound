// import { Key } from "./key.ts"
import { Chord, n, r } from "./score.ts"
import { NoteName, noteNameToKey, parseNoteName, printNoteName, semitoneDifference } from "./dsl.ts"
import { notes } from "./notes.ts"

import { parse as parseYaml } from "@std/yaml"

import { readFileSync } from "node:fs"

export type SubBarDef = {
  // Number of iotas in sub-bar.
  length: number
  // Corresponding number of iotas consumed in main bar.
  iotas: number

  // TODO: properly parse header
  // pos: number
}

export type Header = {
  meta: HeaderMeta
  subBars: SubBarDef[]
}

export type HeaderMeta = {
  // key: typeof Key
  key: string
  iotaCount: number
  timeSignature: number
}

export type ParsedRow = {
  chords: Chord[]
  noteName: string
  patterns: string[]
}

function parseHeader(
  lines: string[],
): { header: Header; bodyLines: string[]; numHeaderLines: number } {
  const subBars: SubBarDef[] = []

  const bodyLines: string[] = []
  let numHeaderLines = -1

  let inMeta = true
  let inHeader = true
  let meta: HeaderMeta | undefined = undefined
  for (const line of lines) {
    if (inHeader) {
      numHeaderLines++
    }

    if (inMeta) {
      if (line !== "---") {
        continue
      }

      inMeta = false
      meta = parseYaml(lines.slice(0, numHeaderLines).join("\n")) as HeaderMeta // TODO: validate
      continue
    }

    const gutter = line.slice(0, 3).trim()

    if (inHeader) {
      if (gutter === "/") {
        inHeader = false
        continue
      }

      if (gutter === "#") {
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

  if (bodyLines.at(-1) === "") {
    bodyLines.pop()
  }

  if (meta === undefined) {
    throw "meta is undefined"
  }

  return { header: { meta, subBars }, bodyLines, numHeaderLines }
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
        `Indicative note mismatch on line ${rowIdx + startLine}: expected semitone ${expectedDiff} between ${
          printNoteName(prevNote)
        } and ${printNoteName(indicative)}, got ${diff}`,
      )
    }
    prevIdx = rowIdx
    prevNote = indicative
  }
}

function patternsToChords(
  noteNameString: string,
  patterns: string[],
  header: Header,
): Chord[] {
  // TODO: this forces A=440Hz
  // We're also parsing the noteName a second time where we could avoid it.
  const key = noteNameToKey(noteNameString)
  const pitch = (notes as Record<string, { frequency: number }>)[key]
  if (!pitch) {
    throw new Error(`Unknown note: ${noteNameString}`)
  }

  const ret: Chord[] = []

  const push = (ret: Chord[], currLen: number, isRest: boolean): void => {
    const len = (currLen / header.meta.iotaCount) * header.meta.timeSignature
    if (isRest) {
      ret.push(r(len))
    } else {
      ret.push(n({ frequency: pitch.frequency, pitch: "" }, len, 1))
    }
  }

  let consumedIotas = 0
  let subBarIdx = -1
  let inSubBar = false
  let lenRatio = 1
  let subBarStart = 0
  let currLen = 0
  let ringing = false

  for (const pattern of patterns) {
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i]
      switch (char) {
        case "(": {
          if (inSubBar) {
            throw "Cannot enter nested sub-bar"
          }
          inSubBar = true
          subBarStart = i
          subBarIdx++
          const subBar = header.subBars[subBarIdx]
          lenRatio = subBar.iotas / subBar.length
          break
        }
        case ")": {
          if (!inSubBar) {
            throw "Unexpected end of sub-bar"
          }

          const subBarDef = header.subBars[subBarIdx]
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
            consumedIotas += lenRatio
            ringing = false
          } else {
            currLen += lenRatio
            consumedIotas += lenRatio
          }
          break
        }
        case "1": {
          push(ret, currLen, !ringing)
          currLen = lenRatio
          consumedIotas += lenRatio
          ringing = true
          break
        }
        case "0": {
          if (ringing) {
            currLen += lenRatio
            consumedIotas += lenRatio
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

    // TODO: update expected bar length
    // FIXME? surely this always rounds as expected.. but maaybe not.
    if (Math.round(consumedIotas) !== header.meta.iotaCount) {
      throw `Unexpected bar length. Expected: ${header.meta.iotaCount}, got: ${consumedIotas}`
    }
    consumedIotas = 0
  }
  push(ret, currLen, !ringing)

  return ret
}

export function parseTse(content: string): ParsedRow[] {
  const lines = content.split("\n")
  const { header, bodyLines, numHeaderLines } = parseHeader(lines)

  const barCount = bodyLines[0].split("|").length - 2
  const rows = bodyLines.map((line, idx) => {
    const parts = line.split("|")
    const noteNameString = parts[0].trim()
    const patterns = parts.slice(1)
    patterns.pop() // get rid of errant empty last item.

    if (patterns.length !== barCount) {
      throw `Unexpected number of bars on row ${numHeaderLines + idx}`
    }

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

  const parsedRows: ParsedRow[] = []

  // let prevNoteName = definitiveNote
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    // TODO: need to get iota count for current bar. Currently isn't changeable per bar like intended.

    if (row.noteNameString === "") {
      row.noteNameString = "c9" //FIXME
    }

    try {
      const chords = patternsToChords(
        row.noteNameString,
        row.patterns,
        header,
      )
      parsedRows.push({
        chords,
        patterns: row.patterns,
        noteName: row.noteNameString,
      })
    } catch (e: unknown) {
      throw new Error(`Error on line ${numHeaderLines + rowIdx}:`, {
        cause: e,
      })
    }
  }

  return parsedRows
}

export function parseTseFile(
  fileName: string,
): ParsedRow[] {
  return parseTse(readFileSync(fileName, "utf-8"))
}

export function chordsFromTseFile(
  fileName: string,
): Chord[][] {
  return parseTse(readFileSync(fileName, "utf-8")).map(row => row.chords)
}
