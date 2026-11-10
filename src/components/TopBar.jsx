import React from "react";

const TopBar = ({ query, onQuery, searchRef, onMenu, onUpload, onVisualizer }) => (
  <header className="topbar">
    <button type="button" className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
      <i className="fa-solid fa-bars" />
    </button>
    <label className="search">
      <i className="fa-solid fa-magnifying-glass" />
      <input
        ref={searchRef}
        type="text"
        placeholder="Search songs, artists, albums"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        aria-label="Search"
      />
      {query ? (
        <button type="button" className="search-clear" onClick={() => onQuery("")} aria-label="Clear search">
          <i className="fa-solid fa-xmark" />
        </button>
      ) : (
        <kbd>/</kbd>
      )}
    </label>
    <div className="topbar-actions">
      <button type="button" className="icon-btn" onClick={onVisualizer} aria-label="Open light show" title="Light show (F)">
        <i className="fa-solid fa-wave-square" />
      </button>
      <button type="button" className="btn btn-primary btn-shine" onClick={onUpload}>
        <i className="fa-solid fa-cloud-arrow-up" />
        <span>Upload</span>
      </button>
    </div>
  </header>
);

export default TopBar;
