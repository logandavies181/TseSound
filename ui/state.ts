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

export let pipStates: PipState[][] = []

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
