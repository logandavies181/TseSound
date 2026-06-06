import { useEffect, useState } from "preact/hooks"

import { html } from "../html.ts"
import { colours } from "../colours.ts"
import { ParsedRow } from "../../src/parser.ts"
import { NoteName, isBlackNote } from "../../src/notes.ts"
import { initializeState, PipState, PipStates } from "../state.ts"

export function Sequencer() {
  const [rows, setRows] = useState<ParsedRow[]>([])

  useEffect(() => {
    (async () => {
      const res = await callParseTseFile()
      const tse = await JSON.parse(res)
      initializeState(tse)
      setRows(tse)
    })()
  }, [])

  return html`
    <div class="flex flex-col min-h-[50%] min-w-full overflow-x-clip overflow-y-clip">
      <div class="flex flex-col overflow-x-scroll min-w-full bg-green-800">
        <div class="flex flex-col min-w-full">
          ${rows.map((row, idx) =>
            html`
              <${SeqRow} rowIndex=${idx} noteName=${row.noteName} />
            `
          )}
        </div>
      </div>
    </div>
  `
}

export type SeqRowProps = {
  rowIndex: number
  noteName: NoteName
}

export function SeqRow(props: SeqRowProps) {
  const pipStates = PipStates.value[props.rowIndex]

  const noteRowBackgroundColour = isBlackNote(props.noteName)
    ? "bg-green-800"
    : "bg-green-600"

  return html`
    <div class="flex flex-row justify-start h-auto max-w-screen min-w-full ${noteRowBackgroundColour}">
      <div class="flex max-w-3 min-w-3 w-3 min-h-1 h-1"></div>
      ${pipStates.map(pipState => {
        return html`<${Pip} state="${pipState}" />`
      })}
    </div>
  `
}

export function pipStateToColour(p: PipState): string {
  return ["none", colours.amber[300], colours.green[300]][p]
}

export type PipProps = {
  state: PipState
}

export function Pip(props: PipProps) {
  const [pipState, setPipstate] = useState<PipState>(props.state)

  if (pipState >= PipState.lparen) {
    const flexX = pipState === PipState.lparen ? "0" : "10"

    return html`
      <div class="min-w-3 max-w-[5%] max-h-[100%]">
        <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 5 0 C ${flexX} 0 ${flexX} 10 5 10"
            fill="black"
          />
        </svg>
      </div>
    `
  }

  if (pipState === PipState.barDivider) {
    return html`
      <div class="min-w-3 max-w-[5%] max-h-1">
        <svg viewBox="0 0 5 100" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="2"
            width="1"
            height="20"
            fill="black"
          />
        </svg>
      </div>
    `
  }

  const onClick = () => {
    setPipstate((pipState + 1) % 3)
  }

  return html`
    <div class="flex min-w-3 max-w-[8%] min-h-[80%]" onClick="${onClick}">
      <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="5"
          y="5"
          width="90"
          height="50"
          fill="${pipStateToColour(pipState)}"
        />
      </svg>
    </div>
  `
}
