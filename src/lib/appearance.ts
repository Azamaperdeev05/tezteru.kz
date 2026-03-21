export type ThemeOption = {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  bg: string;
  main: string;
  sub: string;
  accent: string;
  error: string;
  errorExtra: string;
};

export type FontOption = {
  id: string;
  name: string;
  cssValue: string;
};

type ThemeMode = ThemeOption['mode'];

const STORAGE_KEYS = {
  font: 'font',
  interfaceFont: 'interfaceFont',
  theme: 'theme',
  themeFavorites: 'themeFavorites',
  themeRecents: 'themeRecents',
  typingFont: 'typingFont',
} as const;

const CONTRAST_TARGETS = {
  accent: 2.6,
  error: 3.2,
  errorExtra: 3.8,
  main: 4.5,
  sub: 2.4,
} as const;

const MAX_RECENT_THEMES = 8;
const DARK_MODE_TARGET = '#f8fafc';
const LIGHT_MODE_TARGET = '#111827';

export const DEFAULT_THEME_ID = 'dark';
export const DEFAULT_INTERFACE_FONT_ID = 'Inter';
export const DEFAULT_TYPING_FONT_ID = 'IBM Plex Sans';
export const DEFAULT_FONT_ID = DEFAULT_INTERFACE_FONT_ID;
export const THEME_CHANGE_EVENT = 'tezteru:theme-change';

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexToRgb(hex: string) {
  const normalizedHex = hex.replace('#', '');
  return [
    parseInt(normalizedHex.slice(0, 2), 16),
    parseInt(normalizedHex.slice(2, 4), 16),
    parseInt(normalizedHex.slice(4, 6), 16),
  ] as const;
}

