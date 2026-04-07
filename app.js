const TRACKS = [
  { name: 'Kick', freq: 60, type: 'sine' },
  { name: 'Snare', freq: 180, type: 'triangle' },
  { name: 'Hat', freq: 300, type: 'square' },
  { name: 'Bass', freq: 90, type: 'sawtooth' },
];

const STEPS = 8;
const SCENES = 4;

const state = {
  audioStarted: false,
  isPlaying: false,
  bpm: 120,
  stepIndex: 0,
  nextNoteTime: 0,
  intervalId: null,
  activeClips: Array.from({ length: TRACKS.length }, () => false),
  patterns: [
    [1, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
  ],
};

let ctx;
let masterGain;
const trackNodes = [];

const $ = (id) => document.getElementById(id);

function initAudio() {
  if (state.audioStarted) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = Number($('masterVol').value);
  masterGain.connect(ctx.destination);

  TRACKS.forEach(() => {
    const gain = ctx.createGain();
    gain.gain.value = 0.8;
    const pan = ctx.createStereoPanner();
    pan.pan.value = 0;
    gain.connect(pan);
    pan.connect(masterGain);
    trackNodes.push({ gain, pan, muted: false });
  });

  state.audioStarted = true;
  setStatus('audio ready');
  renderMixer();
}

function setStatus(text) {
  $('status').textContent = `Status: ${text}`;
}

function scheduleNote(trackIdx, time, step) {
  const patternOn = state.patterns[trackIdx][step] === 1;
  if (!patternOn || !state.activeClips[trackIdx]) return;
  const spec = TRACKS[trackIdx];

  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = spec.type;
  osc.frequency.value = spec.freq;

  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(0.4, time + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

  osc.connect(env);
  env.connect(trackNodes[trackIdx].gain);

  osc.start(time);
  osc.stop(time + 0.13);
}

function nextStepTime() {
  const beatDur = 60 / state.bpm;
  return beatDur / 2;
}

function scheduler() {
  while (state.nextNoteTime < ctx.currentTime + 0.1) {
    const step = state.stepIndex % STEPS;
    TRACKS.forEach((_, i) => scheduleNote(i, state.nextNoteTime, step));
    highlightPlayhead(step);

    state.nextNoteTime += nextStepTime();
    state.stepIndex += 1;
  }
}

function play() {
  if (!state.audioStarted) initAudio();
  if (state.isPlaying) return;

  state.bpm = Number($('bpmInput').value);
  state.stepIndex = 0;
  state.nextNoteTime = ctx.currentTime + 0.05;
  state.intervalId = setInterval(scheduler, 25);
  state.isPlaying = true;
  setStatus('playing');
}

function stop() {
  if (!state.isPlaying) return;
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isPlaying = false;
  clearPlayhead();
  setStatus('stopped');
}

function renderGrid() {
  const grid = $('grid');
  grid.innerHTML = '';

  const header = document.createElement('div');
  header.textContent = 'Track';
  grid.appendChild(header);
  for (let s = 0; s < SCENES; s += 1) {
    const h = document.createElement('div');
    h.innerHTML = `<small>Scene ${s + 1}</small>`;
    grid.appendChild(h);
  }

  TRACKS.forEach((track, tIdx) => {
    const label = document.createElement('div');
    label.className = 'track-label';
    label.textContent = track.name;
    grid.appendChild(label);

    for (let s = 0; s < SCENES; s += 1) {
      const clip = document.createElement('button');
      clip.className = 'clip';
      clip.textContent = `Clip ${s + 1}`;
      clip.dataset.track = String(tIdx);
      clip.addEventListener('click', () => {
        state.activeClips[tIdx] = !state.activeClips[tIdx];
        updateClipClasses();
      });
      grid.appendChild(clip);
    }
  });

  updateClipClasses();
}

function updateClipClasses() {
  const clips = document.querySelectorAll('.clip');
  clips.forEach((el) => {
    const tIdx = Number(el.dataset.track);
    el.classList.toggle('active', state.activeClips[tIdx]);
  });
}

function renderScenes() {
  const scenes = $('scenes');
  scenes.innerHTML = '';
  for (let i = 0; i < SCENES; i += 1) {
    const row = document.createElement('div');
    row.className = 'row';
    const btn = document.createElement('button');
    btn.textContent = `Launch Scene ${i + 1}`;
    btn.addEventListener('click', () => {
      state.activeClips = state.activeClips.map(() => true);
      updateClipClasses();
    });
    row.appendChild(btn);
    scenes.appendChild(row);
  }
}

function renderMixer() {
  const mixer = $('mixer');
  mixer.innerHTML = '';

  TRACKS.forEach((track, i) => {
    const row = document.createElement('div');
    row.className = 'row';

    const name = document.createElement('strong');
    name.textContent = track.name;

    const mute = document.createElement('button');
    mute.textContent = 'Mute';
    mute.addEventListener('click', () => {
      trackNodes[i].muted = !trackNodes[i].muted;
      trackNodes[i].gain.gain.value = trackNodes[i].muted ? 0 : Number(vol.value);
      mute.textContent = trackNodes[i].muted ? 'Unmute' : 'Mute';
    });

    const vol = document.createElement('input');
    vol.type = 'range';
    vol.min = '0';
    vol.max = '1';
    vol.step = '0.01';
    vol.value = '0.8';
    vol.addEventListener('input', () => {
      if (!trackNodes[i].muted) {
        trackNodes[i].gain.gain.value = Number(vol.value);
      }
    });

    const pan = document.createElement('input');
    pan.type = 'range';
    pan.min = '-1';
    pan.max = '1';
    pan.step = '0.01';
    pan.value = '0';
    pan.addEventListener('input', () => {
      trackNodes[i].pan.pan.value = Number(pan.value);
    });

    row.append(name, mute, document.createTextNode('Vol'), vol, document.createTextNode('Pan'), pan);
    mixer.appendChild(row);
  });
}

function renderSequencer() {
  const seq = $('sequencer');
  seq.innerHTML = '';

  TRACKS.forEach((track, tIdx) => {
    const row = document.createElement('div');
    row.className = 'row';

    const name = document.createElement('strong');
    name.textContent = track.name;
    row.appendChild(name);

    for (let step = 0; step < STEPS; step += 1) {
      const b = document.createElement('button');
      b.className = 'step';
      b.dataset.track = String(tIdx);
      b.dataset.step = String(step);
      if (state.patterns[tIdx][step]) b.classList.add('on');

      b.addEventListener('click', () => {
        state.patterns[tIdx][step] = state.patterns[tIdx][step] ? 0 : 1;
        b.classList.toggle('on', state.patterns[tIdx][step] === 1);
      });

      row.appendChild(b);
    }

    seq.appendChild(row);
  });
}

function highlightPlayhead(step) {
  clearPlayhead();
  const current = document.querySelectorAll(`.step[data-step="${step}"]`);
  current.forEach((el) => el.classList.add('playhead'));
}

function clearPlayhead() {
  document.querySelectorAll('.step.playhead').forEach((el) => {
    el.classList.remove('playhead');
  });
}

function bindEvents() {
  $('startAudioBtn').addEventListener('click', initAudio);
  $('playBtn').addEventListener('click', play);
  $('stopBtn').addEventListener('click', stop);

  $('bpmInput').addEventListener('change', () => {
    state.bpm = Number($('bpmInput').value);
  });

  $('masterVol').addEventListener('input', () => {
    if (!masterGain) return;
    masterGain.gain.value = Number($('masterVol').value);
  });

  $('clearClipsBtn').addEventListener('click', () => {
    state.activeClips = state.activeClips.map(() => false);
    updateClipClasses();
  });
}

renderGrid();
renderScenes();
renderSequencer();
bindEvents();
setStatus('idle');
