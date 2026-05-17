import { parseTse } from "../src/parser.ts"
import { readFileSync } from "node:fs"

const content = readFileSync("test/dsl.tse", "utf-8")

const bars = parseTse(content)
console.log(`Parsed ${bars.length} bars, ${bars.flat().length} chords`)
