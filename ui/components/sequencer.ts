import { useState } from "preact/hooks"

import { html } from "../html.ts"

export function Sequencer() {
  const patterns = [
    "--------------------1000--------",
    "--------------------1000--------",
    "--------------------1000--------",
  ]

  return html`
    <div class="flex flex-col min-h-[50%] min-w-full overflow-y-scroll">
      <div class="flex flex-col overflow-x-scroll min-w-full bg-green-800">
        <div class="flex flex-col min-w-full">
          <${SeqRow} patterns=${patterns} />
          <${SeqRow} patterns=${patterns} />
          <${SeqRow} patterns=${patterns} />
        </div>
      </div>
    </div>
  `
}

export type SeqRowProps = {
  patterns: string[]
}

export function SeqRow(props: SeqRowProps) {
  const pipPatterns = props.patterns.map(pattern => {
    return pattern.split("").map(char => {
      return html`<${Pip} state=${charToPipState(char)} />`
    })
  })

  const seqRowItems = [newBarDivider()]
  pipPatterns.forEach(pips => {
    seqRowItems.push(...pips)
    seqRowItems.push(newBarDivider())
  })

  return html`
    <div class="flex flex-row justify-start h-auto max-w-screen min-w-full bg-green-500 overflow-y-hidden">
      <div class="flex max-w-3 min-w-3 w-3 min-h-1 h-1"></div>
      ${seqRowItems}
    </div>
  `
}

export enum PipState {
  off,
  starting,
  ringing,
  barDivider,
}

function newBarDivider() {
  return html`<${Pip} state=${PipState.barDivider} />`
}

export function charToPipState(c: string): PipState {
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
    default: {
      console.warn(`warn: unknown pipState: ${c}`)
      return PipState.off
    }
  }
}

export function pipStateToColour(p: PipState): string {
  return ["#f0f9ff", "#fee685", "#ecfcca"][p]
}

export type PipProps = {
  state: PipState
}

export function Pip(props: PipProps) {
  const [pipState, setPipstate] = useState<PipState>(props.state)

  if (pipState > 2) {
    return html`
      <div class="min-w-3 max-w-[5%] max-h-1">
        <svg viewBox="0 0 5 60" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="2"
            width="1"
            height="60"
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
    <div class="flex grow min-w-3 max-w-[8%]">
      <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
        <rect
          onClick=${onClick}
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
