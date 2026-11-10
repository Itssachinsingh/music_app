import React from "react";

export const Cover = ({ track, className = "", children }) => (
  <div className={`cover ${className}`} style={{ "--cover-color": track?.color || "#7c5cff" }}>
    {track?.image ? (
      <img src={track.image} alt="" draggable="false" />
    ) : (
      <i className="fa-solid fa-music cover-fallback" />
    )}
    {children}
  </div>
);

export const Equalizer = ({ playing, bars = 4, className = "" }) => (
  <span className={`eq ${playing ? "playing" : ""} ${className}`} aria-hidden="true">
    {Array.from({ length: bars }, (_, i) => (
      <span key={i} style={{ "--d": `${i * -0.27}s` }} />
    ))}
  </span>
);

export const LikeButton = ({ liked, onClick, className = "" }) => (
  <button
    type="button"
    className={`like ${liked ? "on" : ""} ${className}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label={liked ? "Remove from favorites" : "Add to favorites"}
    aria-pressed={liked}
  >
    <i className={`${liked ? "fa-solid" : "fa-regular"} fa-heart`} />
  </button>
);

export const EmptyState = ({ icon, title, text, children }) => (
  <div className="empty">
    <div className="empty-icon">
      <i className={`fa-solid ${icon}`} />
    </div>
    <h3>{title}</h3>
    <p>{text}</p>
    {children}
  </div>
);

export const Dropzone = ({ onBrowse, compact }) => (
  <button type="button" className={`dropzone ${compact ? "compact" : ""}`} onClick={onBrowse}>
    <span className="dropzone-icon">
      <i className="fa-solid fa-cloud-arrow-up" />
    </span>
    <span className="dropzone-text">
      <strong>{compact ? "Add more songs" : "Drag & drop your songs here"}</strong>
      <span>or click to browse - MP3, WAV, M4A, OGG, FLAC. Tags and cover art are read automatically.</span>
    </span>
  </button>
);

export const DropOverlay = ({ active }) => (
  <div className={`drop-overlay ${active ? "show" : ""}`} aria-hidden="true">
    <div className="drop-box">
      <div className="drop-icon">
        <i className="fa-solid fa-cloud-arrow-up" />
      </div>
      <h3>Drop to add to your library</h3>
      <p>We'll read the title, artist and cover art from each file</p>
    </div>
  </div>
);
