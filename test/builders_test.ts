import { assertStringIncludes } from "@std/assert"
import { BuilderV2 } from "../src/builders_v2.ts"

Deno.test("BuilderV2 loads and renders an ORC instrument", async () => {
  const orcPath = await Deno.makeTempFile({ suffix: ".orc" })
  try {
    await Deno.writeTextFile(orcPath, "instr 17\n  outs 0, 0\nendin\n")

    const builder = new BuilderV2()
    builder.addInstrument("custom", orcPath)

    assertStringIncludes(builder.render(), "instr 1\n  outs 0, 0\nendin")
  } finally {
    await Deno.remove(orcPath)
  }
})
