import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

const globalNode = global as any;

// Module-level singleton players (stored in global to survive Fast Refresh hot-reloads)
let _bgmPlayer: AudioPlayer | null = globalNode.__bgmPlayer || null;
let _clickPlayer: AudioPlayer | null = globalNode.__clickPlayer || null;
let _brushPlayer: AudioPlayer | null = globalNode.__brushPlayer || null;
let _audioModeInitialized = globalNode.__audioModeInitialized || false;

async function ensureAudioMode() {
  if (_audioModeInitialized) return;
  _audioModeInitialized = true;
  globalNode.__audioModeInitialized = true;
  try {
    await setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  } catch (e) {
    console.log('[Audio] setAudioMode error:', e);
    _audioModeInitialized = false;
  }
}

// ─── Background Music ─────────────────────────────────────────────────────────

export async function initBgm() {
  if (_bgmPlayer) return; // already initialized
  try {
    await ensureAudioMode();
    _bgmPlayer = createAudioPlayer(
      require('../../assets/sounds/Background.mp3')
    );
    _bgmPlayer.loop = true;
    _bgmPlayer.volume = 0.25;
    _bgmPlayer.play();
    globalNode.__bgmPlayer = _bgmPlayer;
  } catch (e) {
    console.log('[BGM] init error:', e);
    _bgmPlayer = null;
    globalNode.__bgmPlayer = null;
  }
}

export function pauseBgm() {
  _bgmPlayer?.pause();
}

export function playBgm() {
  _bgmPlayer?.play();
}

export function toggleBgm() {
  if (!_bgmPlayer) return;
  if (_bgmPlayer.playing) {
    _bgmPlayer.pause();
  } else {
    _bgmPlayer.play();
  }
}

export function setBgmVolume(volume: number) {
  if (_bgmPlayer) _bgmPlayer.volume = volume;
}

export function isBgmPlaying(): boolean {
  return _bgmPlayer?.playing ?? false;
}

// ─── UI Click Sound ───────────────────────────────────────────────────────────

export async function initClickSound() {
  if (_clickPlayer) return;
  try {
    await ensureAudioMode();
    _clickPlayer = createAudioPlayer(
      require('../../assets/sounds/UI_click.mp3')
    );
    _clickPlayer.volume = 2.0;
    globalNode.__clickPlayer = _clickPlayer;
  } catch (e) {
    console.log('[Click] init error:', e);
    _clickPlayer = null;
    globalNode.__clickPlayer = null;
  }
}

export function playClick() {
  if (!_clickPlayer) return;
  try {
    // Seek to start so rapid clicks don't get delayed
    _clickPlayer.seekTo(0);
    _clickPlayer.play();
  } catch (_) {
    // ignore if sound not loaded yet
  }
}

// ─── Brush Sound ──────────────────────────────────────────────────────────────

export async function initBrushSound() {
  if (_brushPlayer) return;
  try {
    await ensureAudioMode();
    _brushPlayer = createAudioPlayer(
      require('../../assets/sounds/brush_paper.mp3')
    );
    _brushPlayer.loop = true; // Loop while drawing
    _brushPlayer.volume = 1.0;
    globalNode.__brushPlayer = _brushPlayer;
  } catch (e) {
    console.log('[Brush] init error:', e);
    _brushPlayer = null;
    globalNode.__brushPlayer = null;
  }
}

export function startBrushSound() {
  if (!_brushPlayer) {
    // Lazy init just in case Fast Refresh skipped the layout effect
    initBrushSound().then(() => {
      try {
        _brushPlayer?.play();
      } catch (e) {}
    });
    return;
  }
  try {
    _brushPlayer.play();
  } catch (e) {
    console.log('[Brush] play error:', e);
  }
}

export function stopBrushSound() {
  if (!_brushPlayer) return;
  try {
    _brushPlayer.pause();
  } catch (e) {
    console.log('[Brush] stop error:', e);
  }
}
