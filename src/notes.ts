import { GenericNoteName } from "./key.ts"

const NOTE_LETTER_PATTERN = /^[a-gA-G]$/
const SHARP_FLAT_PATTERN = /^[sSbB]$/
const DIGIT_PATTERN = /^[0-9]$/

export type NoteName = {
  letter: string
  accidental: AccidentalChar
  octave: number
}

export function printNoteName(nn: NoteName): string {
  return `${nn.letter}${nn.accidental}${nn.octave}`
}

export type AccidentalChar = "" | "s" | "S" | "b" | "B"

export function parseNoteName(name: string): NoteName | null {
  if (name.length < 2 || name.length > 3) {
    return null
  }

  const genericNote = parseGenericNoteName(name.slice(0, name.length - 1))
  if (genericNote === null) {
    return null
  }

  const { letter, accidental } = genericNote


  const octaveChar = name.at(-1)!
  if (!DIGIT_PATTERN.test(octaveChar)) {
    return null
  }

  const octave = parseInt(octaveChar, 10)

  return { letter, accidental, octave }
}

export function parseGenericNoteName(name: string): GenericNoteName | null {
  if (name.length < 1 || name.length > 2) {
    return null
  }

  const letter = name[0]
  if (!NOTE_LETTER_PATTERN.test(letter)) {
    return null
  }

  let accidental: AccidentalChar = ""
  if (name.length === 2) {
    const accidentalChar = name[1]
    if (!SHARP_FLAT_PATTERN.test(accidentalChar)) {
      return null
    }
    accidental = accidentalChar as AccidentalChar
  }

  return {
    letter,
    accidental,
  }
}

export function isValidNoteName(name: string): boolean {
  return parseNoteName(name) !== null
}

export function noteNameToKey(name: string): string {
  const parsed = parseNoteName(name)
  if (!parsed) {
    throw new Error(`Invalid note name: ${name}`)
  }

  const letter = parsed.letter.toLowerCase()
  const accidental = parsed.accidental ? parsed.accidental === "s" || parsed.accidental === "S" ? "s" : "b" : ""
  const octave = parsed.octave

  return `${letter}${accidental}${octave}`
}

const LETTER_TO_SEMITONE: Record<string, number> = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  b: 11,
}

export function noteNameToSemitones(note: NoteName): number {
  const letterSemitone = LETTER_TO_SEMITONE[note.letter.toLowerCase()]
  let accidentalSemitone = 0
  if (note.accidental === "s" || note.accidental === "S") {
    accidentalSemitone = 1
  } else if (note.accidental === "b" || note.accidental === "B") {
    accidentalSemitone = -1
  }
  return note.octave * 12 + letterSemitone + accidentalSemitone
}

export function semitoneDifference(a: NoteName, b: NoteName): number {
  return noteNameToSemitones(b) - noteNameToSemitones(a)
}

export function isBlackNote(n: NoteName): boolean {
  const _c0: NoteName = {
    letter: "c",
    accidental: "",
    octave: 0,
  }
  const diff = Math.abs(semitoneDifference(n, _c0)) % 12

  switch (diff) {
    case 2:
    case 4:
    case 5:
    case 7:
    case 9:
    case 11:
    case 0: {
      return false
    }
  }

  return false
}
