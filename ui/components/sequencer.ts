import { useState } from "preact/hooks"

import { html } from "../src/html.ts"
import { colours } from "../src/colours.ts"
import { NoteName } from "../../src/notes.ts"
import { pipStates, PipType, subscribe, togglePipState } from "../src/state.ts"
import { TseFile } from "../../index.ts"
import { isInKey, isTonic } from "../../src/key.ts"

export type SequencerProps = {
  tse: TseFile
}

export function Sequencer(props: SequencerProps) {
  console.log(props.tse.header.meta.key)
  return html`
    <div class="flex flex-col min-h-[50%] min-w-full overflow-x-clip overflow-y-clip">
      <div class="flex flex-col overflow-x-scroll min-w-full bg-green-800">
        <div class="flex flex-col min-w-full">
          ${props.tse.rows.map((row, idx) =>
            html`
              <${SeqRow} rowIndex="${idx}" noteName="${row.noteName}" tse="${props.tse}" />
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
  tse: TseFile
}

export function SeqRow(props: SeqRowProps) {
  const _pipStates = pipStates[props.rowIndex]
  const key = props.tse.header.meta.key

  let noteRowBackgroundColour: string
  if (isTonic(props.noteName, key)) {
    noteRowBackgroundColour = "bg-green-900"
  } else {
    noteRowBackgroundColour = isInKey(props.noteName, props.tse.header.meta.key) ? "bg-green-800" : "bg-green-600"
  }

  return html`
    <div class="flex flex-row justify-start h-auto max-w-screen min-w-full ${noteRowBackgroundColour}">
      <div class="flex max-w-3 min-w-3 w-3 min-h-1 h-1"></div>
      ${_pipStates.map((pipState, idx) => {
        return html`
          <${Pip} state="${pipState.type}" row="${props.rowIndex}" index="${idx}" />
        `
      })}
    </div>
  `
}

export function pipStateToColour(p: PipType): string {
  return ["none", colours.amber[300], colours.green[300]][p]
}

export type PipProps = {
  row: number
  index: number
  state: PipType
}

export function Pip(props: PipProps) {
  const [pipType, setPipType] = useState<PipType>(props.state)
  const [selected, setSelected] = useState<boolean>(false)

  subscribe(props.row, props.index, (pipState) => {
    setSelected(pipState.selected)
    setPipType(pipState.type)
  })

  const onClick = () => {
    togglePipState(props.row, props.index)
  }

  if (pipType >= PipType.lparen) {
    const flexX = pipType === PipType.lparen ? "0" : "10"

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

  if (pipType === PipType.barDivider) {
    return html`
      <div class="min-w-3 max-w-[5%] max-h-1">
        <svg viewBox="0 0 5 5" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="2"
            width="1"
            height="5"
            fill="black"
          />
        </svg>
      </div>
    `
  }

  let pipColour: string
  if (selected) {
    pipColour = "red" // TODO: awful pallette
  } else {
    pipColour = pipStateToColour(pipType)
  }

  return html`
    <div
      class="tse-selectable flex min-w-3 max-w-[8%] min-h-[80%]"
      onClick="${onClick}"
      data-row="${props.row}"
      data-column="${props.index}"
    >
      <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="5"
          y="5"
          width="90"
          height="50"
          fill="${pipColour}"
        />
      </svg>
    </div>
  `
}
