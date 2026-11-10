import React, { useEffect, useMemo, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import builtInTracks from "./tracks";
import useAudioEngine from "./hooks/useAudioEngine";
import useAudioLevels from "./hooks/useAudioLevels";
import { deleteUpload, getAllUploads, getUpload, saveUpload } from "./lib/db";
import { extractColor, shiftHue, tune } from "./lib/color";
import { greeting } from "./lib/format";
import { loadJSON, saveJSON } from "./lib/storage";
import AmbientLights from "./components/AmbientLights";
import Sidebar, { NAV } from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Hero from "./components/Hero";
import FeaturedRow from "./components/FeaturedRow";
import TrackList from "./components/TrackList";
import PlayerBar from "./components/PlayerBar";
import NowPlaying from "./components/NowPlaying";
import UploadModal from "./components/UploadModal";
import { DropOverlay, Dropzone, EmptyState } from "./components/ui";

const VIEW_LABELS = Object.fromEntries(NAV.map((n) => [n.id, n.label]));
const REPEAT_CYCLE = { off: "all", all: "one", one: "off" };

const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const isAudioFile = (file) =>
  file.type.startsWith("audio/") || /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i.test(file.name);

const toTrack = (record) => ({
  id: record.id,
  title: record.title,
  artist: record.artist || "Unknown artist",
  album: record.album || "",
  color: record.color,
  duration: record.duration,
  audioSrc: URL.createObjectURL(record.audioBlob),
  image: record.imageBlob ? URL.createObjectURL(record.imageBlob) : null,
  imageBlob: record.imageBlob,
  addedAt: record.addedAt,
  uploaded: true,
});

const ViewHeader = ({ eyebrow, title, count, onPlayAll, onShuffleAll }) => (
  <div className="view-header">
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="view-title">{title}</h1>
      <p className="view-sub">
        {count} {count === 1 ? "song" : "songs"}
      </p>
    </div>
    {count > 0 && (
      <div className="view-actions">
        <button type="button" className="btn btn-primary" onClick={onPlayAll}>
          <i className="fa-solid fa-play" /> Play all
        </button>
        <button type="button" className="btn btn-ghost" onClick={onShuffleAll}>
          <i className="fa-solid fa-shuffle" /> Shuffle
        </button>
      </div>
    )}
  </div>
);

const App = () => {
  const [uploads, setUploads] = useState([]);
  const [view, setView] = useState("discover");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(() => loadJSON("pulse:favorites", []));
  const [recent, setRecent] = useState(() => loadJSON("pulse:recent", []));
  const [shuffle, setShuffle] = useState(() => loadJSON("pulse:shuffle", false));
  const [repeat, setRepeat] = useState(() => loadJSON("pulse:repeat", "off"));
  const [vizMode, setVizMode] = useState(() => loadJSON("pulse:viz", "orb"));
  const [flash, setFlash] = useState(() => loadJSON("pulse:flash", !reducedMotion));
  const [currentId, setCurrentId] = useState(builtInTracks[0].id);
  const [queueIds, setQueueIds] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(false);
  const [npCovered, setNpCovered] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState(null);
  const [editing, setEditing] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [accent, setAccent] = useState("#7c5cff");

  const fileInputRef = useRef(null);
  const searchRef = useRef(null);
  const mainRef = useRef(null);
  const spotRef = useRef(null);
  const spotFrame = useRef(0);
  const autoplayRef = useRef(false);
  const onEndedRef = useRef(null);
  const actionsRef = useRef({});

  const engine = useAudioEngine(onEndedRef);
  const levels = useAudioLevels(engine.analyser);

  const library = useMemo(() => [...builtInTracks, ...uploads], [uploads]);
  const byId = useMemo(() => new Map(library.map((t) => [t.id, t])), [library]);
  const currentTrack = byId.get(currentId) || library[0];
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const favoriteTracks = useMemo(() => favorites.map((id) => byId.get(id)).filter(Boolean), [favorites, byId]);
  const recentTracks = useMemo(() => recent.map((id) => byId.get(id)).filter(Boolean), [recent, byId]);

  const viewTracks =
    view === "favorites" ? favoriteTracks : view === "recent" ? recentTracks : view === "uploads" ? uploads : library;

  const visibleTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return viewTracks;
    return viewTracks.filter((t) => [t.title, t.artist, t.album].some((f) => f?.toLowerCase().includes(q)));
  }, [viewTracks, query]);

  /* ---------- playback ---------- */

  const goTo = (id, autoplay = true) => {
    if (id === currentTrack.id) {
      engine.seek(0);
      if (autoplay) engine.play();
      return;
    }
    autoplayRef.current = autoplay;
    setCurrentId(id);
  };

  const playTrack = (track, list = visibleTracks) => {
    if (track.id === currentTrack.id) {
      engine.toggle();
      return;
    }
    setQueueIds(list.map((t) => t.id));
    goTo(track.id);
  };

  const playList = (list, shuffled) => {
    if (!list.length) return;
    setShuffle(shuffled);
    setQueueIds(list.map((t) => t.id));
    goTo((shuffled ? list[Math.floor(Math.random() * list.length)] : list[0]).id);
  };

  const step = (dir, fromEnded = false) => {
    let ids = queueIds.filter((id) => byId.has(id));
    if (!ids.length) ids = library.map((t) => t.id);
    const i = ids.indexOf(currentTrack.id);
    if (shuffle && ids.length > 1) {
      let j = i;
      while (j === i) j = Math.floor(Math.random() * ids.length);
      goTo(ids[j]);
      return;
    }
    if (fromEnded && repeat === "off" && i === ids.length - 1) return;
    goTo(ids[(i + dir + ids.length) % ids.length]);
  };

  const prev = () => (engine.getTime() > 3 ? engine.seek(0) : step(-1));

  onEndedRef.current = () => {
    if (repeat === "one") {
      engine.seek(0);
      engine.play();
    } else {
      step(1, true);
    }
  };

  // Swap the source whenever the selected track changes; only autoplay after a user pick
  useEffect(() => {
    engine.load(currentTrack.audioSrc, autoplayRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack.audioSrc]);

  useEffect(() => {
    if (!engine.isPlaying) return;
    const id = currentTrack.id;
    setRecent((r) => (r[0] === id ? r : [id, ...r.filter((x) => x !== id)].slice(0, 40)));
  }, [engine.isPlaying, currentTrack.id]);

  const toggleFavorite = (track) => {
    const on = favoriteSet.has(track.id);
    setFavorites((f) => (on ? f.filter((id) => id !== track.id) : [track.id, ...f]));
    toast(on ? `Removed "${track.title}" from Favorites` : `Added "${track.title}" to Favorites`, {
      icon: <i className={`fa-solid ${on ? "fa-heart-crack" : "fa-heart"}`} style={{ color: "var(--accent-2)" }} />,
    });
  };

  const controls = {
    onToggle: engine.toggle,
    onPrev: prev,
    onNext: () => step(1),
    shuffle,
    onShuffle: () => setShuffle((s) => !s),
    repeat,
    onRepeat: () => setRepeat((r) => REPEAT_CYCLE[r] || "off"),
  };

  /* ---------- uploads ---------- */

  useEffect(() => {
    let alive = true;
    getAllUploads()
      .then((records) => {
        if (alive) setUploads(records.sort((a, b) => b.addedAt - a.addedAt).map(toTrack));
      })
      .catch(() => toast.error("Couldn't load your uploaded songs"));
    return () => {
      alive = false;
    };
  }, []);

  const openPicker = () => fileInputRef.current?.click();

  const openUpload = (fileList) => {
    const files = Array.from(fileList || []).filter(isAudioFile);
    if (!files.length) {
      toast.error("Those don't look like audio files");
      return;
    }
    setEditing(null);
    setPendingFiles(files);
  };

  const closeModal = () => {
    setPendingFiles(null);
    setEditing(null);
  };

  const saveDrafts = async (drafts) => {
    try {
      if (editing) {
        const d = drafts[0];
        const record = await getUpload(editing.id);
        const old = uploads.find((t) => t.id === editing.id);
        if (!record || !old) throw new Error("missing upload");
        const updated = {
          ...record,
          title: d.title.trim() || record.title,
          artist: d.artist.trim(),
          album: d.album.trim(),
          color: d.color,
          imageBlob: d.imageBlob || null,
        };
        await saveUpload(updated);
        const imageChanged = old.imageBlob !== updated.imageBlob;
        if (imageChanged && old.image) URL.revokeObjectURL(old.image);
        const next = {
          ...old,
          title: updated.title,
          artist: updated.artist || "Unknown artist",
          album: updated.album,
          color: updated.color,
          imageBlob: updated.imageBlob,
          image: imageChanged ? (updated.imageBlob ? URL.createObjectURL(updated.imageBlob) : null) : old.image,
        };
        setUploads((list) => list.map((t) => (t.id === next.id ? next : t)));
        toast.success("Song info updated");
      } else {
        const now = Date.now();
        const records = drafts.map((d, i) => ({
          id: `u-${now.toString(36)}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          title: d.title.trim() || d.file.name,
          artist: d.artist.trim(),
          album: d.album.trim(),
          color: d.color,
          duration: d.duration,
          audioBlob: d.file,
          imageBlob: d.imageBlob || null,
          addedAt: now + i,
        }));
        await Promise.all(records.map(saveUpload));
        const added = records.map(toTrack).reverse();
        setUploads((list) => [...added, ...list]);
        setQuery("");
        setView("uploads");
        toast.success(`Added ${added.length} ${added.length === 1 ? "song" : "songs"} to your library`);
      }
      closeModal();
      return true;
    } catch {
      toast.error("Couldn't save. Your browser storage may be full.");
      return false;
    }
  };

  const removeUpload = async (track) => {
    try {
      await deleteUpload(track.id);
    } catch {
      toast.error("Couldn't delete that song");
      return;
    }
    if (track.id === currentTrack.id) {
      engine.pause();
      autoplayRef.current = false;
      setCurrentId(builtInTracks[0].id);
    }
    setUploads((list) => list.filter((t) => t.id !== track.id));
    setFavorites((f) => f.filter((id) => id !== track.id));
    setRecent((r) => r.filter((id) => id !== track.id));
    // Let the player switch sources before the old blob URL disappears
    setTimeout(() => {
      URL.revokeObjectURL(track.audioSrc);
      if (track.image) URL.revokeObjectURL(track.image);
    }, 500);
    toast(`Deleted "${track.title}"`);
  };

  /* ---------- look & feel ---------- */

  useEffect(() => {
    let alive = true;
    extractColor(currentTrack.image, currentTrack.color || "#7c5cff").then((c) => {
      if (alive) setAccent(c);
    });
    return () => {
      alive = false;
    };
  }, [currentTrack.image, currentTrack.color]);

  useEffect(() => {
    const root = document.documentElement.style;
    const base = tune(accent);
    root.setProperty("--accent", base);
    root.setProperty("--accent-2", shiftHue(base, 48));
    root.setProperty("--accent-3", shiftHue(base, -60));
  }, [accent]);

  useEffect(() => {
    saveJSON("pulse:favorites", favorites);
    saveJSON("pulse:recent", recent);
    saveJSON("pulse:shuffle", shuffle);
    saveJSON("pulse:repeat", repeat);
    saveJSON("pulse:viz", vizMode);
    saveJSON("pulse:flash", flash);
  }, [favorites, recent, shuffle, repeat, vizMode, flash]);

  useEffect(() => {
    document.title = engine.isPlaying ? `${currentTrack.title} · ${currentTrack.artist}` : "Pulse - Music Player";
  }, [engine.isPlaying, currentTrack.title, currentTrack.artist]);

  // OS media keys / lock-screen controls
  useEffect(() => {
    if (!("mediaSession" in navigator) || !window.MediaMetadata) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || "Pulse",
      artwork: currentTrack.image ? [{ src: currentTrack.image, sizes: "512x512" }] : [],
    });
  }, [currentTrack]);

  actionsRef.current = {
    toggle: engine.toggle,
    play: engine.play,
    pause: engine.pause,
    next: () => step(1),
    prev,
    seekBy: (d) => engine.seek(engine.getTime() + d),
    volumeBy: (d) => {
      engine.setVolume(Math.min(1, Math.max(0, engine.volume + d)));
      engine.setMuted(false);
    },
    mute: () => engine.setMuted(!engine.muted),
    like: () => toggleFavorite(currentTrack),
    openNowPlaying: () => setNowPlaying(true),
    openUpload,
  };

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const handlers = {
      play: () => actionsRef.current.play(),
      pause: () => actionsRef.current.pause(),
      previoustrack: () => actionsRef.current.prev(),
      nexttrack: () => actionsRef.current.next(),
    };
    const setAll = (useHandlers) =>
      Object.entries(handlers).forEach(([action, fn]) => {
        try {
          navigator.mediaSession.setActionHandler(action, useHandlers ? fn : null);
        } catch {
          // action not supported by this browser
        }
      });
    setAll(true);
    return () => setAll(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) {
        if (e.key === "Escape") t.blur();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const a = actionsRef.current;
      switch (e.key) {
        case " ":
          if (t.tagName === "BUTTON") return;
          e.preventDefault();
          a.toggle();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) a.next();
          else a.seekBy(5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) a.prev();
          else a.seekBy(-5);
          break;
        case "ArrowUp":
          e.preventDefault();
          a.volumeBy(0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          a.volumeBy(-0.05);
          break;
        case "m":
        case "M":
          a.mute();
          break;
        case "l":
        case "L":
          a.like();
          break;
        case "f":
        case "F":
          a.openNowPlaying();
          break;
        case "/":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        default:
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Drag files anywhere onto the window to upload
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");
    const enter = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setDragging(true);
    };
    const over = (e) => hasFiles(e) && e.preventDefault();
    const leave = (e) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) setDragging(false);
    };
    const drop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      actionsRef.current.openUpload(e.dataTransfer.files);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, []);

  // Cursor spotlight: moved with a transform, at most once per frame
  const onMainMove = (e) => {
    const { clientX: x, clientY: y } = e;
    cancelAnimationFrame(spotFrame.current);
    spotFrame.current = requestAnimationFrame(() => {
      if (spotRef.current) spotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  };

  const navigate = (id) => {
    setView(id);
    setQuery("");
    setSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- render ---------- */

  const showHome = view === "discover" && !query.trim();
  const listProps = {
    currentId: currentTrack.id,
    isPlaying: engine.isPlaying,
    favorites: favoriteSet,
    onLike: toggleFavorite,
    onEdit: (t) => {
      setPendingFiles(null);
      setEditing(t);
    },
    onDelete: removeUpload,
  };

  const renderEmpty = () => {
    if (query.trim())
      return <EmptyState icon="fa-magnifying-glass" title="No matches" text={`Nothing in ${VIEW_LABELS[view]} matches "${query}".`} />;
    if (view === "favorites")
      return <EmptyState icon="fa-heart" title="No favorites yet" text="Tap the heart on any song, or press L while it plays." />;
    if (view === "recent")
      return <EmptyState icon="fa-clock-rotate-left" title="Nothing played yet" text="Songs you play will show up here." />;
    return null;
  };

  return (
    <div className={`app ${engine.isPlaying ? "is-playing" : ""} ${npCovered ? "np-covered" : ""}`}>
      <AmbientLights image={currentTrack.image} playing={engine.isPlaying} flash={flash} />
      <div className="spotlight" ref={spotRef} aria-hidden="true" />

      <Sidebar
        view={view}
        onNavigate={navigate}
        counts={{ favorites: favoriteTracks.length, recent: recentTracks.length, uploads: uploads.length }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUpload={openPicker}
        isPlaying={engine.isPlaying}
      />

      <main className="main" ref={mainRef} onMouseMove={onMainMove}>
        <TopBar
          query={query}
          onQuery={setQuery}
          searchRef={searchRef}
          onMenu={() => setSidebarOpen(true)}
          onUpload={openPicker}
          onVisualizer={() => setNowPlaying(true)}
        />

        <div className="view" key={showHome ? "home" : view}>
          {showHome ? (
            <>
              <div className="greeting">
                <span className="eyebrow">{greeting()}</span>
                <h1 className="view-title">What's the vibe today?</h1>
              </div>
              <Hero
                track={currentTrack}
                isPlaying={engine.isPlaying}
                liked={favoriteSet.has(currentTrack.id)}
                onToggle={() => {
                  if (!queueIds.length) setQueueIds(library.map((t) => t.id));
                  engine.toggle();
                }}
                onLike={() => toggleFavorite(currentTrack)}
                onVisualizer={() => setNowPlaying(true)}
              />
              <FeaturedRow
                tracks={library.slice(0, 10)}
                currentId={currentTrack.id}
                isPlaying={engine.isPlaying}
                onPlay={(t) => playTrack(t, library)}
              />
              <div className="section-head">
                <h3 className="section-title">All songs</h3>
                <span className="section-meta">{library.length} songs</span>
              </div>
            </>
          ) : (
            <ViewHeader
              eyebrow={query.trim() ? "Search" : "Library"}
              title={query.trim() ? `"${query.trim()}"` : VIEW_LABELS[view]}
              count={visibleTracks.length}
              onPlayAll={() => playList(visibleTracks, false)}
              onShuffleAll={() => playList(visibleTracks, true)}
            />
          )}

          {view === "uploads" && !query.trim() && <Dropzone onBrowse={openPicker} compact={uploads.length > 0} />}

          {visibleTracks.length > 0 ? (
            <TrackList tracks={visibleTracks} onPlay={(t) => playTrack(t)} {...listProps} />
          ) : (
            renderEmpty()
          )}
        </div>
      </main>

      <PlayerBar
        track={currentTrack}
        engine={engine}
        levels={levels}
        accent={accent}
        liked={favoriteSet.has(currentTrack.id)}
        onLike={() => toggleFavorite(currentTrack)}
        controls={controls}
        onOpen={() => setNowPlaying(true)}
      />

      {nowPlaying && (
        <NowPlaying
          track={currentTrack}
          engine={engine}
          levels={levels}
          accent={accent}
          mode={vizMode}
          onMode={setVizMode}
          flash={flash}
          onFlash={() => setFlash((f) => !f)}
          liked={favoriteSet.has(currentTrack.id)}
          onLike={() => toggleFavorite(currentTrack)}
          controls={controls}
          onCovered={setNpCovered}
          onClose={() => {
            setNpCovered(false);
            setNowPlaying(false);
          }}
        />
      )}

      {(pendingFiles || editing) && (
        <UploadModal
          key={editing ? editing.id : "new"}
          files={pendingFiles || []}
          editTrack={editing}
          onClose={closeModal}
          onSave={saveDrafts}
        />
      )}

      <DropOverlay active={dragging} />

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus"
        multiple
        hidden
        onChange={(e) => {
          openUpload(e.target.files);
          e.target.value = "";
        }}
      />

      <ToastContainer position="bottom-right" autoClose={2200} hideProgressBar newestOnTop theme="dark" />
    </div>
  );
};

export default App;
