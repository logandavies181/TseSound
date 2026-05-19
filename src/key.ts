import { AccidentalChar, NoteName, semitoneDifference } from "../index.ts"

export type GenericNoteName = Omit<NoteName, "octave">

export type Key = {
  tonic: GenericNoteName
  mode: KeyMode
}

export enum KeyMode {
  major,
  minor,
}

export function keyModeToOffsets(m: KeyMode): number[] {
  switch (m) {
    case KeyMode.major: {
      return [0, 2, 2, 1, 2, 2, 2, 1]
    }
    case KeyMode.minor: {
      return [0, 2, 1, 2, 2, 1, 2, 2]
    }
    default: {
      throw `unexpected keyMode: ${m}`
    }
  }
}

export function notesInKey(key: Key): GenericNoteName[] {
  const ret: GenericNoteName[] = [key.tonic]

  let prevNote = key.tonic
  for (const offset of keyModeToOffsets(key.mode).slice(1)) {
    let nextLetter = String.fromCharCode(prevNote.letter.charCodeAt(0) + 1)
    nextLetter = nextLetter === "h" ? "a" : nextLetter

    const diff = offset - genericNoteNameSemitoneDifference(prevNote, { letter: nextLetter, accidental: "" })

    let accidental: AccidentalChar
    switch (diff) {
      case 0: {
        accidental = ""
        break
      }
      case -1: {
        accidental = "b"
        break
      }
      case 1: {
        accidental = "s"
        break
      }
      default: {
        throw `unexpected diff: ${diff}`
      }
    }

    const next = {
      letter: nextLetter,
      accidental,
    }
    ret.push(next)
    prevNote = next
  }

  return ret
}

function genericNoteNameSemitoneDifference(a: GenericNoteName, b: GenericNoteName): number {
  if (b.letter.charCodeAt(0) - a.letter.charCodeAt(0) !== 1 && (a.letter !== "g" && b.letter !== "a")) {
    throw `genericNoteNameSemitoneDifference can only compare next letter up. got: ${a.letter} and ${b.letter}`
  }

  return semitoneDifference(
    {
      letter: a.letter,
      accidental: a.accidental,
      octave: 0,
    },
    {
      letter: b.letter,
      accidental: b.accidental,
      octave: b.letter === "c" ? 1 : 0,
    },
  )
}
