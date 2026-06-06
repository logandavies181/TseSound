import { ParsedRow } from "../index.ts"

type Callback<T> = (t: T) => void

class Topic<T> {
  private callbacks = new Map<string, Callback<T>>()

  constructor(public value: T) {}

  public Subscribe(name: string, cb: Callback<T>) {
    this.callbacks.set(name, cb)
  }

  public Publish(t: T) {
    this.value = t
    this.callbacks.forEach((cb) => {
      cb(t)
    })
  }
}

export function initializeState(parsedRows: ParsedRow[]) {
  // TODO: this is impossible to read

  const pipRows = parsedRows.map(row => row.patterns.map((pattern) => {
    return pattern.split("").map((char) => {
      return charToPipState(char)
    })
  }))

  PipStates.value = pipRows.map(pipPatterns => {
    const seqRowItems = [PipState.barDivider]
    pipPatterns.forEach((pips) => {
      seqRowItems.push(...pips)
      seqRowItems.push(PipState.barDivider)
    })
    return seqRowItems
  })
}

export const PipStates = new Topic<PipState[][]>([])

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
