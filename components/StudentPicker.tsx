"use client";

import { useMemo, useRef, useState } from "react";
import type { Student } from "@/components/lib/students";

export default function StudentPicker({
  students,
  value,
  onChange,
  doneNos,
  placeholder = "학번 또는 이름 검색",
}: {
  students: Student[];
  value: Student | null;
  onChange: (s: Student) => void;
  doneNos?: Set<string>;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return students;
    return students.filter(s => s.no.includes(q) || s.name.includes(q));
  }, [students, query]);

  function pick(s: Student) {
    onChange(s);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="hy-input"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ color: value ? "var(--text)" : "var(--text-subtle)", fontWeight: value ? 700 : 500 }}>
          {value ? `${value.name} (${value.no})` : "학번·이름 선택하기"}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
            background: "#fff", border: "1.5px solid var(--border)", borderRadius: 16,
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)", padding: 10,
          }}
        >
          <input
            autoFocus
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="hy-input"
            style={{ marginBottom: 8 }}
          />
          <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-subtle)", textAlign: "center", padding: "12px 0", margin: 0 }}>
                검색 결과가 없어요
              </p>
            ) : filtered.map(s => (
              <button
                key={s.no}
                type="button"
                onClick={() => pick(s)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", borderRadius: 12, border: "none",
                  background: value?.no === s.no ? "var(--primary-light)" : "transparent",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--primary-light)")}
                onMouseLeave={e => (e.currentTarget.style.background = value?.no === s.no ? "var(--primary-light)" : "transparent")}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  {s.name} <span style={{ fontSize: 12, color: "var(--text-subtle)", fontWeight: 500 }}>({s.no})</span>
                </span>
                {doneNos?.has(s.no) && <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>✅</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 10 }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
