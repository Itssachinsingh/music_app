import React from "react";

// Full-screen "stage lighting": colour washes, sweeping beams and a beat flash.
// Everything reacts to the --bass / --mid / --treble / --pulse vars set by useAudioLevels.
const AmbientLights = ({ image, playing, flash }) => (
  <div className={`ambient ${playing ? "is-playing" : ""} ${flash ? "flash-on" : ""}`} aria-hidden="true" data-reactive>
    {image && <div key={image} className="ambient-art" style={{ backgroundImage: `url("${image}")` }} />}
    <div className="light light-1" />
    <div className="light light-2" />
    <div className="light light-3" />
    <div className="beams">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="beam" />
      ))}
    </div>
    <div className="flash" />
    <div className="vignette" />
    <div className="grain" />
  </div>
);

export default AmbientLights;
