const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function resumeAudio() {
  return audioCtx.resume();
}

export function generateTone(frequency, duration = 100, volume = 0.5) {
  return {
    play: () => {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration / 1000);
    }
  };
}
