import { visit, SKIP } from 'unist-util-visit'
import type { Root, Text, PhrasingContent } from 'mdast'

// จับ {คำหลัก|ตัวบน}  — ห้ามมี { } | ในคำหลัก, ห้ามมี { } ในตัวบน
const RUBY_RE = /\{([^{}|]+)\|([^{}]+)\}/g

export default function remarkRuby() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return

      const value = node.value
      const matches = [...value.matchAll(RUBY_RE)]
      if (matches.length === 0) return

      const newNodes: PhrasingContent[] = []
      let last = 0

      for (const m of matches) {
        const start = m.index!
        const [whole, base, ruby] = m

        // ข้อความธรรมดาก่อนหน้า match
        if (start > last) {
          newNodes.push({ type: 'text', value: value.slice(last, start) })
        }

        // node ruby: ใช้ text node เป็นตัวถือ แล้วสั่งให้กลายเป็น <ruby>
        newNodes.push({
          type: 'text',
          value: base,
          data: {
            hName: 'ruby',
            hChildren: [
              { type: 'text', value: base },
              { type: 'element', tagName: 'rp', properties: {}, children: [{ type: 'text', value: '(' }] },
              { type: 'element', tagName: 'rt', properties: {}, children: [{ type: 'text', value: ruby }] },
              { type: 'element', tagName: 'rp', properties: {}, children: [{ type: 'text', value: ')' }] },
            ],
          },
        } as PhrasingContent)

        last = start + whole.length
      }

      // ข้อความที่เหลือหลัง match สุดท้าย
      if (last < value.length) {
        newNodes.push({ type: 'text', value: value.slice(last) })
      }

      // แทนที่ node เดิมด้วยชุดใหม่ แล้วข้ามไปไม่ต้องเดินซ้ำ node ที่เพิ่งใส่
      parent.children.splice(index, 1, ...newNodes)
      return [SKIP, index + newNodes.length]
    })
  }
}