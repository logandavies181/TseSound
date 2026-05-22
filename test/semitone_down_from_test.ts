import { assertEquals } from "@std/assert"
import { parseNoteName, semitoneDownFrom } from "../index.ts"

type test = {
  input: string
  expected: ReturnType<typeof semitoneDownFrom>
}

const tests: test[] = [
  {
    input: "f0",
    expected: { letter: "f", accidental: "b", octave: 0 },
  },
  {
    input: "fs0",
    expected: { letter: "f", accidental: "", octave: 0 },
  },
  {
    input: "cb1",
    expected: { letter: "b", accidental: "b", octave: 0 },
  },
  {
    input: "ab0",
    expected: { letter: "g", accidental: "", octave: 0 },
  },
]

for (const t of tests) {
  const input = parseNoteName(t.input)
  assertEquals(semitoneDownFrom(input!), t.expected)
}
