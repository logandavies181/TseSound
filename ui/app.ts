import { render } from "preact"

import { html } from "./html.ts"

// if ("serviceWorker" in navigator) {
//   navigator.serviceWorker.register("sw.js", { scope: "/harmonies-planner/" })
// }

function App() {
  return html`
    <div class="touch-manipulation flex grow flex-col min-w-full min-h-full">
      <main class="flex grow flex-col justify-between min-w-full">
        Hi world
      </main>
    </div>
  `
}

console.log("ran")

document.body.innerHTML = ""
render(html`<${App} />`, document.body)
