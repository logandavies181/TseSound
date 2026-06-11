import { PipState, pipStates, PipType, publish } from "./state.ts"

enum EventType {
  normal,
  shift,
}

let startX = 0
let startY = 0
let endX = 0
let endY = 0
let eventType = EventType.normal

document.addEventListener("mousedown", (e) => {
  startX = e.pageX
  startY = e.pageY

  if (e.shiftKey) {
    eventType = EventType.shift
  } else {
    eventType = EventType.normal
  }
})

document.addEventListener("mouseup", (e) => {
  endX = e.pageX
  endY = e.pageY

  const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
  if (dist < 5) {
    return
  }

  switch (eventType) {
    case EventType.normal: {
      handleNormalDrag()
      break
    }
    case EventType.shift: {
      handleShiftDrag()
      break
    }
  }

  e.stopPropagation()
})

function handleNormalDrag() {
  unselectAll()

  const getPipFromPoint = (x: number, y: number): Element | null => {
    let elem = document.elementFromPoint(x, y)
    while (elem !== null) {
      if (elem.classList.contains("tse-selectable")) {
        return elem
      }

      elem = elem.parentElement
    }

    return null
  }

  const first = getPipFromPoint(Math.min(startX, endX), startY)
  const last = getPipFromPoint(Math.max(startX, endX), startY) // startY so we stay on the same row

  if (!first || !last) {
    return
  }

  const items = [first, last]

  items.forEach((item) => {
    const row = parseInt(item.getAttribute("data-row")!)
    const column = parseInt(item.getAttribute("data-column")!)
    const before = pipStates[row][column]
    before.selected = true
    publish(row, column, before)
  })
}

function handleShiftDrag() {
  const elems = document.querySelectorAll(".tse-selectable")
  for (const elem of elems) {
    const [before, row, column] = elemToPipState(elem)
    if (before.type !== PipType.ringing && before.type !== PipType.starting) {
      continue
    }

    const rect = elem.getBoundingClientRect()
    const xMid = rect.left + rect.width / 2
    const yMid = rect.top + rect.height / 2

    const x1 = Math.min(startX, endX)
    const x2 = Math.max(startX, endX)
    const y1 = Math.min(startY, endY)
    const y2 = Math.max(startY, endY)

    const newPipState = before
    if ((xMid >= x1 && xMid <= x2) && (yMid >= y1 && yMid <= y2)) {
      newPipState.selected = true
    } else {
      newPipState.selected = false
    }

    publish(row, column, newPipState)
  }
}

export function getAllSelected(): Element[] {
  const ret = []
  const elems = document.querySelectorAll(".tse-selectable")
  for (const elem of elems) {
    const [before] = elemToPipState(elem)
    if (before.selected) {
      ret.push(elem)
    }
  }

  return ret
}

export function elemToPipState(elem: Element): [PipState, number, number] {
  const row = parseInt(elem.getAttribute("data-row")!)
  const column = parseInt(elem.getAttribute("data-column")!)
  const pipState = pipStates[row][column]
  return [pipState, row, column]
}

function unselectAll() {
  const elems = getAllSelected()
  for (const elem of elems) {
    const [before, row, column] = elemToPipState(elem)
    before.selected = false

    publish(row, column, before)
  }
}
