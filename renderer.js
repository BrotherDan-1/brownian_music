import { generateTone, resumeAudio } from "./tone.js";

const SIM_WIDTH = 800;
const SIM_HEIGHT = 800;
const COLLISION_DURATION = 100;
const COLLISION_VOLUME = 0.4;
const BALL_RADIUS = 15;
const FREQ_BASES = [55, 110];
let freqBase = FREQ_BASES[0];
const OCTAVE_RANGE = 2;
const FRAME_RATE = 60;

const VOICE_COUNTS = [5, 10, 20, 35, 50];
const SPEED_RANGES = [
  [30,  60],
  [60,  100],
  [80,  150],
  [130, 220],
  [200, 350]
];

const SCALES = {
  major:     [0, 2, 4, 5, 7, 9, 11],
  minor:     [0, 2, 3, 5, 7, 8, 10],
  chromatic: [...Array(12).keys()]
};

function buildNoteBase(fb) {
  return {
    "A":  fb,
    "A#": fb * Math.pow(2,  1 / 12),
    "B":  fb * Math.pow(2,  2 / 12),
    "C":  fb * Math.pow(2,  3 / 12),
    "C#": fb * Math.pow(2,  4 / 12),
    "D":  fb * Math.pow(2,  5 / 12),
    "D#": fb * Math.pow(2,  6 / 12),
    "E":  fb * Math.pow(2,  7 / 12),
    "F":  fb * Math.pow(2,  8 / 12),
    "F#": fb * Math.pow(2,  9 / 12),
    "G":  fb * Math.pow(2, 10 / 12),
    "G#": fb * Math.pow(2, 11 / 12)
  };
}
let NOTE_BASE = buildNoteBase(freqBase);

let selectedKey = "A";
let selectedScale = "major";
let voiceLevel = 3;
let speedLevel = 3;
let freqLevel = 1;
let balls = [];
let running = false;
let toneLibrary = [];

function generateFrequencies(key, scale) {
  const baseFreq = NOTE_BASE[key];
  const offsets = SCALES[scale];
  const freqs = [];
  for (let octave = 0; octave < OCTAVE_RANGE; octave++) {
    for (const offset of offsets) {
      freqs.push(baseFreq * Math.pow(2, (offset + 12 * octave) / 12));
    }
  }
  return freqs;
}

function rebuildToneLibrary() {
  toneLibrary = generateFrequencies(selectedKey, selectedScale)
    .map(freq => generateTone(freq, COLLISION_DURATION, COLLISION_VOLUME));
}

function randomVelocity() {
  const [min, max] = SPEED_RANGES[speedLevel - 1];
  const angle = Math.random() * 2 * Math.PI;
  const speed = min + Math.random() * (max - min);
  return [Math.cos(angle) * speed, Math.sin(angle) * speed];
}

function Ball() {
  this.x = Math.random() * SIM_WIDTH;
  this.y = Math.random() * SIM_HEIGHT;
  [this.dx, this.dy] = randomVelocity();
  this.toneIndex = Math.floor(Math.random() * toneLibrary.length);
}

Ball.prototype.update = function(dt) {
  this.x += this.dx * dt;
  this.y += this.dy * dt;
  if (this.x <= 0 || this.x >= SIM_WIDTH) {
    this.dx *= -1;
    toneLibrary[this.toneIndex].play();
  }
  if (this.y <= 0 || this.y >= SIM_HEIGHT) {
    this.dy *= -1;
    toneLibrary[this.toneIndex].play();
  }
};

function handleCollisions() {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const b1 = balls[i];
      const b2 = balls[j];
      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2 * BALL_RADIUS && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = 2 * BALL_RADIUS - dist;
        b1.x -= nx * overlap / 2;
        b1.y -= ny * overlap / 2;
        b2.x += nx * overlap / 2;
        b2.y += ny * overlap / 2;
        const p1 = b1.dx * nx + b1.dy * ny;
        const p2 = b2.dx * nx + b2.dy * ny;
        b1.dx += (p2 - p1) * nx;
        b1.dy += (p2 - p1) * ny;
        b2.dx += (p1 - p2) * nx;
        b2.dy += (p1 - p2) * ny;
        toneLibrary[b1.toneIndex].play();
        toneLibrary[b2.toneIndex].play();
      }
    }
  }
}

function rebuildBalls() {
  const count = VOICE_COUNTS[voiceLevel - 1];
  balls = Array.from({ length: count }, () => new Ball());
}

function step() {
  if (!running) return;
  const dt = 1 / FRAME_RATE;
  for (const ball of balls) ball.update(dt);
  handleCollisions();
  setTimeout(step, 1000 / FRAME_RATE);
}

function start() {
  if (running) return;
  resumeAudio();
  running = true;
  setPlayState(true);
  step();
}

function stop() {
  running = false;
  setPlayState(false);
}

function setPlayState(isPlaying) {
  document.getElementById("playButton").classList.toggle("active", isPlaying);
  document.getElementById("stopButton").classList.toggle("active", !isPlaying);
}

function setVoiceLevel(level) {
  voiceLevel = level;
  document.querySelectorAll(".voice-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i + 1 === level);
  });
  rebuildBalls();
}

function setFreqLevel(level) {
  freqLevel = level;
  freqBase = FREQ_BASES[level - 1];
  NOTE_BASE = buildNoteBase(freqBase);
  document.querySelectorAll(".freq-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i + 1 === level);
  });
  rebuildToneLibrary();
  rebuildBalls();
}

function setSpeedLevel(level) {
  speedLevel = level;
  document.querySelectorAll(".speed-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i + 1 === level);
  });
  for (const ball of balls) [ball.dx, ball.dy] = randomVelocity();
}

document.addEventListener("DOMContentLoaded", () => {
  rebuildToneLibrary();

  document.getElementById("keySelect").addEventListener("change", e => {
    selectedKey = e.target.value;
    rebuildToneLibrary();
    rebuildBalls();
  });

  document.getElementById("scaleSelect").addEventListener("change", e => {
    selectedScale = e.target.value;
    rebuildToneLibrary();
    rebuildBalls();
  });

  document.getElementById("playButton").addEventListener("click", start);
  document.getElementById("stopButton").addEventListener("click", stop);

  document.querySelectorAll(".voice-btn").forEach((btn, i) => {
    btn.addEventListener("click", () => setVoiceLevel(i + 1));
  });

  document.querySelectorAll(".speed-btn").forEach((btn, i) => {
    btn.addEventListener("click", () => setSpeedLevel(i + 1));
  });

  document.querySelectorAll(".freq-btn").forEach((btn, i) => {
    btn.addEventListener("click", () => setFreqLevel(i + 1));
  });

  setVoiceLevel(3);
  setSpeedLevel(3);
  setFreqLevel(1);
  rebuildBalls();
});
