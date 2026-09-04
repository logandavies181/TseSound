import { GenericNoteName, isInKey, Key, KeyMode, notesInKey } from "../src/key.ts"

import { assertEquals } from "@std/assert"
import { NoteName, parseGenericNoteName } from "../index.ts"

function mustParseGenericNoteName(s: string): GenericNoteName {
  const n = parseGenericNoteName(s)
  if (n === null) {
    throw `could not parse ${s}`
  }

  return n as GenericNoteName
}

const m = mustParseGenericNoteName

Deno.test({
  name: "notesInKey",
  fn() {
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
      {
        tonic: "gb",
        mode: KeyMode.major,
        expected: [
          m("gb"),
          m("ab"),
          m("bb"),
          m("cb"),
          m("db"),
          m("eb"),
          m("f"),
          m("gb"),
        ],
      },
    ]

    for (const t of tests) {
      const key = {
        tonic: m(t.tonic),
        mode: t.mode,
      }
      const got = notesInKey(key)
      assertEquals(got, t.expected)
    }
  },
})

Deno.test({
  name: "isInKey",
  fn() {
    type test = {
      input: GenericNoteName
      key: Key
      expected: boolean
    }

    const tests: test[] = [
      {
        input: m("eb"),
        key: {
          tonic: m("gb"),
          mode: KeyMode.major,
        },
        expected: true,
      },
      {
        input: {
          letter: "e",
          accidental: "b",
          octave: 6,
        } as NoteName,
        key: {
          tonic: m("gb"),
          mode: KeyMode.major,
        },
        expected: true,
      },
    ]

    for (const t of tests) {
      const got = isInKey(t.input, t.key)
      assertEquals(got, t.expected)
    }
  },
})
