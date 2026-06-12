// Lightweight Web Audio chime + speech synthesis helpers.
// No external audio files required — the chime is synthesized in-browser.

let sharedCtx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    sharedCtx = new Ctx();
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume();
  }
  return sharedCtx;
}

// Plays an elegant ascending two-tone chime (C major feel).
export function playChime() {
  const ctx = getCtx();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const start = now + i * 0.14;
    const duration = 0.9;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.22, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  });
}

// Speaks text using the Web Speech API (English by default for compatibility).
export function speak(text, lang = "en-US") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

// Spells out a queue number like "A001" -> "A, zero, zero, one"
export function spellQueueNumber(queueNumber) {
  return queueNumber
    .split("")
    .map((ch) => (ch === "0" ? "zero" : ch))
    .join(" ");
}

export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") ctx.resume();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    // Trigger a near-silent utterance to unlock the speech engine on iOS/Safari.
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }
}
