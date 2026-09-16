const rtf = new Intl.RelativeTimeFormat('th-TH', {numeric: 'auto'})

//Time unit from smallest to largest
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

export function formatRelativeTime(iso: string): string {
  let duration = (new Date(iso).getTime() - Date.now()) / 1000
  for (const division of DIVISIONS) {
    if(Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return ''
}
