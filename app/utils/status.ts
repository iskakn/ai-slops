export type Tone = 'muted' | 'positive' | 'negative'

export interface StatusMessage {
  readonly text: string
  readonly tone: Tone
}

export const TONE_TEXT_CLASS: Record<Tone, string> = {
  muted: 'text-muted',
  positive: 'text-green-500',
  negative: 'text-red-500'
}
