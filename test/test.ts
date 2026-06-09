import { parseTseFile } from "../src/parser.ts"

Deno.test({name: "parse without throwing", fn() {
  parseTseFile("test/dsl.tse")
}})
