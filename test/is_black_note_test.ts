import { assertEquals } from "@std/assert"

import { isBlackNote, mustParseNoteName } from "../index.ts"

Deno.test({name: "is_black_note", fn() {
  type test = {
    input: string
    expected: boolean
  }

  const tests: test[] = [
    {
      input: "c0",
      expected: false,
    },
    {
      input: "cs0",
      expected: true,
    },
  ]

  for (const t of tests) {
    assertEquals(isBlackNote(mustParseNoteName(t.input)), t.expected)
  }
}})
