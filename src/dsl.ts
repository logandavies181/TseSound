const NOTE_LETTER_PATTERN = /^[a-gA-G]$/
const SHARP_FLAT_PATTERN = /^[sSbB]$/
const DIGIT_PATTERN = /^[0-9]$/

export type NoteName = {
  letter: string
  accidental: "" | "s" | "S" | "b" | "B"
  octave: number
}

export function parseNoteName(name: string): NoteName | null {
  if (name.length < 2 || name.length > 3) {
    return null
  }

  const letter = name[0]
  if (!NOTE_LETTER_PATTERN.test(letter)) {
    return null
  }

  let accidental: "" | "s" | "S" | "b" | "B" = ""
  let octaveCharIndex = 1

  if (name.length === 3) {
    const accidentalChar = name[1]
    if (!SHARP_FLAT_PATTERN.test(accidentalChar)) {
      return null
    }
    accidental = accidentalChar as "" | "s" | "S" | "b" | "B"
    octaveCharIndex = 2
  }

  const octaveChar = name[octaveCharIndex]
  if (!DIGIT_PATTERN.test(octaveChar)) {
    return null
  }

  const octave = parseInt(octaveChar, 10)

  return { letter, accidental, octave }
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
  const accidental = parsed.accidental
    ? parsed.accidental === "s" || parsed.accidental === "S"
      ? "s"
      : "b"
    : ""
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

export function semitonesBetween(a: NoteName, b: NoteName): number {
  return noteNameToSemitones(b) - noteNameToSemitones(a)
}
