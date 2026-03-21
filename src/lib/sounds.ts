export type SoundThemeId =
  | 'mechanical'
  | 'typewriter'
  | 'soft'
  | 'game'
  | 'thock'
  | 'laptop'
  | 'clicky'
  | 'marble'
  | 'neon'
  | 'spring';

export type SoundThemeOption = {
  id: SoundThemeId;
  name: string;
  description: string;
  badge: string;
};

type LayerRecipe = {
  attack?: number;
  duration: number;
  endFrequency: number;
  filterFrequency: number;
  filterQ?: number;
  filterType: BiquadFilterType;
  gain: number;
  startFrequency: number;
  type: OscillatorType;
};

type NoiseRecipe = {
  duration: number;
  filterFrequency: number;
  filterQ?: number;
  filterType: BiquadFilterType;
  gain: number;
};

type ThemeRecipe = {
  click: {
    layers: LayerRecipe[];
    noise?: NoiseRecipe;
  };
  error: {
    layers: LayerRecipe[];
    noise?: NoiseRecipe;
  };
  previewPattern: number[];
};

const SOUND_THEME_STORAGE_KEY = 'soundTheme';
const DEFAULT_SOUND_THEME: SoundThemeId = 'mechanical';

export const SOUND_THEMES: SoundThemeOption[] = [
  { id: 'mechanical', name: 'Механикалық', description: 'Құрғақ, анық, switch стилі.', badge: 'classic' },
  { id: 'typewriter', name: 'Жазу машинкасы', description: 'Металл реңкі бар ретро дыбыс.', badge: 'retro' },
  { id: 'soft', name: 'Жұмсақ', description: 'Жеңіл әрі бәсең дыбыс.', badge: 'quiet' },
  { id: 'game', name: 'Ойын', description: 'Пиксель реңкі бар шапшаң дыбыс.', badge: 'arcade' },
  { id: 'thock', name: 'Thock', description: 'Төмен, қанық және ауыр басылу.', badge: 'deep' },
  { id: 'laptop', name: 'Ноутбук', description: 'Қысқа, жіңішке, офис стилі.', badge: 'office' },
  { id: 'clicky', name: 'Clicky', description: 'Жоғары, шертпе, өте айқын.', badge: 'sharp' },
  { id: 'marble', name: 'Marble', description: 'Таза, шыныға ұқсас жеңіл дыбыс.', badge: 'clean' },
  { id: 'neon', name: 'Neon', description: 'Synth реңкі бар жарқын дыбыс.', badge: 'synth' },
  { id: 'spring', name: 'Spring', description: 'Серпімді rebound эффектісі бар.', badge: 'elastic' },
];

