import React, { useEffect, useRef, useState } from "react";
import { extractColor, tune } from "../lib/color";
import { displayDuration, parseFileName } from "../lib/format";
import { readDuration, readTags } from "../lib/id3";
import { Cover } from "./ui";

const PALETTE = ["#7c5cff", "#ff4fa3", "#20d3c2", "#ff9f43", "#4f9dff", "#c86bff"];

let draftSeq = 0;
const newDraft = (file) => {
  const { title, artist } = parseFileName(file.name);
  return {
    key: `d${draftSeq++}`,
    file,
    title,
    artist,
    album: "",
    imageBlob: null,
    imageUrl: null,
    color: tune(PALETTE[draftSeq % PALETTE.length]),
    colorTouched: false,
    duration: 0,
    playable: true,
    reading: true,
  };
};

const fromTrack = (t) => ({
  key: t.id,
  title: t.title,
  artist: t.artist === "Unknown artist" ? "" : t.artist,
  album: t.album || "",
  imageBlob: t.imageBlob,
  imageUrl: t.image,
  color: t.color,
  colorTouched: false,
  duration: t.duration,
  playable: true,
  reading: false,
});

const UploadModal = ({ files, editTrack, onClose, onSave }) => {
  const [drafts, setDrafts] = useState(() => (editTrack ? [fromTrack(editTrack)] : files.map(newDraft)));
  const [saving, setSaving] = useState(false);
  const createdUrls = useRef([]);

  const update = (key, patch) =>
    setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...(typeof patch === "function" ? patch(d) : patch) } : d)));

  const trackUrl = (blob) => {
    const url = URL.createObjectURL(blob);
    createdUrls.current.push(url);
    return url;
  };

  // Read ID3 tags, embedded art and duration for each new file
  useEffect(() => {
    if (editTrack) return;
    let alive = true;
    drafts.forEach((d) => {
      Promise.all([readTags(d.file).catch(() => ({})), readDuration(d.file)]).then(async ([tags, duration]) => {
        if (!alive) return;
        const imageUrl = tags.picture ? trackUrl(tags.picture) : null;
        const color = imageUrl ? await extractColor(imageUrl, d.color) : null;
        if (!alive) return;
        update(d.key, (prev) => ({
          title: tags.title || prev.title,
          artist: tags.artist || prev.artist,
          album: tags.album || prev.album,
          imageBlob: tags.picture || prev.imageBlob,
          imageUrl: imageUrl || prev.imageUrl,
          color: color && !prev.colorTouched ? color : prev.color,
          duration,
          playable: duration > 0,
          reading: false,
        }));
      });
    });
    return () => {
      alive = false;
    };
    // Runs once for the files the modal was opened with
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const urls = createdUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const changeCover = async (d, file) => {
    if (!file) return;
    const imageUrl = trackUrl(file);
    update(d.key, { imageBlob: file, imageUrl });
    const color = await extractColor(imageUrl, d.color);
    update(d.key, (prev) => (prev.colorTouched ? {} : { color }));
  };

  const reading = drafts.some((d) => d.reading);
  const save = async () => {
    setSaving(true);
    const ok = await onSave(drafts);
    if (!ok) setSaving(false);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
        <header className="modal-head">
          <div>
            <span className="eyebrow">{editTrack ? "Edit" : "Upload"}</span>
            <h2 id="upload-title">
              {editTrack ? "Song info" : `Add ${drafts.length} ${drafts.length === 1 ? "song" : "songs"}`}
            </h2>
            <p>
              {editTrack
                ? "Change the title, artist, artwork or glow colour."
                : "We read the tags from your files. Change anything you like before saving."}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" disabled={saving}>
            <i className="fa-solid fa-xmark" />
          </button>
        </header>

        <div className="draft-list">
          {drafts.map((d, i) => (
            <div key={d.key} className="draft" style={{ "--i": i, "--cover-color": d.color }}>
              <label className="draft-cover" title="Change cover art">
                <Cover track={{ image: d.imageUrl, color: d.color }} />
                <span className="draft-cover-edit">
                  <i className="fa-solid fa-camera" /> Cover
                </span>
                <input type="file" accept="image/*" hidden onChange={(e) => changeCover(d, e.target.files[0])} />
              </label>

              <div className="draft-fields">
                <label className="field">
                  <span>Title</span>
                  <input value={d.title} onChange={(e) => update(d.key, { title: e.target.value })} placeholder="Song title" />
                </label>
                <div className="field-row">
                  <label className="field">
                    <span>Artist</span>
                    <input value={d.artist} onChange={(e) => update(d.key, { artist: e.target.value })} placeholder="Unknown artist" />
                  </label>
                  <label className="field">
                    <span>Album</span>
                    <input value={d.album} onChange={(e) => update(d.key, { album: e.target.value })} placeholder="Optional" />
                  </label>
                </div>
                <div className="draft-meta">
                  <label className="swatch" title="Glow colour">
                    <input
                      type="color"
                      value={d.color}
                      onChange={(e) => update(d.key, { color: e.target.value, colorTouched: true })}
                    />
                    <span>Glow</span>
                  </label>
                  {d.imageUrl && (
                    <button type="button" className="link-btn" onClick={() => update(d.key, { imageBlob: null, imageUrl: null })}>
                      Remove cover
                    </button>
                  )}
                  <span className="draft-status">
                    {d.reading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" /> Reading tags…
                      </>
                    ) : d.playable ? (
                      <>
                        <i className="fa-regular fa-clock" /> {displayDuration(d.duration)}
                      </>
                    ) : (
                      <span className="warn">
                        <i className="fa-solid fa-triangle-exclamation" /> Your browser may not play this format
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {!editTrack && drafts.length > 1 && (
                <button
                  type="button"
                  className="icon-btn sm draft-remove"
                  onClick={() => setDrafts((list) => list.filter((x) => x.key !== d.key))}
                  aria-label="Remove from upload"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          ))}
        </div>

        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving || reading || !drafts.length}>
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Saving…
              </>
            ) : (
              <>
                <i className="fa-solid fa-check" /> {editTrack ? "Save changes" : "Add to library"}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default UploadModal;
