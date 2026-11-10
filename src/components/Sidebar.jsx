import React from "react";
import profile from "../images/profile.png";
import { Equalizer } from "./ui";

export const NAV = [
  { id: "discover", label: "Discover", icon: "fa-compass" },
  { id: "favorites", label: "Favorites", icon: "fa-heart" },
  { id: "recent", label: "Recently Played", icon: "fa-clock-rotate-left" },
  { id: "uploads", label: "My Uploads", icon: "fa-cloud-arrow-up" },
];

const Sidebar = ({ view, onNavigate, counts, open, onClose, onUpload, isPlaying }) => (
  <>
    <div className={`sidebar-scrim ${open ? "show" : ""}`} onClick={onClose} />
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <span className="brand-mark">
          <Equalizer playing={isPlaying} />
        </span>
        <span className="brand-name">Pulse</span>
      </div>

      <nav className="nav" style={{ "--active": NAV.findIndex((n) => n.id === view) }}>
        <span className="nav-indicator" />
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${view === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <i className={`fa-solid ${item.icon}`} />
            <span>{item.label}</span>
            {counts[item.id] > 0 && <span className="nav-count">{counts[item.id]}</span>}
          </button>
        ))}
      </nav>

      <div className="upload-card">
        <div className="upload-card-glow" />
        <i className="fa-solid fa-wand-magic-sparkles upload-card-icon" />
        <h4>Bring your own music</h4>
        <p>Drop audio files anywhere. Tags and cover art are read automatically.</p>
        <button type="button" className="btn btn-primary btn-sm btn-shine" onClick={onUpload}>
          <i className="fa-solid fa-plus" /> Upload songs
        </button>
      </div>

      <div className="profile-chip">
        <img src={profile} alt="" />
        <div>
          <strong>Your library</strong>
          <span>{counts.uploads} uploaded · {counts.favorites} liked</span>
        </div>
      </div>
    </aside>
  </>
);

export default Sidebar;
