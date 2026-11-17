import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

// ย่อหน้าที่เขียนแบบ ->ข้อความ<- จะถูกจัดกึ่งกลาง
export default function remarkCenter() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node) => {
      const first = node.children[0]
      const last = node.children[node.children.length - 1]
      // ต้นและท้ายต้องเป็นข้อความธรรมดา (ข้างในจะมีตัวหนา ลิงก์ ฯลฯ ก็ได้)
      if (first?.type !== 'text' || last?.type !== 'text') return

      // ตัด zero-width space ที่ ContentReader ใส่ไว้ และช่องว่างต้นบรรทัด
      const head = first.value.replace(/^[\u200B\s]+/, '')
      if (!head.startsWith('->')) return
      if (!last.value.trimEnd().endsWith('<-')) return

      first.value = head.slice(2).trimStart()
      last.value = last.value.trimEnd().slice(0, -2).trimEnd()

      node.data = { ...node.data, hProperties: { className: ['center-line'] } }
    })
  }
}