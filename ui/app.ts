import { render } from "preact"

import { html } from "./src/html.ts"
import { Navbar } from "./components/navbar.ts"
import { Sequencer } from "./components/sequencer.ts"

import "./src/drag.ts"
import "./src/shift.ts"
import { initializeState } from "./src/state.ts"
import { TseFile } from "../index.ts"

type AppProps = {
  tse: TseFile
}

function App(props: AppProps) {
  return html`
    <div class="flex grow flex-col min-w-full min-h-screen">
      <${Navbar} />
      <main class="flex grow flex-col items-center justify-center min-w-full min-h-full overflow-x-hidden">
        <${Sequencer} tse="${props.tse}" />
      </main>
    </div>
  `
}

async function main() {
  document.body.innerHTML = ""
  document.addEventListener("contextmenu", (e) => e.stopPropagation(), true)

  const res = await callParseTseFile()
  const tse = await JSON.parse(res) as TseFile
  initializeState(tse)

  render(
    html`
      <${App} tse="${tse}" />
    `,
    document.body,
  )
}

const intervalId = setInterval(() => {
  //@ts-ignore: actually it might not be defined, which is the point.
  if (typeof callParseTseFile !== "undefined") {
    clearInterval(intervalId)
    main()
  }
  console.log("waiting")
}, 100)
