import { WebUI } from "@webui/deno-webui"

import app from "./app.js" with { type: "text" }
import css from "./output.css" with { type: "text" }
import favicon from "./public/favicon.svg" with { type: "text" }
import index from "./index.html" with { type: "text" }
import { parseTseFile } from "../src/parser.ts"
import { ParsedRow, printNoteName, TseFile } from "../index.ts"
import { isInKey, Key } from "../src/key.ts"

if (Deno.args.length === 0) {
  console.log("usage: $0 /path/to/file.tse")
  Deno.exit(1)
}
const fileName = Deno.args[0]

const myWindow = new WebUI()

myWindow.setFileHandler((url: URL) => {
  let resp = ""
  let contentType = ""
  switch (url.pathname) {
    case "/app.js":
      resp = app
      contentType = "Content-Type: text/javascript\r\n"
      break
    case "/favicon.svg":
      resp = favicon
      contentType = "Content-Type: image/svg+xml\r\n"
      break
    case "/":
    case "/index.html":
      resp = index
      break
    case "/output.css":
      resp = css
      break
  }

  const httpResp = `HTTP/1.1 200 OK\r\n${contentType}Content-Length: ${resp.length}\r\n\r\n${resp}`
  return Promise.resolve(httpResp)
})

myWindow.bind("callParseTseFile", () => {
  return JSON.stringify(parseTseFile(fileName))
})
declare global {
  function callParseTseFile(): Promise<string>
}

myWindow.bind("boundUpdateTseFile", async (e) => {
  const tseJson = e.arg.string(0)
  const tse = await JSON.parse(tseJson) as TseFile // TODO: typecheck
  const data = Deno.readTextFileSync(fileName)
  const output = data.split("\n").slice(0, tse.numHeaderLines + 1).concat(
    tse.rows.map((row) => formatParsedRow(row, tse.header.meta.key)),
  ).join("\n")
  Deno.writeTextFileSync(fileName, output)
})
declare global {
  function boundUpdateTseFile(tseJson: string): void
}

function formatParsedRow(row: ParsedRow, key: Key): string {
  const noteString = (isInKey(row.noteName, key) ? printNoteName(row.noteName) : "").padEnd(3)
  return noteString + row.patterns.join("|") + "|"
}

if (Deno.osRelease().match("WSL")) {
  await myWindow.show(index)
} else {
  myWindow.setSize(1600, 900)
  myWindow.showWebView(index)
}

await WebUI.wait()
