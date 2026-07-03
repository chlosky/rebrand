type PlayerState = {
  url: string | null;
  isPlaying: boolean;
  isLooping: boolean;
  /** Stable id from `subliminal_tracks` — survives signed-vs-public URL mismatch after navigation. */
  activeTrackId: string | null;
};

type Listener = (state: PlayerState) => void;

let audio: HTMLAudioElement | null = null;
let state: PlayerState = { url: null, isPlaying: false, isLooping: false, activeTrackId: null };
const listeners = new Set<Listener>();

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  audio.playsInline = true;
  audio.addEventListener("play", () => {
    state = { ...state, isPlaying: true };
    emit();
  });
  audio.addEventListener("pause", () => {
    state = { ...state, isPlaying: false };
    emit();
  });
  audio.addEventListener("ended", () => {
    state = { ...state, isPlaying: false };
    emit();
  });
  return audio;
}

function emit() {
  for (const l of listeners) l(state);
}

export function getSubliminalPlayerState(): PlayerState {
  return state;
}

export function getSubliminalAudioElement(): HTMLAudioElement | null {
  return audio;
}

export function subscribeSubliminalPlayer(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export async function playSubliminalUrl(
  url: string,
  opts?: { loop?: boolean; volume?: number; activeTrackId?: string | null },
) {
  const a = ensureAudio();
  const loop = opts?.loop ?? state.isLooping;
  const volume = opts?.volume;
  const activeTrackId =
    opts?.activeTrackId !== undefined ? opts.activeTrackId : state.activeTrackId;

  // If switching tracks/urls, pause first to avoid double-audio on some browsers.
  const switching = state.url !== url;
  if (switching) {
    a.pause();
    a.currentTime = 0;
    a.src = url;
  }

  a.loop = loop;
  if (typeof volume === "number") a.volume = Math.min(1, Math.max(0, volume));

  state = { url, isPlaying: false, isLooping: loop, activeTrackId };
  emit();

  try {
    await a.play();
  } catch (e) {
    state = { ...state, isPlaying: false };
    emit();
    throw e;
  }
}

export function pauseSubliminal() {
  if (!audio) return;
  audio.pause();
}

/** Drop “which track is loaded” without tearing down audio element (e.g. user pauses). */
export function clearSubliminalActiveTrackId() {
  state = { ...state, activeTrackId: null };
  emit();
}

/** Full stop for dismiss / delete current file — clears src so UI and audio agree. */
export function detachSubliminalPlayback() {
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
    try {
      audio.load();
    } catch {
      /* ignore */
    }
  }
  state = { url: null, isPlaying: false, isLooping: state.isLooping, activeTrackId: null };
  emit();
}

export function toggleSubliminal(
  url: string,
  opts?: { loop?: boolean; volume?: number; activeTrackId?: string | null },
) {
  if (state.url === url && state.isPlaying) {
    pauseSubliminal();
    return;
  }
  return playSubliminalUrl(url, opts);
}

export function setSubliminalLoop(loop: boolean) {
  const a = ensureAudio();
  a.loop = loop;
  state = { ...state, isLooping: loop };
  emit();
}

