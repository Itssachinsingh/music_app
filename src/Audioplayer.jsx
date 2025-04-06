import React, { useState, useEffect, useRef } from "react";
import AudioControls from "./AudioControls";
import Backdrop from "./BackDrop";


const AudioPlayer = ({
  tracks,
  currentTrack,
  setCurrentTrack,
  onTrackPlay,
  favorites,
  setFavorites,
  onAddToFavorites,
}) => {
  // State
  const [trackProgress, setTrackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const trackIndex = tracks.findIndex((t) => t.id === currentTrack.id);

  // Destructure for conciseness
  const { title, artist, color, image, audioSrc } = currentTrack;

  // Refs
  const audioRef = useRef(new Audio(audioSrc));
  const intervalRef = useRef();
  const isReady = useRef(false);

  // Destructure for conciseness
  const { duration } = audioRef.current;

  const currentPercentage = duration
    ? `${(trackProgress / duration) * 100}%`
    : "0%";
  const trackStyling = `
    -webkit-gradient(linear, 0% 0%, 100% 0%, color-stop(${currentPercentage}, #fff), color-stop(${currentPercentage}, #777))
  `;

  const startTimer = () => {
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (audioRef.current.ended) {
        toNextTrack();
      } else {
        setTrackProgress(audioRef.current.currentTime);
      }
    }, [1000]);
  };

  const onScrub = (value) => {
    // Clear any timers already running
    clearInterval(intervalRef.current);
    audioRef.current.currentTime = value;
    setTrackProgress(audioRef.current.currentTime);
  };

  const onScrubEnd = () => {
    // If not already playing, start
    if (!isPlaying) {
      setIsPlaying(true);
    }
    startTimer();
  };

  const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);


  const toNextTrack = () => {
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];
    setCurrentTrack(nextTrack);
    onTrackPlay(nextTrack);
  };

  const toPrevTrack = () => {
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const prevTrack = tracks[prevIndex];
    setCurrentTrack(prevTrack);
    onTrackPlay(prevTrack);
  };


  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
      startTimer();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handles cleanup and setup when changing tracks
  useEffect(() => {
    if (!audioSrc) return;
    audioRef.current.pause();
    audioRef.current = new Audio(audioSrc);
    setTrackProgress(0);

    if (isReady.current) {
      audioRef.current.play();
      setIsPlaying(true);
      startTimer();
    } else {
      isReady.current = true;
    }
  }, [currentTrack]);

  return (  
    <div className="audio-player">
      <div className="track-info">
        <h2 className="title">{title}</h2>
        <h3 className="artist">{artist}</h3>
        <img
          className="artwork"
          src={image}
          alt={`track artwork for ${title} by ${artist}`}
        />


        <input
          type="range"
          value={trackProgress}
          step="1"
          min="0"
          max={duration ? duration : `${duration}`}
          className="progress"
          onChange={(e) => onScrub(e.target.value)}
          onMouseUp={onScrubEnd}
          onKeyUp={onScrubEnd}
          style={{ background: trackStyling }}
        />
        <AudioControls
          isPlaying={isPlaying}
          onPrevClick={toPrevTrack}
          onNextClick={toNextTrack}
          onPlayPauseClick={setIsPlaying}
          onTrackPlay={onTrackPlay}
          currentTrack={currentTrack}
          favorites={favorites}
          setFavorites={setFavorites}
        />

      </div>
      <Backdrop
        trackIndex={trackIndex}
        activeColor={color}
        isPlaying={isPlaying}
      />

    </div>
  );
};

export default AudioPlayer;
