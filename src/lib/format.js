export const formatTime = (sec) => {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

// Built-in tracks store "m:ss" strings, uploads store seconds
export const displayDuration = (d) =>
  typeof d === "number" ? (d > 0 ? formatTime(d) : "--:--") : d || "--:--";

// "Artist - Title.mp3" -> { artist, title }
export const parseFileName = (name) => {
  const base = name.replace(/\.[^.]+$/, "").replace(/_+/g, " ").trim();
  const parts = base.split(/\s+-\s+/);
  return parts.length >= 2
    ? { artist: parts[0], title: parts.slice(1).join(" - ") }
    : { artist: "", title: base };
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Late night session";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};