function rgbToHex(rgb: readonly [number, number, number]) {
  return `#${rgb.map((channel) => clampChannel(channel).toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(baseHex: string, targetHex: string, amount: number) {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);
  const nextColor = base.map((channel, index) => channel + (target[index] - channel) * amount) as [number, number, number];

  return rgbToHex(nextColor);
}

function getRelativeLuminance(hex: string) {
  const [red, green, blue] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getContrastRatio(backgroundHex: string, foregroundHex: string) {
  const backgroundLuminance = getRelativeLuminance(backgroundHex);
  const foregroundLuminance = getRelativeLuminance(foregroundHex);
  const lighter = Math.max(backgroundLuminance, foregroundLuminance);
  const darker = Math.min(backgroundLuminance, foregroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function tuneColorForContrast(colorHex: string, backgroundHex: string, minContrast: number, mode: ThemeMode) {
  if (getContrastRatio(backgroundHex, colorHex) >= minContrast) {
    return colorHex;
  }

  const targetHex = mode === 'dark' ? DARK_MODE_TARGET : LIGHT_MODE_TARGET;

  for (let step = 1; step <= 24; step += 1) {
    const tunedHex = mixHex(colorHex, targetHex, step / 24);
    if (getContrastRatio(backgroundHex, tunedHex) >= minContrast) {
      return tunedHex;
    }
  }

  return targetHex;
}

function normalizeTheme(theme: ThemeOption): ThemeOption {
  return {
    ...theme,
    accent: tuneColorForContrast(theme.accent, theme.bg, CONTRAST_TARGETS.accent, theme.mode),
    error: tuneColorForContrast(theme.error, theme.bg, CONTRAST_TARGETS.error, theme.mode),
    errorExtra: tuneColorForContrast(theme.errorExtra, theme.bg, CONTRAST_TARGETS.errorExtra, theme.mode),
    main: tuneColorForContrast(theme.main, theme.bg, CONTRAST_TARGETS.main, theme.mode),
    sub: tuneColorForContrast(theme.sub, theme.bg, CONTRAST_TARGETS.sub, theme.mode),
  };
}

const RAW_THEMES: ThemeOption[] = [
  { id: 'light', name: 'Light', mode: 'light', bg: '#eeebe2', main: '#080909', sub: '#99947f', accent: '#d9736f', error: '#d9736f', errorExtra: '#b55f5c' },
  { id: 'dark', name: 'Dark', mode: 'dark', bg: '#323437', main: '#d1d0c5', sub: '#646669', accent: '#e2b714', error: '#ca4754', errorExtra: '#7e2a33' },
  { id: 'dracula', name: 'Dracula', mode: 'dark', bg: '#282a36', main: '#f8f8f2', sub: '#6272a4', accent: '#ff79c6', error: '#ff5555', errorExtra: '#bd2c40' },
  { id: 'matrix', name: 'Matrix', mode: 'dark', bg: '#000000', main: '#00ff41', sub: '#008f11', accent: '#d1ffcd', error: '#ff003c', errorExtra: '#8f0022' },
  { id: 'nord', name: 'Nord', mode: 'dark', bg: '#2e3440', main: '#d8dee9', sub: '#4c566a', accent: '#88c0d0', error: '#bf616a', errorExtra: '#8f3b43' },
  { id: 'serika-dark', name: 'Serika Dark', mode: 'dark', bg: '#323437', main: '#d1d0c5', sub: '#646669', accent: '#e2b714', error: '#ca4754', errorExtra: '#7e2a33' },
  { id: 'solarized-dark', name: 'Solarized Dark', mode: 'dark', bg: '#002b36', main: '#93a1a1', sub: '#586e75', accent: '#b58900', error: '#dc322f', errorExtra: '#8d1f1f' },
  { id: 'gruvbox-dark', name: 'Gruvbox Dark', mode: 'dark', bg: '#282828', main: '#ebdbb2', sub: '#928374', accent: '#fabd2f', error: '#fb4934', errorExtra: '#9d281b' },
  { id: 'catppuccin', name: 'Catppuccin', mode: 'dark', bg: '#1e1e2e', main: '#cdd6f4', sub: '#6c7086', accent: '#f5c2e7', error: '#f38ba8', errorExtra: '#a04c65' },
  { id: 'rose-pine', name: 'Rose Pine', mode: 'dark', bg: '#191724', main: '#e0def4', sub: '#6e6a86', accent: '#ebbcba', error: '#eb6f92', errorExtra: '#9c4962' },
  { id: 'tokyo-night', name: 'Tokyo Night', mode: 'dark', bg: '#1a1b26', main: '#c0caf5', sub: '#565f89', accent: '#7aa2f7', error: '#f7768e', errorExtra: '#a94d61' },
  { id: 'everforest', name: 'Everforest', mode: 'dark', bg: '#2b3339', main: '#d3c6aa', sub: '#7a8478', accent: '#a7c080', error: '#e67e80', errorExtra: '#9b5153' },
  { id: 'monokai', name: 'Monokai', mode: 'dark', bg: '#272822', main: '#f8f8f2', sub: '#75715e', accent: '#a6e22e', error: '#f92672', errorExtra: '#a01b4d' },
  { id: 'synthwave', name: 'Synthwave', mode: 'dark', bg: '#241b2f', main: '#f6f1ff', sub: '#7f6f9f', accent: '#ff7edb', error: '#ff5c8a', errorExtra: '#a73f60' },
  { id: 'sunset', name: 'Sunset', mode: 'dark', bg: '#1f1c2c', main: '#f7f4ea', sub: '#9a8c98', accent: '#ff9f1c', error: '#ff4d6d', errorExtra: '#a63147' },
  { id: 'ocean', name: 'Ocean', mode: 'dark', bg: '#0f172a', main: '#e2e8f0', sub: '#64748b', accent: '#38bdf8', error: '#f87171', errorExtra: '#a44949' },
  { id: 'forest', name: 'Forest', mode: 'dark', bg: '#1b2a1f', main: '#e8f1e8', sub: '#6b8f71', accent: '#95d5b2', error: '#ef476f', errorExtra: '#9b3147' },
  { id: 'carbon', name: 'Carbon', mode: 'dark', bg: '#161616', main: '#f2f4f8', sub: '#8d8d8d', accent: '#78a9ff', error: '#fa4d56', errorExtra: '#9e3137' },
  { id: 'dino', name: 'dino', mode: 'light', bg: '#f3f7ef', main: '#23753b', sub: '#8db389', accent: '#34c759', error: '#ca5e51', errorExtra: '#8f4139' },
  { id: 'magic-girl', name: 'magic girl', mode: 'light', bg: '#fff2f7', main: '#db79ab', sub: '#e7b2c9', accent: '#ff9bc2', error: '#d65d7f', errorExtra: '#9b4057' },
  { id: 'milkshake', name: 'milkshake', mode: 'light', bg: '#f7f4fb', main: '#28324a', sub: '#a3abc0', accent: '#6e80a6', error: '#c85c70', errorExtra: '#904252' },
  { id: 'modern-ink', name: 'modern ink', mode: 'light', bg: '#fcfbfb', main: '#273248', sub: '#9098aa', accent: '#ff5e3a', error: '#db4f4f', errorExtra: '#9a3535' },
  { id: 'ms-cupcakes', name: 'ms cupcakes', mode: 'light', bg: '#f6fcff', main: '#2f94c7', sub: '#a7d7ef', accent: '#36c5ff', error: '#df6b8e', errorExtra: '#a14b65' },
  { id: 'sewing-tin-light', name: 'sewing tin light', mode: 'light', bg: '#f7f7fc', main: '#464694', sub: '#a4a7d3', accent: '#666ccf', error: '#cc6174', errorExtra: '#944456' },
  { id: 'vesper-light', name: 'vesper light', mode: 'light', bg: '#fff7ef', main: '#ff7a00', sub: '#e8bc96', accent: '#ff9838', error: '#c95a45', errorExtra: '#8e3f31' },
  { id: 'lilac-mist', name: 'lilac mist', mode: 'light', bg: '#fcf7ff', main: '#bb58a3', sub: '#dbb8d7', accent: '#cf7dc0', error: '#d05c79', errorExtra: '#954257' },
  { id: 'rose-pine-dawn', name: 'rose pine dawn', mode: 'light', bg: '#faf4ed', main: '#4c8f9c', sub: '#b7a7c7', accent: '#d7827e', error: '#b4637a', errorExtra: '#83495b' },
  { id: 'soaring-skies', name: 'soaring skies', mode: 'light', bg: '#f4fbff', main: '#2f97db', sub: '#acd8f6', accent: '#65c8ff', error: '#d6677a', errorExtra: '#984a58' },
  { id: 'rainbow-trail', name: 'rainbow trail', mode: 'light', bg: '#fafafa', main: '#494949', sub: '#c7c7c7', accent: '#56a64b', error: '#de5d53', errorExtra: '#a44039' },
  { id: 'nord-light', name: 'nord light', mode: 'light', bg: '#eceff4', main: '#2e3440', sub: '#8ea1be', accent: '#5e81ac', error: '#bf616a', errorExtra: '#8f4551' },
  { id: 'solarized-light', name: 'solarized light', mode: 'light', bg: '#fdf6e3', main: '#657b83', sub: '#93a1a1', accent: '#b58900', error: '#dc322f', errorExtra: '#a12a26' },
  { id: 'tangerine', name: 'tangerine', mode: 'light', bg: '#fff1e6', main: '#ff6b18', sub: '#efc19d', accent: '#ff9447', error: '#d95144', errorExtra: '#973932' },
  { id: 'camping', name: 'camping', mode: 'light', bg: '#f7f1e2', main: '#5f8b59', sub: '#b4bf97', accent: '#7aa36b', error: '#c76759', errorExtra: '#8f473e' },
  { id: 'slambook', name: 'slambook', mode: 'light', bg: '#fffad8', main: '#23263c', sub: '#c8bc73', accent: '#f2d75b', error: '#d76a55', errorExtra: '#964a3b' },
  { id: 'paper', name: 'paper', mode: 'light', bg: '#f2f2f2', main: '#4f4f4f', sub: '#b6b6b6', accent: '#8a8a8a', error: '#d56c69', errorExtra: '#974845' },
  { id: 'desert-oasis', name: 'desert oasis', mode: 'light', bg: '#fff1c4', main: '#7b5d00', sub: '#b58f16', accent: '#1f6feb', error: '#685017', errorExtra: '#46370e' },
  { id: 'iceberg-light', name: 'iceberg light', mode: 'light', bg: '#f1f5fb', main: '#3258b0', sub: '#a7b6d6', accent: '#5f88ff', error: '#d06272', errorExtra: '#984552' },
  { id: 'cheesecake', name: 'cheesecake', mode: 'light', bg: '#fff0cd', main: '#a03f5f', sub: '#deb07e', accent: '#f4c978', error: '#d26461', errorExtra: '#944644' },
  { id: '9009', name: '9009', mode: 'light', bg: '#f5efe4', main: '#1f1f1f', sub: '#b8aa8a', accent: '#d9c89d', error: '#c95e54', errorExtra: '#8e433a' },
  { id: 'lil-dragon', name: 'lil dragon', mode: 'light', bg: '#f3edff', main: '#7d60d4', sub: '#cabce7', accent: '#9d7bff', error: '#d25b86', errorExtra: '#94405d' },
  { id: 'blueberry-light', name: 'blueberry light', mode: 'light', bg: '#eef3ff', main: '#4d657d', sub: '#b2bee2', accent: '#6c8dff', error: '#d6637d', errorExtra: '#994759' },
  { id: 'witch-girl', name: 'witch girl', mode: 'light', bg: '#fbe1e5', main: '#4e7c72', sub: '#d0abb4', accent: '#6d9c90', error: '#cb5f76', errorExtra: '#934255' },
  { id: 'terrazzo', name: 'terrazzo', mode: 'light', bg: '#f7e9dd', main: '#e2764c', sub: '#dbb99f', accent: '#f09b73', error: '#cc5d49', errorExtra: '#904136' },
  { id: 'darling', name: 'darling', mode: 'light', bg: '#ffc0cb', main: '#80394f', sub: '#db90a6', accent: '#fff3f6', error: '#ca4b72', errorExtra: '#933653' },
  { id: 'gruvbox-light', name: 'gruvbox light', mode: 'light', bg: '#fbf1c7', main: '#3c3836', sub: '#7c6f64', accent: '#d79921', error: '#cc241d', errorExtra: '#8f1b16' },
  { id: 'repose-light', name: 'repose light', mode: 'light', bg: '#f6efcf', main: '#666666', sub: '#c7bc93', accent: '#d9ceac', error: '#c56262', errorExtra: '#8c4444' },
  { id: 'godspeed', name: 'godspeed', mode: 'light', bg: '#f1ead4', main: '#6f91ad', sub: '#d2c5a1', accent: '#b4d3ee', error: '#d77777', errorExtra: '#9b5454' },
  { id: 'dollar', name: 'dollar', mode: 'light', bg: '#efeddc', main: '#6d8a61', sub: '#c5c0a2', accent: '#88a574', error: '#c86a62', errorExtra: '#8f4a44' },
  { id: 'dmg', name: 'dmg', mode: 'light', bg: '#dfdfe2', main: '#c51e79', sub: '#a7a7ae', accent: '#ef5da5', error: '#9a3f6a', errorExtra: '#6a2d49' },
  { id: 'modern-dolch-light', name: 'modern dolch light', mode: 'light', bg: '#e9e8ec', main: '#5e918a', sub: '#c0bec8', accent: '#78cfc2', error: '#d46d6d', errorExtra: '#975050' },
  { id: 'olive', name: 'olive', mode: 'light', bg: '#f3efd9', main: '#8a8e69', sub: '#cdc5a3', accent: '#a5a57c', error: '#bf6f63', errorExtra: '#884d44' },
  { id: 'taro', name: 'taro', mode: 'light', bg: '#c8cafc', main: '#2f2e62', sub: '#8e93de', accent: '#786fff', error: '#ca5a83', errorExtra: '#8d405d' },
  { id: 'shoko', name: 'shoko', mode: 'light', bg: '#dbe3ed', main: '#8dc8ef', sub: '#a8b8c7', accent: '#63b6ea', error: '#d76b6b', errorExtra: '#984c4c' },
  { id: 'beach', name: 'beach', mode: 'light', bg: '#ffeead', main: '#3f9498', sub: '#dbc97d', accent: '#ffd35d', error: '#e16b74', errorExtra: '#9e4a50' },
  { id: 'breeze', name: 'breeze', mode: 'light', bg: '#f5e4d2', main: '#8268d4', sub: '#ceb7a5', accent: '#a38bf0', error: '#d8737e', errorExtra: '#99535a' },
  { id: 'froyo', name: 'froyo', mode: 'light', bg: '#ece4d2', main: '#747b82', sub: '#c9bfaa', accent: '#a8aeb4', error: '#c46267', errorExtra: '#8b4549' },
  { id: 'mr-sleeves', name: 'mr sleeves', mode: 'light', bg: '#dde4ea', main: '#e0a392', sub: '#aab3ba', accent: '#efc2b7', error: '#cd6a6a', errorExtra: '#924949' },
  { id: 'fruit-chew', name: 'fruit chew', mode: 'light', bg: '#d8d3d8', main: '#723a7f', sub: '#aaa2ab', accent: '#9451a6', error: '#bd5b76', errorExtra: '#874257' },
  { id: 'peaches', name: 'peaches', mode: 'light', bg: '#eee3c4', main: '#ef8268', sub: '#c7b999', accent: '#f2a084', error: '#d75b58', errorExtra: '#99413f' },
  { id: 'hanok', name: 'hanok', mode: 'light', bg: '#e6dcc7', main: '#5f4c35', sub: '#baab8b', accent: '#8f7251', error: '#b55d50', errorExtra: '#7f4138' },
  { id: 'retro', name: 'retro', mode: 'light', bg: '#e4dec9', main: '#2f291f', sub: '#b5aa8d', accent: '#89785b', error: '#b45d50', errorExtra: '#7d4036' },
  { id: 'pastel', name: 'pastel', mode: 'light', bg: '#e9bdc9', main: '#6d4560', sub: '#c993ab', accent: '#fff0a8', error: '#cc637e', errorExtra: '#91455a' },
  { id: 'vaporwave', name: 'vaporwave', mode: 'light', bg: '#b6b8fd', main: '#db5cff', sub: '#8388d9', accent: '#57d4ff', error: '#ff5d90', errorExtra: '#a54062' },
  { id: 'frozen-llama', name: 'frozen llama', mode: 'light', bg: '#baf0eb', main: '#6f47d5', sub: '#84cbc6', accent: '#8b80ff', error: '#d05d80', errorExtra: '#924259' },
  { id: 'mizu', name: 'mizu', mode: 'light', bg: '#cbe0f0', main: '#577792', sub: '#91acc2', accent: '#83b8d6', error: '#d76674', errorExtra: '#974954' },
  { id: 'pink-lemonade', name: 'pink lemonade', mode: 'light', bg: '#ffe7a6', main: '#db7286', sub: '#dbc574', accent: '#ffc1cc', error: '#e56484', errorExtra: '#9f4860' },
  { id: 'tiramisu', name: 'tiramisu', mode: 'light', bg: '#d7cab7', main: '#c48d5a', sub: '#a89a85', accent: '#9b5c2f', error: '#b94f48', errorExtra: '#803733' },
  { id: 'macroblank', name: 'macroblank', mode: 'light', bg: '#c5e0db', main: '#ff3e21', sub: '#93bcb2', accent: '#2eb67d', error: '#cb4d3f', errorExtra: '#8b372d' },
  { id: 'snes', name: 'snes', mode: 'light', bg: '#d2d0d8', main: '#594aac', sub: '#ababb6', accent: '#7b67e2', error: '#c05b70', errorExtra: '#87414f' },
  { id: 'lavender', name: 'lavender', mode: 'light', bg: '#f6f2ff', main: '#2f243a', sub: '#8c7aa9', accent: '#9f86ff', error: '#d64550', errorExtra: '#933039' },
  { id: 'bingsu', name: 'bingsu', mode: 'light', bg: '#d0c1c4', main: '#8b6e79', sub: '#b7a6aa', accent: '#9f7f8b', error: '#b85f6d', errorExtra: '#83454f' },
  { id: 'strawberry', name: 'strawberry', mode: 'light', bg: '#f07d86', main: '#fff7f8', sub: '#f4b5bb', accent: '#ffd8dc', error: '#a62e43', errorExtra: '#732030' },
  { id: 'coral', name: 'coral', mode: 'light', bg: '#fff1eb', main: '#2f1b12', sub: '#b08968', accent: '#ff7f51', error: '#d62828', errorExtra: '#8f1b1b' },
  { id: 'creamsicle', name: 'creamsicle', mode: 'light', bg: '#ff9c6a', main: '#7b2d00', sub: '#ffd0b7', accent: '#fff1e6', error: '#c84d3f', errorExtra: '#8d382f' },
];

export const THEMES: ThemeOption[] = RAW_THEMES.map((theme) => normalizeTheme(theme));

export const UI_FONT_OPTIONS: FontOption[] = [
  { id: 'Inter', name: 'Inter', cssValue: '"Inter", "Segoe UI", sans-serif' },
  { id: 'Manrope', name: 'Manrope', cssValue: '"Manrope", "Segoe UI", sans-serif' },
  { id: 'Nunito', name: 'Nunito', cssValue: '"Nunito", "Segoe UI", sans-serif' },
  { id: 'Rubik', name: 'Rubik', cssValue: '"Rubik", "Segoe UI", sans-serif' },
  { id: 'IBM Plex Sans', name: 'IBM Plex Sans', cssValue: '"IBM Plex Sans", "Segoe UI", sans-serif' },
  { id: 'Montserrat', name: 'Montserrat', cssValue: '"Montserrat", "Segoe UI", sans-serif' },
];

export const TYPING_FONT_OPTIONS: FontOption[] = [
  { id: 'IBM Plex Sans', name: 'IBM Plex Sans', cssValue: '"IBM Plex Sans", sans-serif' },
  { id: 'Inter', name: 'Inter', cssValue: '"Inter", sans-serif' },
  { id: 'Roboto', name: 'Roboto', cssValue: '"Roboto", sans-serif' },
  { id: 'Montserrat', name: 'Montserrat', cssValue: '"Montserrat", sans-serif' },
  { id: 'Open Sans', name: 'Open Sans', cssValue: '"Open Sans", sans-serif' },
  { id: 'Nunito', name: 'Nunito', cssValue: '"Nunito", sans-serif' },
  { id: 'Playfair Display', name: 'Playfair Display', cssValue: '"Playfair Display", serif' },
  { id: 'Lora', name: 'Lora', cssValue: '"Lora", serif' },
  { id: 'Merriweather', name: 'Merriweather', cssValue: '"Merriweather", serif' },
  { id: 'Rubik', name: 'Rubik', cssValue: '"Rubik", sans-serif' },
  { id: 'Manrope', name: 'Manrope', cssValue: '"Manrope", sans-serif' },
  { id: 'Ubuntu', name: 'Ubuntu', cssValue: '"Ubuntu", sans-serif' },
  { id: 'Fira Sans', name: 'Fira Sans', cssValue: '"Fira Sans", sans-serif' },
  { id: 'Source Sans 3', name: 'Source Sans 3', cssValue: '"Source Sans 3", sans-serif' },
  { id: 'Noto Sans', name: 'Noto Sans', cssValue: '"Noto Sans", sans-serif' },
  { id: 'PT Sans', name: 'PT Sans', cssValue: '"PT Sans", sans-serif' },
  { id: 'Oswald', name: 'Oswald', cssValue: '"Oswald", sans-serif' },
  { id: 'Raleway', name: 'Raleway', cssValue: '"Raleway", sans-serif' },
  { id: 'Roboto Mono', name: 'Roboto Mono', cssValue: '"Roboto Mono", monospace' },
];

export const FONT_OPTIONS = UI_FONT_OPTIONS;

function getThemeById(themeId?: string | null) {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES.find((theme) => theme.id === DEFAULT_THEME_ID)!;
}

function getFontById(fonts: FontOption[], fontId: string | null | undefined, fallbackId: string) {
  return fonts.find((font) => font.id === fontId) ?? fonts.find((font) => font.id === fallbackId)!;
}

function sanitizeThemeIds(themeIds: unknown) {
  if (!Array.isArray(themeIds)) {
    return [];
  }

  return themeIds.filter((themeId): themeId is string => typeof themeId === 'string' && THEMES.some((theme) => theme.id === themeId));
}

function readStoredThemeIds(key: string) {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsedValue = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.from(new Set(sanitizeThemeIds(parsedValue)));
  } catch {
    return [];
  }
}

function writeStoredThemeIds(key: string, themeIds: string[]) {
  if (typeof window === 'undefined') {
    return themeIds;
  }

  const nextThemeIds = Array.from(new Set(sanitizeThemeIds(themeIds)));
  window.localStorage.setItem(key, JSON.stringify(nextThemeIds));

  return nextThemeIds;
}

export function getStoredThemeId() {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_ID;
  }

  return getThemeById(window.localStorage.getItem(STORAGE_KEYS.theme)).id;
}

export function getStoredInterfaceFontId() {
  if (typeof window === 'undefined') {
    return DEFAULT_INTERFACE_FONT_ID;
  }

  const storedFontId = window.localStorage.getItem(STORAGE_KEYS.interfaceFont) || window.localStorage.getItem(STORAGE_KEYS.font);
  return getFontById(UI_FONT_OPTIONS, storedFontId, DEFAULT_INTERFACE_FONT_ID).id;
}

export function getStoredTypingFontId() {
  if (typeof window === 'undefined') {
    return DEFAULT_TYPING_FONT_ID;
  }

  return getFontById(TYPING_FONT_OPTIONS, window.localStorage.getItem(STORAGE_KEYS.typingFont), DEFAULT_TYPING_FONT_ID).id;
}

export function getStoredFavoriteThemeIds() {
  return readStoredThemeIds(STORAGE_KEYS.themeFavorites);
}

export function getStoredRecentThemeIds() {
  return readStoredThemeIds(STORAGE_KEYS.themeRecents);
}

export function toggleFavoriteTheme(themeId: string) {
  const favorites = getStoredFavoriteThemeIds();
  const nextFavorites = favorites.includes(themeId)
    ? favorites.filter((favoriteId) => favoriteId !== themeId)
    : [themeId, ...favorites];

  return writeStoredThemeIds(STORAGE_KEYS.themeFavorites, nextFavorites);
}

export function rememberRecentTheme(themeId: string) {
  const recentThemeIds = getStoredRecentThemeIds();
  const nextThemeIds = [themeId, ...recentThemeIds.filter((recentThemeId) => recentThemeId !== themeId)].slice(0, MAX_RECENT_THEMES);

  return writeStoredThemeIds(STORAGE_KEYS.themeRecents, nextThemeIds);
}

export function getStoredFontId() {
  return getStoredInterfaceFontId();
}

export function applyTheme(themeId: string) {
  if (typeof document === 'undefined') {
    return getThemeById(themeId);
  }

  const theme = getThemeById(themeId);
  const root = document.documentElement;

  root.style.setProperty('--bg-color', theme.bg);
  root.style.setProperty('--main-color', theme.main);
  root.style.setProperty('--sub-color', theme.sub);
  root.style.setProperty('--accent-color', theme.accent);
  root.style.setProperty('--error-color', theme.error);
  root.style.setProperty('--error-extra-color', theme.errorExtra);
  root.setAttribute('data-theme', theme.id);
  root.classList.toggle('dark', theme.mode === 'dark');
  root.classList.toggle('light', theme.mode === 'light');

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  themeMeta?.setAttribute('content', theme.bg);

  window.localStorage.setItem(STORAGE_KEYS.theme, theme.id);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { themeId: theme.id } }));

  return theme;
}

export function applyInterfaceFont(fontId: string) {
  if (typeof document === 'undefined') {
    return getFontById(UI_FONT_OPTIONS, fontId, DEFAULT_INTERFACE_FONT_ID);
  }

  const font = getFontById(UI_FONT_OPTIONS, fontId, DEFAULT_INTERFACE_FONT_ID);
  document.documentElement.style.setProperty('--font-sans', font.cssValue);
  window.localStorage.setItem(STORAGE_KEYS.interfaceFont, font.id);
  window.localStorage.setItem(STORAGE_KEYS.font, font.id);

  return font;
}

export function applyTypingFont(fontId: string) {
  if (typeof document === 'undefined') {
    return getFontById(TYPING_FONT_OPTIONS, fontId, DEFAULT_TYPING_FONT_ID);
  }

  const font = getFontById(TYPING_FONT_OPTIONS, fontId, DEFAULT_TYPING_FONT_ID);
  document.documentElement.style.setProperty('--font-typing', font.cssValue);
  window.localStorage.setItem(STORAGE_KEYS.typingFont, font.id);

  return font;
}

export function applyFont(fontId: string) {
  return applyInterfaceFont(fontId);
}

export function applySavedAppearance() {
  applyTheme(getStoredThemeId());
  applyInterfaceFont(getStoredInterfaceFontId());
  applyTypingFont(getStoredTypingFontId());
}
