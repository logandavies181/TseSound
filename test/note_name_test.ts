import { assertEquals } from "@std/assert"
import { NoteName, parseNoteName } from "../index.ts"

type test = {
  input: string
  expected: NoteName | null
}

const tests: test[] = [
  {
    input: "f0",
    expected: { letter: "f", accidental: "", octave: 0 },
  },
  {
    input: "eb6",
    expected: { letter: "e", accidental: "b", octave: 6 },
  },
]

for (const t of tests) {
  assertEquals(parseNoteName(t.input), t.expected)
}
