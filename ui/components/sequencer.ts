import { useState } from "preact/hooks"

import { html } from "../html.ts"

export function Sequencer() {
  return html`
    <div class="flex flex-col grow min-h-[50%] min-w-full overflow-y-scroll">
      <div class="flex flex-col overflow-x-scroll min-w-full bg-green-800">
        <div class="flex flex-col min-w-full">
          <${SeqRow} />
          <${SeqRow} />
          <${SeqRow} />
        </div>
      </div>
    </div>
  `
}

export function SeqRow() {
  return html`
    <div class="flex flex-row justify-start h-auto max-w-screen min-w-full bg-green-500">
      <div class="flex grow max-w-3 min-w-3 w-3 min-h-1 h-1"></div>
      ${(new Array(64).fill(null).map(_ => html`<${Pip} />`))}
    </div>
  `
}

export enum PipState {
  off,
  starting,
  ringing,
}

export function Pip() {
  const [pipState, setPipstate] = useState<PipState>(0)

  const pipStateToColour = (p: PipState): string => {
    return ["#f0f9ff", "#fee685", "#ecfcca"][p]
  }

  const onClick = () => {
    setPipstate((pipState + 1) % 3)
  }

  return html`
    <div class="min-w-3 w-3 max-w-[2.5%]">
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
