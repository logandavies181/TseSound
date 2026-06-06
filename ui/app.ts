import { render } from "preact"

import { html } from "./html.ts"
import { Navbar } from "./components/navbar.ts"
import { Sequencer } from "./components/sequencer.ts"

function App() {
  return html`
    <div class="flex grow flex-col min-w-full min-h-screen">
      <${Navbar} />
      <main class="flex grow flex-col items-center justify-center min-w-full min-h-full overflow-x-hidden">
        <${Sequencer} />
      </main>
    </div>
  `
}

function main() {
  document.body.innerHTML = ""
  document.addEventListener("contextmenu", (e) => e.stopPropagation(), true)
  render(
    html`
      <${App} />
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

