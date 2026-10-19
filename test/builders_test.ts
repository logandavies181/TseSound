import { assertEquals, assertStringIncludes } from "@std/assert"
import { BuilderV2 } from "../src/builders_v2.ts"
import { n, Pitch } from "../src/score.ts"

Deno.test("BuilderV2 loads and renders a named ORC fixture", () => {
  const builder = new BuilderV2()
  let renderCount = 0

  const previousDirectory = Deno.cwd()
  Deno.chdir(`${import.meta.dirname}/fixtures`)
  try {
    builder.addInstrument("lead")
  } finally {
    Deno.chdir(previousDirectory)
  }

  builder.addBars(60, 1, 1)
  builder.pushChords(0, "lead", [n(Pitch.fromFrequency(440), 1)])
  builder.addOrcRenderer((source) => {
    renderCount++
    return source
      .replaceAll("TSE_PAN", "pan = 0.25")
      .replace("endin", "  TSE_HELLO\nendin")
  })

  const csd = builder.render()
  assertEquals(renderCount, 1)
  assertStringIncludes(csd, "pan = 0.25")
  assertStringIncludes(csd, 'i"lead_reverb" 0 1')
  assertStringIncludes(csd, 'i "lead" 0 0.8 440 0.5')

  builder.render()
  assertEquals(renderCount, 2)
})

Deno.test("BuilderV2 renders an ORC fixture and note to a CSD file", () => {
  const builder = new BuilderV2()
  const previousDirectory = Deno.cwd()
  Deno.chdir(`${import.meta.dirname}/fixtures`)
  try {
    builder.addInstrument("lead")
  } finally {
    Deno.chdir(previousDirectory)
  }

  builder.addBars(60, 1, 1)
  builder.pushChords(0, "lead", [n(Pitch.fromFrequency(440), 1)])

  const outputDirectory = `${import.meta.dirname}/output`
  Deno.mkdirSync(outputDirectory, { recursive: true })
  Deno.writeTextFileSync(`${outputDirectory}/lead.csd`, builder.render())
})
