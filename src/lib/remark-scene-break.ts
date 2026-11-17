import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

// สัญลักษณ์ที่นับเป็นตัวแบ่งฉาก (เว้นวรรคได้) — เพิ่ม/ลดได้ตามที่ใช้จริง
// ใช้ whitelist แทน "อะไรก็ได้ที่ไม่ใช่ตัวอักษร" เพื่อไม่ให้บรรทัดอย่าง …… หรือ ！？ ถูกจัดกลางไปด้วย
const SCENE_BREAK_RE = /^[◇◆○●◎□■△▲▽▼☆★＊※♢♦\s]+$/u

export default function remarkSceneBreak() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node) => {
      // ต้องเป็น paragraph ที่มีข้อความล้วนก้อนเดียว (ไม่มีตัวหนา ลิงก์ ฯลฯ ปน)
      if (node.children.length !== 1) return
      const child = node.children[0]
      if (child.type !== 'text') return

      // ตัด zero-width space ที่ ContentReader ใส่ไว้ และช่องว่างหัวท้าย
      const text = child.value.replace(/​/g, '').trim()
      if (!text || !SCENE_BREAK_RE.test(text)) return

      child.value = text // ไม่ตัดออก ช่องว่างที่เยื้องไว้จะดันให้ไม่ตรงกลาง (เพราะ whitespace-pre-wrap)
      node.data = { ...node.data, hProperties: { className: ['scene-break'] } }
    })
  }
}
