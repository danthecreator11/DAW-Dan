# DAW-Dan v0.1 (Prototype)

This is a first-version, browser-based DAW prototype focused on the workflow you described:

- **Live Loops style clip grid**
- **Scene launching**
- **Basic transport controls**
- **Simple mixer with volume/pan**
- **Step sequencer for rapid pattern creation**

> Goal: prove the core interaction model before building a native macOS/iOS DAW.

## Run

No build tools required.

1. Open `index.html` in a modern browser (Chrome/Safari/Edge).
2. Click **Start Audio**.
3. Trigger clips or launch scenes.
4. Use mixer controls for each track.

## Included v0.1 features

- 4 tracks: Kick, Snare, Hat, Bass
- 8-step pattern per track
- Per-track controls:
  - Mute
  - Volume
  - Pan
- Clip launch quantized to beat boundaries
- Scene launch (rows)
- Master volume

## Architecture notes

- Uses Web Audio API (`AudioContext`, `GainNode`, `StereoPannerNode`).
- Internal scheduler runs a 16th-note clock and triggers active steps.
- Clip grid toggles track activation in the scheduler.

## Next versions

- MIDI input + piano roll
- Audio clip recording and waveform lanes
- AUv3/VST equivalent plugin strategy (native app phase)
- Project save/load
- Better timing strategy with look-ahead scheduler and worker thread

## Stress testing

You can run a headless scheduler stress test in Node.js:

```bash
node stress-test.js
```

What it does:
- Simulates clip/pattern scheduling across progressively heavier sessions
- Measures elapsed runtime for each scenario
- Performs basic assertions to catch logic regressions

> Note: this validates sequencing logic and scalability characteristics, not browser-specific audio rendering behavior.
