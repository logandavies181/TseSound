import { BuilderV2 } from "../src/builders_v2.ts"
import { n, Pitch } from "../src/score.ts"

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

  // no assertions, just don't throw
})
