import { WebUI } from "@webui/deno-webui"

const myWindow = new WebUI();

myWindow.bind("app.js", () => Deno.readTextFileSync(`${import.meta.dirname}/app.js`));
myWindow.bind("index.html", () => Deno.readTextFileSync(`${import.meta.dirname}/index.html`));
myWindow.bind("output.css", () => Deno.readTextFileSync(`${import.meta.dirname}/output.css`));


if (Deno.osRelease().match("WSL")) {
  await myWindow.show("index.html");
} else {
  myWindow.showWebView("index.html")
}

await WebUI.wait();
