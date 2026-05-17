import { NoteName } from "../index.ts"

export type Key = {
  tonic: Omit<NoteName, "octave">
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
