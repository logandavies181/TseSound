import { Bar } from "./score.ts";

export class ScoreBuilder {
  constructor(
    private bars: Bar[] = []
  ) {}

  push(...bars: Bar[]): number {
    return this.bars.push(...bars)
  }

  renderLines(): string[] {
    let time = 0
    return this.bars.map(itm => {
      const line = itm.render(time)
      time += itm.barDuration()
      return line
    })
  }

  render(): string {
    return this.renderLines().join("\n")
  }
}
