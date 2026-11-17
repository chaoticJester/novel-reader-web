const RUBY_RE = /\{([^{}|]+)\|([^{}]+)\}/g

export default function RubyText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let last = 0

  for (const m of text.matchAll(RUBY_RE)) {
    const start = m.index!
    if (start > last) parts.push(text.slice(last, start))
    parts.push(
      <ruby key={start}>
        {m[1]}<rp>(</rp><rt>{m[2]}</rt><rp>)</rp>
      </ruby>
    )
    last = start + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))

  return <>{parts}</>
}