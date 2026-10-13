export default function WalkIcon({ name }: { name: "map" | "plant" | "camera" }) {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "map" ? <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z" /><path d="M9 3v16M15 5v16" /></> : name === "plant" ? <><path d="M20 4c-7-1-14 1-14 8 0 4 5 6 9 3 4-3 5-7 5-11Z" /><path d="M4 21c1-6 5-10 11-13" /></> : <><path d="M3 7h4l2-3h6l2 3h4v13H3z" /><circle cx="12" cy="13" r="4" /></>}
  </svg>;
}
