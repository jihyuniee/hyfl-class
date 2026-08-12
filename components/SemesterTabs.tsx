"use client";

import { SEMESTERS, type SemesterId } from "@/components/lib/semester";

export default function SemesterTabs({
  value,
  onChange,
}: {
  value: SemesterId;
  onChange: (id: SemesterId) => void;
}) {
  return (
    <div role="tablist" aria-label="학기 선택" style={{ display: "flex", gap: 8 }}>
      {SEMESTERS.map(s => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={active}
            className={active ? "hy-btn hy-btn-primary" : "hy-btn"}
            style={{ fontSize: 13, padding: "8px 20px" }}
            onClick={() => onChange(s.id)}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
