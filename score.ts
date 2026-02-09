export class ScoreLine {
  constructor(
    public instrumentIdx: number,
    public note: Note,
    public duration: Duration,
    public startOffset: number,
    // TODO: velocity / amplitude
    public args: string[] = [],
  ) {}

  playLength(): number {
    const d = this.duration
    return d.noteLength * d.soundRatio
  }
}

export type Duration = {
  // How long relative to the note length to hold for.
  soundRatio: number
  // Note length relative to a crotchet / quarter note.
  noteLength: number
}

export class Note {
  frequency: number
  pitch: string

  constructor(pitch?: string) {
    if (pitch == null) {
      this.pitch = ""
    }

    this.frequency = 0
    this.pitch = pitch!
  }

  static fromFrequency(frequency: number): Note {
    const ret = new Note()
    ret.frequency = frequency
    return ret
  }
}

export class Bar {
  constructor(
    public contents: ScoreLine[],
    public bpm: number,
    public timeSignature: TimeSignature,
  ) {}

  render(startTime: number): string {
    const noteSpeed = this.noteSpeed()
    return this.contents
      .map((itm) => {
        return `i${itm.instrumentIdx} ${
          itm.startOffset * noteSpeed + startTime
        } ${itm.playLength() * noteSpeed} ${itm.note.frequency} 0.5 ${itm.args.join(" ")}`
      })
      .join("\n")
  }

  noteSpeed(): number {
    // Csound runs at 60bpm
    return (60 * (this.timeSignature.doubleTime ? 2 : 1)) / this.bpm
  }

  barDuration(): number {
    return this.timeSignature.beatsPerBar * this.noteSpeed()
  }
}

export type TimeSignature = {
  beatsPerBar: number
  doubleTime: boolean
}
