import { Command } from "@cliffy/command"
import type { Builder } from "./builders.ts"
import type { BuilderV2 } from "./builders_v2.ts"

export async function run(builder: Builder | BuilderV2): Promise<void> {
  await new Command()
    .name("tsesound")
    .version("0.1.0")
    .description("Experimental command line interface for TseSound")
    .globalOption(
      "--from-bar <bar:number>",
      "Bar to start from (0-indexed)",
      {
        default: 0,
      },
    )
    .command("display", "Display the generated Csound file.")
    .option(
      "--from-bar <bar:number>",
      "Bar to start from (0-indexed)",
      {
        default: 0,
      },
    )
    .action((options) => {
      const fromBar = (options.fromBar as number) ?? 0
      const csdText = builder.render(fromBar)
      Deno.stdout.writeSync(new TextEncoder().encode(csdText))
    })
    .reset()
    .command("perform", "Render CSound code and immediately perform it.")
    .option("-o, --output <val:string>", "Output file")
    .option(
      "--from-bar <bar:number>",
      "Bar to start from (0-indexed)",
      {
        default: 0,
      },
    )
    .action((options) => {
      const fromBar = (options.fromBar as number) ?? 0
      const csdText = builder.render(fromBar)
      const csdPath = Deno.makeTempFileSync({ suffix: ".csd" })

      try {
        Deno.writeTextFileSync(csdPath, csdText)
        const output = (options.output as string | undefined) ?? "dac"
        new Deno.Command("csound.exe", { args: [csdPath, "-o", output] }).outputSync()
      } finally {
        Deno.removeSync(csdPath)
      }
    })
    .parse(Deno.args)
}
