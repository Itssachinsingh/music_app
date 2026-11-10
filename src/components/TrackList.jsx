import React, { useEffect, useState } from "react";
import { displayDuration } from "../lib/format";
import { Cover, Equalizer, LikeButton } from "./ui";

const RowMenu = ({ onEdit, onDelete }) => {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="menu" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={onEdit}>
        <i className="fa-solid fa-pen" /> Edit info
      </button>
      <button type="button" className="danger" onClick={() => (confirm ? onDelete() : setConfirm(true))}>
        <i className="fa-solid fa-trash" /> {confirm ? "Click again to delete" : "Delete"}
      </button>
    </div>
  );
};

const TrackList = ({ tracks, currentId, isPlaying, favorites, onPlay, onLike, onEdit, onDelete }) => {
  const [menuFor, setMenuFor] = useState(null);

  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuFor]);

  return (
    <div className="tracklist" role="list">
      <div className="tracklist-head">
        <span>#</span>
        <span>Title</span>
        <span className="col-album">Album</span>
        <span className="col-time">
          <i className="fa-regular fa-clock" />
        </span>
        <span />
      </div>
      {tracks.map((t, i) => {
        const active = t.id === currentId;
        return (
          <div
            key={t.id}
            role="listitem"
            tabIndex={0}
            className={`row ${active ? "active" : ""} ${active && isPlaying ? "playing" : ""} ${menuFor === t.id ? "menu-open" : ""}`}
            style={{ "--i": i }}
            data-reactive={active && isPlaying ? "" : undefined}
            onClick={() => onPlay(t)}
            onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && onPlay(t)}
          >
            <span className="row-index">
              {active ? <Equalizer playing={isPlaying} /> : <span className="row-num">{i + 1}</span>}
              <i className={`fa-solid ${active && isPlaying ? "fa-pause" : "fa-play"} row-hover-icon`} />
            </span>
            <div className="row-main">
              <Cover track={t} className="row-cover" />
              <div className="row-text">
                <strong>{t.title}</strong>
                <span>
                  {t.uploaded && <em className="badge">Yours</em>}
                  {t.artist}
                </span>
              </div>
            </div>
            <span className="col-album row-album">{t.album || "-"}</span>
            <span className="col-time row-time">{displayDuration(t.duration)}</span>
            <div className="row-actions">
              <LikeButton liked={favorites.has(t.id)} onClick={() => onLike(t)} />
              {t.uploaded && (
                <div className="menu-wrap">
                  <button
                    type="button"
                    className="icon-btn sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuFor(menuFor === t.id ? null : t.id);
                    }}
                    aria-label="More options"
                  >
                    <i className="fa-solid fa-ellipsis" />
                  </button>
                  {menuFor === t.id && (
                    <RowMenu
                      onEdit={() => {
                        setMenuFor(null);
                        onEdit(t);
                      }}
                      onDelete={() => {
                        setMenuFor(null);
                        onDelete(t);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrackList;
