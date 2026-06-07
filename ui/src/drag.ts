import { pipStates, publish } from "./state.ts"

let startX = 0
let startY = 0
let endX = 0
let endY = 0

document.addEventListener("mousedown", (e) => {
  startX = e.pageX
  startY = e.pageY
})

document.addEventListener("mousemove", (e) => {
  endX = e.pageX
  endY = e.pageY
})

document.addEventListener("mouseup", () => {
  const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
  console.log(dist)

  if (dist < 5) {
    return
  }

  const elems = document.querySelectorAll(".tse-selectable")
  for (const elem of elems) {
    const row = parseInt(elem.getAttribute("data-row")!)
    const column = parseInt(elem.getAttribute("data-column")!)
    const before = pipStates[row][column]

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
})
