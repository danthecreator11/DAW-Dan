#!/usr/bin/env node

/**
 * DAW-Dan stress test (logic-level, headless).
 *
 * This validates and benchmarks timing/scheduler-style loops without requiring
 * a browser AudioContext.
 */

const { performance } = require('perf_hooks');

function createPatternGrid(trackCount, steps, density = 0.35) {
  return Array.from({ length: trackCount }, () =>
    Array.from({ length: steps }, () => (Math.random() < density ? 1 : 0)),
  );
}

function simulateScheduling({
  trackCount,
  steps,
  bpm,
  seconds,
  patternDensity,
  activeClipDensity,
}) {
  const patterns = createPatternGrid(trackCount, steps, patternDensity);
  const activeClips = Array.from({ length: trackCount }, () => Math.random() < activeClipDensity);

  const stepDurationSec = (60 / bpm) / 2; // 8th-note like app prototype
  const totalTicks = Math.floor(seconds / stepDurationSec);

  let scheduledNotes = 0;
  let playhead = 0;

  for (let tick = 0; tick < totalTicks; tick += 1) {
    const step = playhead % steps;
    for (let t = 0; t < trackCount; t += 1) {
      if (activeClips[t] && patterns[t][step] === 1) {
        scheduledNotes += 1;
      }
    }
    playhead += 1;
  }

  return { totalTicks, scheduledNotes };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runScenario(name, config) {
  const t0 = performance.now();
  const result = simulateScheduling(config);
  const t1 = performance.now();
  const elapsedMs = t1 - t0;

  assert(result.totalTicks > 0, `${name}: totalTicks must be > 0`);
  assert(result.scheduledNotes >= 0, `${name}: scheduledNotes must be >= 0`);

  return {
    name,
    elapsedMs,
    ...result,
    config,
  };
}

function printScenario(r) {
  console.log(`\n[${r.name}]`);
  console.log(`tracks=${r.config.trackCount}, steps=${r.config.steps}, bpm=${r.config.bpm}, seconds=${r.config.seconds}`);
  console.log(`density(pattern=${r.config.patternDensity}, activeClip=${r.config.activeClipDensity})`);
  console.log(`ticks=${r.totalTicks}, scheduledNotes=${r.scheduledNotes}, elapsedMs=${r.elapsedMs.toFixed(2)}`);
}

function main() {
  const scenarios = [
    {
      name: 'Baseline (prototype-like)',
      trackCount: 4,
      steps: 8,
      bpm: 120,
      seconds: 120,
      patternDensity: 0.5,
      activeClipDensity: 1.0,
    },
    {
      name: 'Medium Session',
      trackCount: 24,
      steps: 32,
      bpm: 140,
      seconds: 300,
      patternDensity: 0.4,
      activeClipDensity: 0.8,
    },
    {
      name: 'Heavy Session',
      trackCount: 64,
      steps: 64,
      bpm: 170,
      seconds: 600,
      patternDensity: 0.35,
      activeClipDensity: 0.75,
    },
    {
      name: 'Extreme Session',
      trackCount: 128,
      steps: 128,
      bpm: 180,
      seconds: 900,
      patternDensity: 0.3,
      activeClipDensity: 0.7,
    },
  ];

  const startedAt = performance.now();
  const results = scenarios.map((s) => runScenario(s.name, s));
  const totalElapsed = performance.now() - startedAt;

  console.log('DAW-Dan headless stress test complete.');
  results.forEach(printScenario);
  console.log(`\nTotal benchmark time: ${totalElapsed.toFixed(2)}ms`);
}

main();
