import { WebUI } from "@webui/deno-webui"

import app from "./app.js" with { type: "text" }
import css from "./output.css" with { type: "text" }
import favicon from "./public/favicon.svg" with { type: "text" }
import index from "./index.html" with { type: "text" }
import { parseTseFile } from "../src/parser.ts"

if (Deno.args.length === 0) {
  console.log("usage: $0 /path/to/file.tse")
  Deno.exit(1)
}

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
   return JSON.stringify(parseTseFile(Deno.args[0], { timeSignature: 4 }))
})
declare global {
  function callParseTseFile(): Promise<string>;
}

if (Deno.osRelease().match("WSL")) {
  await myWindow.show(index)
} else {
  myWindow.setSize(1600, 900)
  myWindow.showWebView(index)
}

await WebUI.wait()