const SOUND_RECIPES: Record<SoundThemeId, ThemeRecipe> = {
  mechanical: {
    click: {
      layers: [
        { type: 'square', startFrequency: 520, endFrequency: 120, duration: 0.038, gain: 0.07, filterType: 'highpass', filterFrequency: 950, filterQ: 0.8 },
        { type: 'triangle', startFrequency: 310, endFrequency: 180, duration: 0.048, gain: 0.035, filterType: 'bandpass', filterFrequency: 1400, filterQ: 1.4 },
      ],
      noise: { gain: 0.025, duration: 0.022, filterType: 'highpass', filterFrequency: 2500, filterQ: 0.7 },
    },
    error: {
      layers: [{ type: 'square', startFrequency: 180, endFrequency: 90, duration: 0.12, gain: 0.12, filterType: 'lowpass', filterFrequency: 900, filterQ: 0.7 }],
      noise: { gain: 0.012, duration: 0.06, filterType: 'bandpass', filterFrequency: 700, filterQ: 0.8 },
    },
    previewPattern: [0, 0.075, 0.15, 0.255],
  },
  typewriter: {
    click: {
      layers: [
        { type: 'triangle', startFrequency: 1350, endFrequency: 220, duration: 0.05, gain: 0.11, filterType: 'bandpass', filterFrequency: 1900, filterQ: 1.8 },
        { type: 'square', startFrequency: 460, endFrequency: 180, duration: 0.045, gain: 0.04, filterType: 'highpass', filterFrequency: 1100, filterQ: 1 },
      ],
      noise: { gain: 0.03, duration: 0.032, filterType: 'highpass', filterFrequency: 2800, filterQ: 0.6 },
    },
    error: {
      layers: [{ type: 'sawtooth', startFrequency: 220, endFrequency: 70, duration: 0.14, gain: 0.14, filterType: 'lowpass', filterFrequency: 800, filterQ: 0.8 }],
      noise: { gain: 0.015, duration: 0.08, filterType: 'lowpass', filterFrequency: 1200, filterQ: 1.1 },
    },
    previewPattern: [0, 0.09, 0.18, 0.31],
  },
  soft: {
    click: {
      layers: [
        { type: 'sine', startFrequency: 290, endFrequency: 105, duration: 0.055, gain: 0.08, filterType: 'lowpass', filterFrequency: 520, filterQ: 0.5 },
        { type: 'triangle', startFrequency: 420, endFrequency: 150, duration: 0.04, gain: 0.03, filterType: 'lowpass', filterFrequency: 850, filterQ: 0.7 },
      ],
    },
    error: {
      layers: [{ type: 'sine', startFrequency: 170, endFrequency: 80, duration: 0.12, gain: 0.08, filterType: 'lowpass', filterFrequency: 500, filterQ: 0.6 }],
    },
    previewPattern: [0, 0.095, 0.19, 0.31],
  },
  game: {
    click: {
      layers: [
        { type: 'square', startFrequency: 820, endFrequency: 1230, duration: 0.045, gain: 0.07, filterType: 'lowpass', filterFrequency: 2100, filterQ: 0.8 },
        { type: 'square', startFrequency: 520, endFrequency: 760, duration: 0.04, gain: 0.035, filterType: 'bandpass', filterFrequency: 1600, filterQ: 1.2 },
      ],
    },
    error: {
      layers: [{ type: 'sawtooth', startFrequency: 240, endFrequency: 55, duration: 0.15, gain: 0.12, filterType: 'lowpass', filterFrequency: 900, filterQ: 0.8 }],
    },
    previewPattern: [0, 0.07, 0.14, 0.23],
  },
  thock: {
    click: {
      layers: [
        { type: 'sine', startFrequency: 185, endFrequency: 62, duration: 0.065, gain: 0.11, filterType: 'lowpass', filterFrequency: 420, filterQ: 0.7 },
        { type: 'triangle', startFrequency: 340, endFrequency: 90, duration: 0.06, gain: 0.055, filterType: 'lowpass', filterFrequency: 650, filterQ: 0.8 },
      ],
      noise: { gain: 0.01, duration: 0.018, filterType: 'bandpass', filterFrequency: 1500, filterQ: 1.2 },
    },
    error: {
      layers: [{ type: 'triangle', startFrequency: 140, endFrequency: 50, duration: 0.14, gain: 0.12, filterType: 'lowpass', filterFrequency: 380, filterQ: 0.7 }],
    },
    previewPattern: [0, 0.085, 0.17, 0.29],
  },
  laptop: {
    click: {
      layers: [
        { type: 'square', startFrequency: 720, endFrequency: 280, duration: 0.028, gain: 0.045, filterType: 'highpass', filterFrequency: 1800, filterQ: 1.1 },
        { type: 'triangle', startFrequency: 520, endFrequency: 240, duration: 0.032, gain: 0.028, filterType: 'bandpass', filterFrequency: 1400, filterQ: 1.2 },
      ],
      noise: { gain: 0.018, duration: 0.018, filterType: 'highpass', filterFrequency: 3200, filterQ: 0.7 },
    },
    error: {
      layers: [{ type: 'square', startFrequency: 210, endFrequency: 90, duration: 0.09, gain: 0.09, filterType: 'bandpass', filterFrequency: 600, filterQ: 1.3 }],
    },
    previewPattern: [0, 0.06, 0.12, 0.2],
  },
  clicky: {
    click: {
      layers: [
        { type: 'square', startFrequency: 1050, endFrequency: 240, duration: 0.032, gain: 0.085, filterType: 'highpass', filterFrequency: 2200, filterQ: 1.4 },
        { type: 'square', startFrequency: 620, endFrequency: 160, duration: 0.038, gain: 0.035, filterType: 'bandpass', filterFrequency: 1700, filterQ: 1.6 },
      ],
      noise: { gain: 0.026, duration: 0.02, filterType: 'highpass', filterFrequency: 3500, filterQ: 0.8 },
    },
    error: {
      layers: [{ type: 'sawtooth', startFrequency: 260, endFrequency: 85, duration: 0.12, gain: 0.11, filterType: 'bandpass', filterFrequency: 800, filterQ: 1.1 }],
    },
    previewPattern: [0, 0.065, 0.13, 0.22],
  },
  marble: {
    click: {
      layers: [
        { type: 'triangle', startFrequency: 610, endFrequency: 250, duration: 0.05, gain: 0.055, filterType: 'bandpass', filterFrequency: 1300, filterQ: 1.6 },
        { type: 'sine', startFrequency: 480, endFrequency: 190, duration: 0.055, gain: 0.045, filterType: 'highpass', filterFrequency: 900, filterQ: 0.8 },
      ],
      noise: { gain: 0.012, duration: 0.018, filterType: 'bandpass', filterFrequency: 2600, filterQ: 2 },
    },
    error: {
      layers: [{ type: 'triangle', startFrequency: 200, endFrequency: 95, duration: 0.11, gain: 0.09, filterType: 'bandpass', filterFrequency: 720, filterQ: 1 }],
    },
    previewPattern: [0, 0.08, 0.165, 0.28],
  },
  neon: {
    click: {
      layers: [
        { type: 'sine', startFrequency: 760, endFrequency: 300, duration: 0.045, gain: 0.06, filterType: 'bandpass', filterFrequency: 1800, filterQ: 1.8 },
        { type: 'triangle', startFrequency: 980, endFrequency: 420, duration: 0.05, gain: 0.045, filterType: 'highpass', filterFrequency: 1500, filterQ: 1.1 },
      ],
    },
    error: {
      layers: [{ type: 'sawtooth', startFrequency: 240, endFrequency: 100, duration: 0.13, gain: 0.11, filterType: 'bandpass', filterFrequency: 950, filterQ: 1.2 }],
    },
    previewPattern: [0, 0.07, 0.145, 0.245],
  },
  spring: {
    click: {
      layers: [
        { type: 'triangle', startFrequency: 440, endFrequency: 130, duration: 0.055, gain: 0.065, filterType: 'bandpass', filterFrequency: 1100, filterQ: 1.5 },
        { type: 'sine', startFrequency: 260, endFrequency: 180, duration: 0.065, gain: 0.04, filterType: 'lowpass', filterFrequency: 750, filterQ: 0.7 },
      ],
      noise: { gain: 0.015, duration: 0.02, filterType: 'highpass', filterFrequency: 2400, filterQ: 0.8 },
    },
    error: {
      layers: [{ type: 'triangle', startFrequency: 190, endFrequency: 70, duration: 0.14, gain: 0.1, filterType: 'lowpass', filterFrequency: 620, filterQ: 0.9 }],
    },
    previewPattern: [0, 0.08, 0.155, 0.27],
  },
};

