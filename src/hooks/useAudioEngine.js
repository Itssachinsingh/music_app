import { useCallback, useEffect, useRef, useState } from "react";
import { loadJSON, saveJSON } from "../lib/storage";

// Playback position lives here rather than in the engine so only the seek bars
// re-render as the song plays, not the whole app.
export function useCurrentTime(audio) {
  const [time, setTime] = useState(audio.currentTime);
  useEffect(() => {
    const sync = () => setTime(audio.currentTime);
    const events = ["timeupdate", "seeked", "emptied"];
    sync();
    events.forEach((e) => audio.addEventListener(e, sync));
    return () => events.forEach((e) => audio.removeEventListener(e, sync));
  }, [audio]);
  return time;
}

// One shared <audio> element routed through Web Audio so the visuals can analyse it.
// The graph is created lazily on the first play() because browsers only allow
// audio contexts to start after a user gesture.
export default function useAudioEngine(onEndedRef) {
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new Audio();
  const graphRef = useRef(null);

  const [analyser, setAnalyser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => loadJSON("pulse:volume", 0.8));
  const [muted, setMuted] = useState(false);

  const gainValue = muted ? 0 : volume;
  const gainRef = useRef(gainValue);
  gainRef.current = gainValue;

  useEffect(() => {
    const audio = audioRef.current;
    const events = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      durationchange: () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0),
      ended: () => onEndedRef.current?.(),
    };
    Object.entries(events).forEach(([name, fn]) => audio.addEventListener(name, fn));
    return () => {
      Object.entries(events).forEach(([name, fn]) => audio.removeEventListener(name, fn));
      audio.pause();
    };
  }, [onEndedRef]);

  useEffect(() => {
    const graph = graphRef.current;
    if (graph?.gain) graph.gain.gain.setTargetAtTime(gainValue, graph.ctx.currentTime, 0.03);
    else audioRef.current.volume = gainValue;
    saveJSON("pulse:volume", volume);
  }, [gainValue, volume]);

  const ensureGraph = useCallback(() => {
    const graph = graphRef.current;
    if (graph) {
      if (graph.ctx?.state === "suspended") graph.ctx.resume();
      return;
    }
    try {
      const audio = audioRef.current;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(audio);
      const node = ctx.createAnalyser();
      node.fftSize = 2048;
      node.smoothingTimeConstant = 0.8;
      const gain = ctx.createGain();
      gain.gain.value = gainRef.current;
      // Analyse before the gain so the visuals don't depend on the volume slider
      source.connect(node);
      node.connect(gain);
      gain.connect(ctx.destination);
      audio.volume = 1;
      graphRef.current = { ctx, gain };
      setAnalyser(node);
    } catch {
      graphRef.current = { ctx: null, gain: null };
    }
  }, []);

  const play = useCallback(() => {
    ensureGraph();
    // Rejections (autoplay blocked, interrupted by a new load) are fine:
    // isPlaying follows the element's own play/pause events.
    audioRef.current.play()?.catch(() => {});
  }, [ensureGraph]);

  const pause = useCallback(() => audioRef.current.pause(), []);

  const toggle = useCallback(() => {
    if (audioRef.current.paused) play();
    else pause();
  }, [play, pause]);

  const load = useCallback(
    (src, autoplay) => {
      audioRef.current.src = src;
      setDuration(0);
      if (autoplay) play();
    },
    [play]
  );

  const seek = useCallback((t) => {
    const audio = audioRef.current;
    const max = Number.isFinite(audio.duration) ? audio.duration : t;
    audio.currentTime = Math.min(Math.max(0, t), max);
  }, []);

  const getTime = useCallback(() => audioRef.current.currentTime, []);

  return {
    audio: audioRef.current,
    analyser,
    isPlaying,
    getTime,
    duration,
    volume,
    setVolume,
    muted,
    setMuted,
    play,
    pause,
    toggle,
    load,
    seek,
  };
}
