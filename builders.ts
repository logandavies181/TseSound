import { Bar, Note, ScoreLine } from "./score.ts"

export class ScoreBuilder {
  constructor(private bars: Bar[] = []) {}

  push(...bars: Bar[]): number {
    return this.bars.push(...bars)
  }

  pushNotes(bar: number, instrumentIdx: number, notes: Note[]): void {
    let currBar = bar
    let offset = 0
    for (const note of notes) {
      this.bars[currBar].contents.push(new ScoreLine(instrumentIdx, note, offset))
      offset += note.duration.noteLength

      const timeSignature = this.bars[currBar].timeSignature
      if (offset >= timeSignature) {
        offset -= timeSignature
        currBar++
      }
    }
  }

  renderLines(): string[] {
    let time = 0
    return this.bars.map((itm) => {
      const line = itm.render(time)
      time += itm.barDuration()
      return line
    })
  }

  render(): string {
    return this.renderLines().join("\n")
  }
}
