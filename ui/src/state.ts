import { TseFile } from "../../index.ts"

export let _tseFile: TseFile | undefined = undefined

export function initializeState(tseFile: TseFile) {
  _tseFile = tseFile
  const parsedRows = _tseFile.rows

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

function formatPipType(p: PipType): string {
  switch (p) {
    case PipType.off: {
      return "-"
    }
    case PipType.lparen: {
      return "("
    }
    case PipType.rparen: {
      return ")"
    }
    case PipType.ringing: {
      return "0"
    }
    case PipType.starting: {
      return "1"
    }
    case PipType.barDivider: {
      return "|"
    }
    default: {
      throw `unknown PipType: ${p}`
    }
  }
}

globalThis.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault()
    updateTseFile()
  }
})

export function updateTseFile() {
  pipStates.forEach((pipStateRow, i) => {
    const patterns: string[] = []
    let sb = ""
    for (const pipState of pipStateRow) {
      switch (pipState.type) {
        case PipType.barDivider: {
          patterns.push(sb)
          sb = ""
          break
        }
        default: {
          sb += formatPipType(pipState.type)
        }
      }
    }

    _tseFile!.rows[i].patterns = patterns
  })

  boundUpdateTseFile(JSON.stringify(_tseFile))
}

type Callback = (ps: PipState) => void

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

export function publish(row: number, column: number, val: PipState) {
  pipStates[row][column] = val
  callbacks[row][column](val)
}

export function togglePipState(row: number, column: number): PipType {
  const before = pipStates[row][column]
  const beforeType = before.type
  const left = column > 0 ? pipStates[row][column - 1].type : PipType.off

  let newPipType: PipType
  if (left === PipType.off) {
    switch (beforeType) {
      case PipType.off: {
        newPipType = PipType.starting
        break
      }
      case PipType.starting: {
        newPipType = PipType.off
        break
      }
      default: {
        console.warn("maybe unintended pipstate toggle case")
        newPipType = (beforeType + 1) % 3 as PipType
      }
    }
  } else {
    newPipType = (beforeType + 1) % 3 as PipType
  }

  let selected = before.selected
  if (newPipType === PipType.off) {
    selected = false
  }
  publish(row, column, {
    selected: selected,
    type: newPipType,
  })

  if (newPipType === PipType.off) {
    let i = 1
    loop: while (true) {
      const next = pipStates[row][column + i]
      switch (next.type) {
        case PipType.ringing: {
          publish(row, column + i, {
            selected: before.selected,
            type: PipType.off,
          })
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

  return newPipType
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
