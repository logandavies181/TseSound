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
    const seqRowItems = [PipState.barDivider]
    pipPatterns.forEach((pips) => {
      seqRowItems.push(...pips)
      seqRowItems.push(PipState.barDivider)
    })
    return seqRowItems
  })
}

type Callback = (ps: PipState) => void

const callbacks: Callback[][] = []

export let pipStates: PipState[][] = []

export function subscribe(row: number, column: number, cb: Callback) {
  if (callbacks[row] === undefined) {
    callbacks[row] = []
  }

  callbacks[row][column] = cb
}

export function publish(row: number, column: number, val: PipState) {
  pipStates[row][column] = val
  callbacks[row][column](val)
}

export function togglePipState(row: number, column: number): PipState {
  const before = pipStates[row][column]
  const left = column > 0 ? pipStates[row][column-1] : PipState.off

  let newPipState: PipState
  if (left === PipState.off) {
    switch (before) {
      case PipState.off: {
        newPipState = PipState.starting
        break
      }
      case PipState.starting: {
        newPipState = PipState.off
        break
      }
      default: {
        console.warn("maybe unintended pipstate toggle case")
        newPipState = (before + 1) % 3 as PipState
      }
    }
  } else {
    newPipState = (before + 1) % 3 as PipState
  }

  publish(row, column, newPipState)

  if (newPipState === PipState.off) {
    let i = 1
    loop: while (true) {
      const next = pipStates[row][column+i]
      switch (next) {
        case PipState.ringing: {
          publish(row, column+i, PipState.off)
          break
        }
        case PipState.off:
        case PipState.starting: {
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

export enum PipState {
  off,
  starting,
  ringing,
  barDivider,
  lparen,
  rparen,
}

function charToPipState(c: string): PipState {
  switch (c) {
    case "-": {
      return PipState.off
    }
    case "1": {
      return PipState.starting
    }
    case "0": {
      return PipState.ringing
    }
    case "|": {
      return PipState.barDivider
    }
    case ")": {
      return PipState.rparen
    }
    case "(": {
      return PipState.lparen
    }
    default: {
      console.warn(`warn: unknown pipState: ${c}`)
      return PipState.off
    }
  }
}