function getThemeRecipe(themeId: string | null | undefined) {
  return SOUND_RECIPES[themeId as SoundThemeId] ?? SOUND_RECIPES[DEFAULT_SOUND_THEME];
}

export function getStoredSoundTheme() {
  if (typeof window === 'undefined') {
    return DEFAULT_SOUND_THEME;
  }

  const storedTheme = window.localStorage.getItem(SOUND_THEME_STORAGE_KEY);
  return SOUND_THEMES.some((theme) => theme.id === storedTheme) ? (storedTheme as SoundThemeId) : DEFAULT_SOUND_THEME;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private getNoiseBuffer() {
    if (!this.ctx) {
      return null;
    }

    if (!this.noiseBuffer) {
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const channel = buffer.getChannelData(0);

      for (let index = 0; index < channel.length; index += 1) {
        channel[index] = Math.random() * 2 - 1;
      }

      this.noiseBuffer = buffer;
    }

    return this.noiseBuffer;
  }

  private scheduleLayer(layer: LayerRecipe, atTime: number, velocity: number) {
    if (!this.ctx) {
      return;
    }

    const oscillator = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    oscillator.type = layer.type;
    oscillator.frequency.setValueAtTime(layer.startFrequency, atTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, layer.endFrequency), atTime + layer.duration);

    filter.type = layer.filterType;
    filter.frequency.setValueAtTime(layer.filterFrequency, atTime);
    filter.Q.setValueAtTime(layer.filterQ ?? 0.7, atTime);

    gain.gain.setValueAtTime(0.0001, atTime);
    gain.gain.linearRampToValueAtTime(layer.gain * velocity, atTime + (layer.attack ?? 0.003));
    gain.gain.exponentialRampToValueAtTime(0.0001, atTime + layer.duration);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    oscillator.start(atTime);
    oscillator.stop(atTime + layer.duration + 0.01);
  }

  private scheduleNoise(noise: NoiseRecipe | undefined, atTime: number, velocity: number) {
    if (!this.ctx || !noise) {
      return;
    }

    const buffer = this.getNoiseBuffer();
    if (!buffer) {
      return;
    }

    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    source.buffer = buffer;
    filter.type = noise.filterType;
    filter.frequency.setValueAtTime(noise.filterFrequency, atTime);
    filter.Q.setValueAtTime(noise.filterQ ?? 0.7, atTime);

    gain.gain.setValueAtTime(noise.gain * velocity, atTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, atTime + noise.duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(atTime);
    source.stop(atTime + noise.duration + 0.01);
  }

  private scheduleSound(kind: 'click' | 'error', themeId?: SoundThemeId, offset = 0, velocity = 1) {
    this.init();
    if (!this.ctx) {
      return;
    }

    const recipe = getThemeRecipe(themeId ?? getStoredSoundTheme())[kind];
    const atTime = this.ctx.currentTime + Math.max(0, offset);

    recipe.layers.forEach((layer) => this.scheduleLayer(layer, atTime, velocity));
    this.scheduleNoise(recipe.noise, atTime, velocity);
  }

  playClick(themeId?: SoundThemeId, offset = 0, velocity = 1) {
    this.scheduleSound('click', themeId, offset, velocity);
  }

  playError(themeId?: SoundThemeId, offset = 0, velocity = 1) {
    this.scheduleSound('error', themeId, offset, velocity);
  }

  previewTheme(themeId?: SoundThemeId) {
    const selectedTheme = themeId ?? getStoredSoundTheme();
    const recipe = getThemeRecipe(selectedTheme);

    recipe.previewPattern.forEach((offset, index) => {
      const velocity = index === recipe.previewPattern.length - 1 ? 1.15 : 0.95 + index * 0.05;
      this.playClick(selectedTheme, offset, velocity);
    });
  }
}

export const soundEngine = new SoundEngine();
