import React, { useCallback, useEffect, useRef, useState } from "react";
import Visualizer from "./Visualizer";
import { Controls, SeekBar } from "./PlayerControls";
import { Cover, LikeButton } from "./ui";

const MODES = [
  { id: "orb", label: "Orb", icon: "fa-circle-dot" },
  { id: "bars", label: "Bars", icon: "fa-chart-simple" },
  { id: "wave", label: "Wave", icon: "fa-wave-square" },
];

const NowPlaying = ({ track, engine, levels, accent, mode, onMode, flash, onFlash, liked, onLike, controls, onCovered, onClose }) => {
  const [closing, setClosing] = useState(false);
  const discRef = useRef(null);

  const close = useCallback(() => {
    onCovered(false);
    setClosing(true);
    setTimeout(onClose, 360);
  }, [onClose, onCovered]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      className={`np ${closing ? "closing" : ""} ${engine.isPlaying ? "is-playing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      data-reactive
      onAnimationEnd={(e) => e.animationName === "np-in" && !closing && onCovered(true)}
    >
      <div className="np-bg">{track.image && <img key={track.image} src={track.image} alt="" />}</div>
      <Visualizer levels={levels} mode={mode} accent={accent} anchor={discRef} className="np-canvas" />
      <div className={`np-flash ${flash ? "on" : ""}`} />

      <header className="np-top">
        <button type="button" className="icon-btn" onClick={close} aria-label="Close" title="Close (Esc)">
          <i className="fa-solid fa-chevron-down" />
        </button>
        <div className="segmented" style={{ "--idx": Math.max(0, MODES.findIndex((m) => m.id === mode)) }}>
          <span className="segmented-pill" />
          {MODES.map((m) => (
            <button key={m.id} type="button" className={mode === m.id ? "active" : ""} onClick={() => onMode(m.id)}>
              <i className={`fa-solid ${m.icon}`} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`icon-btn ctrl-toggle ${flash ? "on" : ""}`}
          onClick={onFlash}
          aria-pressed={flash}
          aria-label="Beat flash"
          title={flash ? "Beat flash on" : "Beat flash off"}
        >
          <i className="fa-solid fa-bolt" />
        </button>
      </header>

      <div className="np-stage">
        <div className="np-disc-wrap" ref={discRef}>
          <div className={`np-disc ${engine.isPlaying ? "spinning" : ""}`}>
            <Cover track={track} className="np-label" />
          </div>
        </div>
      </div>

      <footer className="np-bottom">
        <div className="np-meta">
          <div key={track.id} className="np-titles">
            <h2>{track.title}</h2>
            <p>{track.artist}</p>
          </div>
          <LikeButton liked={liked} onClick={onLike} className="like-lg" />
        </div>
        <SeekBar audio={engine.audio} duration={engine.duration} onSeek={engine.seek} />
        <Controls {...controls} isPlaying={engine.isPlaying} large />
        <p className="np-hint">
          <kbd>Space</kbd> play / pause <kbd>←</kbd>
          <kbd>→</kbd> seek <kbd>Shift</kbd>+<kbd>→</kbd> next <kbd>Esc</kbd> close
        </p>
      </footer>
    </div>
  );
};

export default NowPlaying;
