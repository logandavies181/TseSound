const NOTE_LETTER_PATTERN = /^[a-gA-G]$/
const SHARP_FLAT_PATTERN = /^[sSbB]$/
const DIGIT_PATTERN = /^[0-9]$/

export interface NoteName {
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
