import { Command } from "@cliffy/command"
import { Builder } from "./builders.ts"
import { writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"

export async function run(builder: Builder): Promise<void> {
  await new Command()
    .name("tsesound")
    .version("0.1.0")
    .description("Experimental command line interface for TseSound")
    .command("perform", "Render CSound code and immediately perform it.")
    .option("-o, --output <val:string>", "Output file", {
      default: "dac",
    })
    .action((options) => {
      const csdText = builder.render()
      // TODO: write .csd to a temp file.
      writeFileSync("gen.csd", csdText)
      // TODO: only use .exe on windows, and allow overriding.
      execFileSync("csound.exe", ["gen.csd", "-o", options.output])
    })
    .parse(Deno.args)
}
