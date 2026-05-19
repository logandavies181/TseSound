import { GenericNoteName, KeyMode, notesInKey } from "../src/key.ts"

import { assertEquals } from "@std/assert"
import { parseGenericNoteName } from "../index.ts"

// mustParseGenericNoteName
function m(s: string): GenericNoteName {
  const n = parseGenericNoteName(s)
  if (n === null) {
    throw `could not parse ${s}`
  }

  return n as GenericNoteName
}

type test = {
  tonic: string
  mode: KeyMode
  expected: GenericNoteName[]
}

const tests: test[] = [
  {
    tonic: "f",
    mode: KeyMode.major,
    expected: [
      m("f"),
      m("g"),
      m("a"),
      m("bb"),
      m("c"),
      m("d"),
      m("e"),
      m("f"),
    ],
  },
]

for (const t of tests) {
  const key = {
    tonic: m(t.tonic),
    mode: t.mode,
  }
  const got = notesInKey(key)
  console.log(got)
  assertEquals(got, t.expected)
}
