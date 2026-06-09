import { assertEquals } from "@std/assert"
import { parseTseFile } from "../src/parser.ts"

Deno.test({
  name: "parse without throwing",
  fn() {
    const tse = parseTseFile("test/dsl.tse")
    assertEquals(tse.numHeaderLines, 10)
  },
})
