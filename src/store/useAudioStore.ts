import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { useSettingsStore } from './useSettingsStore';

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
      playsInSilentMode: true,
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
    const bgmVol = useSettingsStore.getState().bgmVolume ?? 0.25;
    _bgmPlayer.volume = bgmVol;
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

// (setBgmVolume is provided at bottom and updates settings too)

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
    const sfxVol = useSettingsStore.getState().sfxVolume || 1.0;
    _clickPlayer.volume = 2.0 * sfxVol;
    globalNode.__clickPlayer = _clickPlayer;
  } catch (e) {
    console.log('[Click] init error:', e);
    _clickPlayer = null;
    globalNode.__clickPlayer = null;
  }
}

export function playClick() {
  if (!_clickPlayer) return;
  if (!useSettingsStore.getState().soundEnabled) return;
  try {
    _clickPlayer.seekTo(0);
    _clickPlayer.play();
  } catch (e) {
    console.log('[Click] play error:', e);
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
    const sfxVol = useSettingsStore.getState().sfxVolume || 1.0;
    _brushPlayer.volume = 1.0 * sfxVol;
    globalNode.__brushPlayer = _brushPlayer;
  } catch (e) {
    console.log('[Brush] init error:', e);
    _brushPlayer = null;
    globalNode.__brushPlayer = null;
  }
}

export function startBrushSound() {
  if (!useSettingsStore.getState().soundEnabled) return;
  
  if (!_brushPlayer) {
    // Lazy init just in case Fast Refresh skipped the layout effect
    initBrushSound().then(() => {
      try {
        if (useSettingsStore.getState().soundEnabled) {
          _brushPlayer?.play();
        }
      } catch {}
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

// ─── SFX Volume Control ────────────────────────────────────────────────────────

export function setSfxVolume(volume: number) {
  useSettingsStore.getState().setSfxVolume(volume);
  if (_clickPlayer) _clickPlayer.volume = 2.0 * volume;
  if (_brushPlayer) _brushPlayer.volume = 1.0 * volume;
}

export function setBgmVolume(volume: number) {
  useSettingsStore.getState().setBgmVolume(volume);
  if (_bgmPlayer) _bgmPlayer.volume = volume;
}
