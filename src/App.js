import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import logo from "../src/images/logo.png";
import profile_img from "../src/images/profile.png";
import starboy from "../src/images/starboy.jpg";
import tracks from "./tracks";
import AudioPlayer from "./Audioplayer";

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSongs, setFilteredSongs] = useState(tracks);
  const [currentView, setCurrentView] = useState("For You");
  const [favorites, setFavorites] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [topSongs, setTopSongs] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);

  const [sidebarOpen, setSidebarOpen] = useState(false);



  useEffect(() => {
    const result = tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSongs(result);
  }, [searchQuery]);

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    const updated = [track, ...recentlyPlayed.filter((t) => t.id !== track.id)];
    setRecentlyPlayed(updated.slice(0, 10));
  };

  return (
    <div className="main_container">
<div className="app_wrapper">
  {/* Overlay that closes sidebar on click */}
  {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
  {/* Sidebar toggle */}
  <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
 

  {/* Sidebar */}
  <div className={`container_menu ${sidebarOpen ? "open" : ""}`}>
  <div className={`logo ${sidebarOpen ? "hide-logo" : ""}`}>
      <img src={logo} alt="Logo" />
      <div className="menu">
        {["For You", "Top Tracks", "Favorites", "Recently Played"].map((item) => (
          <p
            key={item}
            className={`menu_items ${currentView === item ? "active" : ""}`}
            onClick={() => {
              setCurrentView(item);
              setSidebarOpen(false); // auto-close on menu click
            }}
          >
            {item}
          </p>
        ))}
      </div>
    </div>
    <div className="profile">
      <img src={profile_img} alt="profile" />
    </div>
  </div>

  {/* Main Content */}
  <div className="main_content">
    {/* your page content goes here */}
  </div>
</div>

      <div className="container_song">

        <div className="song_heading">
          <h2>For You</h2>
        </div>
        <div className="seach_container">
          <input
            type="search"
            placeholder="Search songs or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar"
          />
        </div>
        <div className="songs">
          {(currentView === "For You"
            ? filteredSongs
            : currentView === "Top Tracks"
            ? tracks.slice(0, 10)
            : currentView === "Favorites"
            ? favorites
            : currentView === "Recently Played"
            ? recentlyPlayed
            : []
          ).map((song) => (
            <div
              key={song.id}
              className={`song ${song.id === currentTrack?.id ? "active" : ""}`}
              onClick={() => handlePlayTrack(song)}
            >
              <div className="song_details">
                <img src={song.image} alt="song_poster" />
                <div className="song_des">
                  <h3>{song.title}</h3>
                  <p>{song.artist}</p>
                </div>
              </div>
              <div className="song_time">
                <p>{song.duration || "3:45"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container_player">
        <AudioPlayer
          tracks={tracks}
          currentTrack={currentTrack}
          setCurrentTrack={setCurrentTrack}
          onTrackPlay={handlePlayTrack}
          favorites={favorites}
          setFavorites={setFavorites}
        />
      </div>
      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
};

export default App;
