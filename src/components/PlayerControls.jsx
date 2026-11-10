import React, { useState } from "react";
import { useCurrentTime } from "../hooks/useAudioEngine";
import { formatTime } from "../lib/format";

export const Controls = ({ isPlaying, onToggle, onPrev, onNext, shuffle, onShuffle, repeat, onRepeat, large }) => (
  <div className={`controls ${large ? "controls-lg" : ""}`}>
    <button
      type="button"
      className={`icon-btn ctrl-toggle ctrl-extra ${shuffle ? "on" : ""}`}
      onClick={onShuffle}
      aria-label="Shuffle"
      aria-pressed={shuffle}
      title="Shuffle"
    >
      <i className="fa-solid fa-shuffle" />
    </button>
    <button type="button" className="icon-btn" onClick={onPrev} aria-label="Previous" title="Previous">
      <i className="fa-solid fa-backward-step" />
    </button>
    <button
      type="button"
      className={`play-btn ${isPlaying ? "is-playing" : ""}`}
      onClick={onToggle}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      <span className="play-icon">
        <i className="fa-solid fa-play" />
        <i className="fa-solid fa-pause" />
      </span>
    </button>
    <button type="button" className="icon-btn" onClick={onNext} aria-label="Next" title="Next">
      <i className="fa-solid fa-forward-step" />
    </button>
    <button
      type="button"
      className={`icon-btn ctrl-toggle ctrl-extra ${repeat !== "off" ? "on" : ""}`}
      onClick={onRepeat}
      aria-label={`Repeat ${repeat}`}
      title={`Repeat: ${repeat}`}
    >
      <i className="fa-solid fa-repeat" />
      {repeat === "one" && <span className="repeat-one">1</span>}
    </button>
  </div>
);

export const SeekBar = ({ audio, duration, onSeek }) => {
  const currentTime = useCurrentTime(audio);
  const [hover, setHover] = useState(null);
  const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    setHover({ x, t: (x / r.width) * duration });
  };

  return (
    <div className="seek">
      <span className="seek-time">{formatTime(currentTime)}</span>
      <div
        className="seek-track"
        style={{ "--progress": `${pct}%` }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <div className="seek-rail">
          <div className="seek-fill" />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Seek"
          disabled={!duration}
        />
        {hover && duration > 0 && (
          <span className="seek-tip" style={{ left: hover.x }}>
            {formatTime(hover.t)}
          </span>
        )}
      </div>
      <span className="seek-time">{formatTime(duration)}</span>
    </div>
  );
};

export const VolumeControl = ({ volume, muted, onVolume, onMute }) => {
  const level = muted ? 0 : volume;
  const icon = level === 0 ? "fa-volume-xmark" : level < 0.5 ? "fa-volume-low" : "fa-volume-high";
  return (
    <div className="volume">
      <button type="button" className="icon-btn sm" onClick={onMute} aria-label={muted ? "Unmute" : "Mute"} title="Mute (M)">
        <i className={`fa-solid ${icon}`} />
      </button>
      <div className="slider" style={{ "--level": `${level * 100}%` }}>
        <div className="slider-rail">
          <div className="slider-fill" />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={level}
          onChange={(e) => onVolume(Number(e.target.value))}
          aria-label="Volume"
        />
      </div>
    </div>
  );
};
