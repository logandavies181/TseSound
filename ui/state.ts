import { ParsedRow } from "../index.ts"

export function initializeState(parsedRows: ParsedRow[]) {
  // TODO: this is impossible to read

  const pipRows = parsedRows.map((row) =>
    row.patterns.map((pattern) => {
      return pattern.split("").map((char) => {
        return charToPipState(char)
      })
    })
  )

  pipStates = pipRows.map((pipPatterns) => {
    const seqRowItems = [PipType.barDivider]
    pipPatterns.forEach((pips) => {
      seqRowItems.push(...pips)
      seqRowItems.push(PipType.barDivider)
    })
    return seqRowItems.map((item) => {
      return {
        type: item,
        selected: false,
      }
    })
  })
}

type Callback = (ps: PipType) => void

const callbacks: Callback[][] = []

export type PipState = {
  type: PipType
  selected: boolean
}

export let pipStates: PipState[][] = []

export function subscribe(row: number, column: number, cb: Callback) {
  if (callbacks[row] === undefined) {
    callbacks[row] = []
  }

  callbacks[row][column] = cb
}

export function publish(row: number, column: number, val: PipType) {
  pipStates[row][column].type = val
  callbacks[row][column](val)
}

export function togglePipState(row: number, column: number): PipType {
  const before = pipStates[row][column].type
  const left = column > 0 ? pipStates[row][column - 1].type : PipType.off

  let newPipState: PipType
  if (left === PipType.off) {
    switch (before) {
      case PipType.off: {
        newPipState = PipType.starting
        break
      }
      case PipType.starting: {
        newPipState = PipType.off
        break
      }
      default: {
        console.warn("maybe unintended pipstate toggle case")
        newPipState = (before + 1) % 3 as PipType
      }
    }
  } else {
    newPipState = (before + 1) % 3 as PipType
  }

  publish(row, column, newPipState)

  if (newPipState === PipType.off) {
    let i = 1
    loop: while (true) {
      const next = pipStates[row][column + i]
      switch (next.type) {
        case PipType.ringing: {
          publish(row, column + i, PipType.off)
          break
        }
        case PipType.off:
        case PipType.starting: {
          break loop
        }
        default: {
          // pass
        }
      }

      i++
    }
  }

  return newPipState
}

export enum PipType {
  off,
  starting,
  ringing,
  barDivider,
  lparen,
  rparen,
}

function charToPipState(c: string): PipType {
  switch (c) {
    case "-": {
      return PipType.off
    }
    case "1": {
      return PipType.starting
    }
    case "0": {
      return PipType.ringing
    }
    case "|": {
      return PipType.barDivider
    }
    case ")": {
      return PipType.rparen
    }
    case "(": {
      return PipType.lparen
    }
    default: {
      console.warn(`warn: unknown pipState: ${c}`)
      return PipType.off
    }
  }
}
