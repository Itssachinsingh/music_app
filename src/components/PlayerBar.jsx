import React from "react";
import Visualizer from "./Visualizer";
import { Controls, SeekBar, VolumeControl } from "./PlayerControls";
import { Cover, LikeButton } from "./ui";

const PlayerBar = ({ track, engine, levels, accent, liked, onLike, controls, onOpen }) => (
  <footer className={`player-bar ${engine.isPlaying ? "is-playing" : ""}`} data-reactive>
    <div className="pb-track">
      <button type="button" className="pb-cover" onClick={onOpen} aria-label="Open now playing">
        <Cover track={track} />
        <span className="pb-cover-expand">
          <i className="fa-solid fa-up-right-and-down-left-from-center" />
        </span>
      </button>
      <div className="pb-info" key={track.id}>
        <strong>{track.title}</strong>
        <span>{track.artist}</span>
      </div>
      <LikeButton liked={liked} onClick={onLike} />
    </div>

    <div className="pb-center">
      <Controls {...controls} isPlaying={engine.isPlaying} />
      <SeekBar audio={engine.audio} duration={engine.duration} onSeek={engine.seek} />
    </div>

    <div className="pb-side">
      <Visualizer levels={levels} mode="mini" accent={accent} className="pb-spectrum" />
      <VolumeControl
        volume={engine.volume}
        muted={engine.muted}
        onVolume={(v) => {
          engine.setVolume(v);
          if (v > 0) engine.setMuted(false);
        }}
        onMute={() => engine.setMuted(!engine.muted)}
      />
      <button type="button" className="icon-btn" onClick={onOpen} aria-label="Open light show" title="Light show (F)">
        <i className="fa-solid fa-expand" />
      </button>
    </div>
  </footer>
);

export default PlayerBar;
