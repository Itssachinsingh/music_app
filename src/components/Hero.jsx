import React from "react";
import { tilt, untilt } from "../lib/tilt";
import { Cover, Equalizer, LikeButton } from "./ui";

const Hero = ({ track, isPlaying, liked, onToggle, onLike, onVisualizer }) => (
  <section className={`hero ${isPlaying ? "is-playing" : ""}`} onMouseMove={tilt} onMouseLeave={untilt} data-reactive>
    <div className="hero-bg">{track.image && <img key={track.image} src={track.image} alt="" />}</div>
    <div className="hero-content">
      <span className="chip">
        <Equalizer playing={isPlaying} /> {isPlaying ? "Now playing" : "Ready when you are"}
      </span>
      <h2 key={track.id} className="hero-title">
        {track.title}
      </h2>
      <p className="hero-artist">{track.artist}</p>
      <div className="hero-actions">
        <button type="button" className="btn btn-primary btn-lg play-cta" onClick={onToggle}>
          <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`} />
          {isPlaying ? "Pause" : "Play"}
        </button>
        <LikeButton liked={liked} onClick={onLike} className="like-lg" />
        <button type="button" className="btn btn-ghost" onClick={onVisualizer}>
          <i className="fa-solid fa-wand-magic-sparkles" /> Light show
        </button>
      </div>
    </div>
    <div className="hero-art-wrap">
      <div className="hero-art-glow" />
      <Cover track={track} className="hero-art">
        <span className="glare" />
      </Cover>
    </div>
  </section>
);

export default Hero;
