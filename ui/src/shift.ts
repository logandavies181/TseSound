import { elemToPipState, getAllSelected } from "./drag.ts"
import { pipStates, PipType, publish } from "./state.ts"

enum Direction {
  down,
  up,
  left,
  right,
}

function keyboardToDirection(keyboard: string): Direction | null {
  switch (keyboard) {
    case "ArrowDown": {
      return Direction.down
    }
    case "ArrowUp": {
      return Direction.up
    }
    case "ArrowLeft": {
      return Direction.left
    }
    case "ArrowRight": {
      return Direction.right
    }
    default: {
      return null
    }
  }
}

document.addEventListener("keydown", (e) => {
  const direction = keyboardToDirection(e.key)
  if (direction === null) {
    return
  }

  type ElemLength = {
    elem: Element
    length: number
  }

  const elems = getAllSelected().filter((elem) => {
    return elemToPipState(elem)[0].type === PipType.starting
  })

  const elemLengths: ElemLength[] = []
  for (const elem of elems) {
    const [_, row, column] = elemToPipState(elem)
    let offset = 0
    let length = 0
    loop: while (true) {
      offset++
      const next = pipStates[row][column + offset]
      if (next === undefined) {
        break loop
      }

      switch (next.type) {
        case PipType.off:
        case PipType.starting: {
          break loop
        }
        case PipType.barDivider:
        case PipType.lparen:
        case PipType.rparen: {
          continue
        }
        case PipType.ringing: {
          length++
          break
        }
        default: {
          throw `unknown PipType: ${next.type}`
        }
      }
    }
    elemLengths.push({
      elem,
      length,
    })
  }

  for (const elem of elems) {
    const [ps, row, column] = elemToPipState(elem)
    ps.selected = false
    publish(row, column, ps)
  }

  const directionToRowColDiff = (d: Direction): [number, number] => {
    switch (d) {
      case Direction.down: {
        return [1, 0]
      }
      case Direction.up: {
        return [-1, 0]
      }
      case Direction.left: {
        return [0, -1]
      }
      case Direction.right: {
        return [0, 1]
      }
    }
  }

  for (const el of elemLengths) {
    const [diffRow, diffCol] = directionToRowColDiff(direction)
    const [ps, oldRow, oldCol] = elemToPipState(el.elem)
    const newRow = oldRow + diffRow
    const newCol = oldCol + diffCol
    publish(newRow, newCol, ps)

    let length = el.length
    let offset = 0
    loop: while (el.length > 0) {
      offset++
      const next = pipStates[newRow][newCol + offset]
      if (next === undefined) {
        break loop
      }

      switch (next.type) {
        case PipType.off:
        case PipType.starting: {
          break loop
        }
        case PipType.barDivider:
        case PipType.lparen:
        case PipType.rparen: {
          continue
        }
        case PipType.ringing: {
          length--
          publish(newRow, newCol + offset, next)
          break
        }
        default: {
          throw `unknown PipType: ${next.type}`
        }
      }
    }
  }
})
