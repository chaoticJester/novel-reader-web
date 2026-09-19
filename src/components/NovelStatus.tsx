'use client'

type Status = "ongoing" | "completed" | "hiatus" | "dropped";

const STATUS_STYLES: Record<Status, { label: string; color: string }> = {
  ongoing:   { label: "ยังไม่จบ",   color: "#39ff14" }, // neon green
  completed: { label: "จบแล้ว", color: "#1ea7ff" }, // blue
  hiatus:    { label: "หยุดเขียน",    color: "#ffb300" }, // amber
  dropped:   { label: "ไม่เขียนต่อ",   color: "#ff3b3b" }, // red
};

export default function NovelStatus({ novelStatus }: { novelStatus: string }) {
  const status = STATUS_STYLES[novelStatus as Status];

  if (!status) return null; // unknown status → render nothing

  return (
    <div
      className="inline-block border dark:bg-black rounded px-2.5 py-1.5 text-sm"
      style={{
        borderColor: status.color,
        color: status.color,
        boxShadow: `0 0 1px ${status.color}, 0 0 5px ${status.color}`,
        maxWidth: "250px",
      }}
    >
      {status.label}
    </div>
  );
}