import { Command } from "@cliffy/command"
import { Builder } from "./builders.ts"

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
      Deno.writeTextFileSync("gen.csd", csdText);
      // TODO: only use .exe on windows, and allow overriding.
      // execFileSync("csound.exe", ["gen.csd", "-o", options.output])
      (new Deno.Command("csound.exe", {args: ["gen.csd", "-o", options.output]})).outputSync()
    })
    .parse(Deno.args)
}
