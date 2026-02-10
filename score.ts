export class ScoreLine {
  constructor(
    public instrumentIdx: number,
    public note: Note,
    public startOffset: number,
    // TODO: velocity / amplitude
    public args: string[] = [],
  ) {}

  playLength(): number {
    const d = this.note.duration
    return d.noteLength * d.soundRatio
  }
}

export type Note = {
  pitch: Pitch
  duration: Duration
}

export type Chord = {
  pitches: Pitch[]
  duration: Duration
}

export type Duration = {
  // How long relative to the note length to hold for.
  soundRatio: number
  // Note length relative to a crotchet / quarter note.
  noteLength: number
}

export class Pitch {
  frequency: number
  pitch: string

  constructor(pitch?: string) {
    if (pitch == null) {
      this.pitch = ""
    }

    this.frequency = 0
    this.pitch = pitch!
  }

  static fromFrequency(frequency: number): Pitch {
    const ret = new Pitch()
    ret.frequency = frequency
    return ret
  }
}

export class Bar {
  constructor(
    public contents: ScoreLine[],
    public bpm: number,
    // Reduced fractional time signature. 4/4 = 1.
    public timeSignature: number,
  ) {}

  render(startTime: number): string {
    const noteSpeed = this.noteSpeed()
    return this.contents
      .map((itm) => {
        return `i${itm.instrumentIdx} ${
          itm.startOffset * noteSpeed + startTime
        } ${itm.playLength() * noteSpeed} ${itm.note.pitch.frequency} 0.5 ${itm.args.join(" ")}`
      })
      .join("\n")
  }

  noteSpeed(): number {
    // Csound runs at 60bpm
    return 60 / this.bpm
  }

  barDuration(): number {
    return this.timeSignature * this.noteSpeed()
  }
}
