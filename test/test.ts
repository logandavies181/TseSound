import { parseTse } from "../src/parser.ts"
import { readFileSync } from "node:fs"

const content = readFileSync("test/dsl.tse", "utf-8")

const chords = parseTse(content, { barLength: 32, timeSignature: 1 })
console.log(`Parsed ${chords.length} chords`)
console.log(chords[1])
