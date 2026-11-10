import { useEffect, useRef } from "react";

const band = (data, [from, to]) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += data[i];
  return sum / ((to - from) * 255);
};

const VARS = ["bass", "mid", "treble", "energy", "pulse"];

// Reads the analyser every frame, exposes raw data to canvases via a ref and
// publishes band levels as CSS custom properties (--bass, --pulse, ...) so plain
// CSS can make the lights react to the music. The vars are written only to
// elements marked [data-reactive]; writing them on the root would restyle the
// whole page every frame.
export default function useAudioLevels(analyser) {
  const levels = useRef({ bass: 0, mid: 0, treble: 0, energy: 0, pulse: 0, beats: 0, freq: null, wave: null });

  useEffect(() => {
    const state = levels.current;
    let targets = [];
    let written = {};
    let frame = 0;
    let freq;
    let wave;
    let ranges;
    if (analyser) {
      freq = new Uint8Array(analyser.frequencyBinCount);
      wave = new Uint8Array(analyser.fftSize);
      const hz = analyser.context.sampleRate / analyser.fftSize;
      const bin = (f) => Math.max(1, Math.round(f / hz));
      ranges = { bass: [bin(20), bin(150)], mid: [bin(150), bin(2000)], treble: [bin(2000), bin(10000)] };
      state.freq = freq;
      state.wave = wave;
    }

    let avgBass = 0;
    let lastBeat = 0;
    let raf;
    const tick = (now) => {
      if (analyser) {
        analyser.getByteFrequencyData(freq);
        analyser.getByteTimeDomainData(wave);
        state.bass = band(freq, ranges.bass);
        // Higher bands carry less energy, so lift them into a comparable range
        state.mid = Math.min(1, band(freq, ranges.mid) * 1.35);
        state.treble = Math.min(1, band(freq, ranges.treble) * 2.4);
      }
      state.energy = state.bass * 0.5 + state.mid * 0.35 + state.treble * 0.15;

      avgBass = avgBass * 0.94 + state.bass * 0.06;
      if (state.bass > 0.32 && state.bass > avgBass * 1.18 && now - lastBeat > 260) {
        lastBeat = now;
        state.pulse = 1;
        state.beats += 1;
      } else {
        state.pulse *= 0.9;
      }

      // Re-scan a few times a second so newly mounted targets pick the vars up
      if (frame++ % 20 === 0) {
        targets = Array.from(document.querySelectorAll("[data-reactive]"));
        written = {};
      }
      for (const key of VARS) {
        const value = state[key].toFixed(2);
        if (written[key] !== value) {
          for (const el of targets) el.style.setProperty(`--${key}`, value);
          written[key] = value;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return levels;
}
