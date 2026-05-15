import { html } from "../html.ts"

export function Navbar() {
  return html`
    <nav>
      <div class="bg-gray-300 flex flex-row">
        <img
          class="ml-2"
          src="/favicon.svg"
          width="50"
          height="50"
        />
        <div class="max-w-screen-xl flex items-center justify-between mx-auto p-4">
          <span class="select-none self-center text-white text-2xl font-semibold whitespace-nowrap">Tsequencer</span>
        </div>
        <div class="spaceholder grow"></div>
      </div>
    </nav>
  `
}
