let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function isAudioMuted(): boolean {
  if (typeof window !== 'undefined') {
    const val = localStorage.getItem('bongoweb_audio_muted');
    if (val !== null) return val === 'true';
  }
  return isMuted;
}

export function setAudioMuted(muted: boolean): void {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('bongoweb_audio_muted', String(muted));
  }
}

export function toggleAudioMute(): boolean {
  const next = !isAudioMuted();
  setAudioMuted(next);
  return next;
}

export function playClickSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.025);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.026);
  } catch {}
}

export function playKeySound(opts?: { isSpace?: boolean; volume?: number }): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const isSpace = opts?.isSpace ?? false;
    const vol = opts?.volume ?? 0.07;
    const pitch = 0.9 + Math.random() * 0.2;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startFreq = (isSpace ? 950 : 1900) * pitch;
    const endFreq = (isSpace ? 350 : 720) * pitch;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.022);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.023);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.024);
  } catch {}
}

export function playChimeSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.08);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.085);
  } catch {}
}

export function playSuccessSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.045, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.29);
    });
  } catch {}
}

export function playKeyboardTypeSound(opts?: { isSpace?: boolean; volume?: number }): void {
  playKeySound(opts);
}

export function playStepSwooshSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(740, t + 0.08);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.085);
  } catch {}
}

export function playAllStepsCelebrationSound(): void {
  playSuccessSound();
}

export const toggleAudioMuted = toggleAudioMute;

export function initGlobalClickSound(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, a, input[type="radio"], input[type="checkbox"], select, [role="button"], [data-clickable]')) {
      playClickSound();
    }
  }, { capture: true, passive: true });
}

