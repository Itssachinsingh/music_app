import React, { useRef } from "react";
import { tilt, untilt } from "../lib/tilt";
import { Cover, Equalizer } from "./ui";

const FeaturedRow = ({ tracks, currentId, isPlaying, onPlay }) => {
  const scroller = useRef(null);
  const scroll = (dir) => {
    const el = scroller.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="featured">
      <div className="section-head">
        <h3 className="section-title">Featured for you</h3>
        <div className="row-arrows">
          <button type="button" className="icon-btn sm" onClick={() => scroll(-1)} aria-label="Scroll left">
            <i className="fa-solid fa-chevron-left" />
          </button>
          <button type="button" className="icon-btn sm" onClick={() => scroll(1)} aria-label="Scroll right">
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      </div>
      <div className="card-row" ref={scroller}>
        {tracks.map((t, i) => {
          const active = t.id === currentId;
          return (
            <article
              key={t.id}
              className={`card ${active ? "active" : ""}`}
              style={{ "--i": i }}
              onMouseMove={tilt}
              onMouseLeave={untilt}
              onClick={() => onPlay(t)}
              onKeyDown={(e) => e.key === "Enter" && onPlay(t)}
              tabIndex={0}
              role="button"
              aria-label={`Play ${t.title} by ${t.artist}`}
            >
              <Cover track={t} className="card-cover">
                <span className="glare" />
                <span className="card-play">
                  <i className={`fa-solid ${active && isPlaying ? "fa-pause" : "fa-play"}`} />
                </span>
                {active && <Equalizer playing={isPlaying} className="card-eq" />}
              </Cover>
              <h4>{t.title}</h4>
              <p>{t.artist}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedRow;
