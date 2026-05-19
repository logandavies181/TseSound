import { GenericNoteName } from "../src/key.ts"

import { assertEquals } from "@std/assert"
import { parseGenericNoteName } from "../index.ts"

type test = {
  input: string
  expected: GenericNoteName | null
}

const tests: test[] = [
  {
    input: "f",
    expected: { letter: "f", accidental: "" },
  },
  {
    input: "bb",
    expected: { letter: "b", accidental: "b" },
  },
]

for (const t of tests) {
  assertEquals(parseGenericNoteName(t.input), t.expected)
}
