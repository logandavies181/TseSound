import { WebUI } from "@webui/deno-webui"

import app from "./app.js" with { type: "text" }
import css from "./output.css" with { type: "text" }
import favicon from "./public/favicon.svg" with { type: "text" }
import index from "./index.html" with { type: "text" }

const myWindow = new WebUI();

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

  // HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nHello
  const httpResp = `HTTP/1.1 200 OK\r\n${contentType}Content-Length: ${resp.length}\r\n\r\n${resp}`
  return Promise.resolve(httpResp)
})
myWindow.bind("./index.html", () => index)
myWindow.bind("./output.css", () => css)

if (Deno.osRelease().match("WSL")) {
  await myWindow.show(index);
} else {
  myWindow.showWebView(index)
}

await WebUI.wait();
