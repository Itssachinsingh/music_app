import React, { useState } from "react";
import { toast } from "react-toastify";


const AudioControls = ({
  isPlaying,
  onPlayPauseClick,
  onPrevClick,
  onNextClick,
  currentTrack,
  favorites,
  setFavorites
}) => {

  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleAddToFavorites = () => {
    if (!favorites.find((t) => t.id === currentTrack.id)) {
      setFavorites([currentTrack, ...favorites]);
      toast.success("Added to Favorites!");
    } else {
      toast.info("Already in Favorites");
    }
    setShowDropdown(false);
  };
  return (
    <div className="audio-controls">
      <div className="sub_buttons">
        <div className="more-options">
          <button onClick={toggleDropdown}>      <i class="fa-solid fa-ellipsis fa-xl"></i>
          </button>
          {showDropdown && (
            <div className="dropdown">
              <p onClick={handleAddToFavorites}>Add to Favorites</p>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="prev"
        aria-label="Previous"
        onClick={onPrevClick}
      >
        <i class="fa-solid fa-backward fa-xl"></i>
      </button>
      {isPlaying ? (
        <button
          type="button"
          className="pause"
          onClick={() => onPlayPauseClick(false)}
          aria-label="Pause"
        >
          <i class="fa-solid fa-pause fa-xl"></i>
        </button>
      ) : (
        <button
          type="button"
          className="play"
          onClick={() => onPlayPauseClick(true)}
          aria-label="Play"
        >
          <i class="fa-solid fa-play fa-xl"></i>
        </button>
      )}
      <button
        type="button"
        className="next"
        aria-label="Next"
        onClick={onNextClick}
      >
        <i class="fa-solid fa-forward fa-xl"></i>
      </button>
      <div className="sub_buttons">
        <i class="fa-solid fa-volume-high fa-lg"></i>
      </div>
    </div>
  );
}
export default AudioControls;
