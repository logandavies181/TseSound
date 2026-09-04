import { elemToPipState, getAllSelected, unselectAll } from "./drag.ts"
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
  if (direction === null || !e.ctrlKey) {
    return
  }

  type ElemLength = {
    elem: Element
    length: number
  }

  const elems = getAllSelected().filter((elem) => {
    return elemToPipState(elem)[0].type === PipType.starting
  })

  unselectAll()

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
          publish(row, column + offset, {
            selected: false,
            type: PipType.off,
          })
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
    const [_, row, column] = elemToPipState(elem)
    publish(row, column, {
      selected: false,
      type: PipType.off,
    })
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
    const [_, oldRow, oldCol] = elemToPipState(el.elem)
    let newRow = oldRow + diffRow
    let newCol = oldCol + diffCol

    loop: while (true) {
      const next = pipStates[newRow][newCol]
      // TODO: undefined check
      switch (next.type) {
        case PipType.barDivider:
        case PipType.lparen:
        case PipType.rparen: {
          newRow += diffRow
          newCol += diffCol
          continue
        }
        default:
          break loop
      }
    }

    publish(newRow, newCol, {
      selected: true,
      type: PipType.starting,
    })

    let len = el.length
    let offset = 0
    loop: while (len > 0) {
      offset++
      const next = pipStates[newRow][newCol + offset]
      if (next === undefined) {
        console.warn("undefined next shift")
        break loop
      }

      switch (next.type) {
        case PipType.barDivider:
        case PipType.lparen:
        case PipType.rparen: {
          continue
        }
        case PipType.off:
        case PipType.starting:
        case PipType.ringing: {
          len--
          publish(newRow, newCol + offset, {
            selected: true,
            type: PipType.ringing,
          })
          break
        }
        default: {
          throw `unknown PipType: ${next.type}`
        }
      }
    }
  }
})
