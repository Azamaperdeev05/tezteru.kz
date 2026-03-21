import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, ChevronLeft, ChevronRight, Keyboard, Palette, Sparkles, Volume2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TestConfig } from '../hooks/useTypingTest';
import { THEMES, applyTheme, rememberRecentTheme, type ThemeOption } from '../lib/appearance';
import { SOUND_THEMES, setStoredSoundTheme, soundEngine, type SoundThemeId } from '../lib/sounds';
import { cn } from '../lib/utils';

type OnboardingModalProps = {
  initialConfig: TestConfig;
  initialSoundEnabled: boolean;
  initialSoundTheme: SoundThemeId;
  initialThemeId: string;
  open: boolean;
  onComplete: (payload: {
    config: TestConfig;
    soundEnabled: boolean;
    soundTheme: SoundThemeId;
    themeId: string;
  }) => void;
};

const FEATURE_ITEMS = [
  'Жеке нәтиже сілтемесімен бөлісу',
  'Жарыс режимінде достармен теру',
  'Қате картасы мен тұрақтылық статистикасы',
  'Theme, шрифт және дыбыс толық бапталады',
];

const ONBOARDING_THEMES = ['dark', 'rose-pine', 'nord', 'desert-oasis', 'lilac-mist', 'taro'];
const ONBOARDING_SOUND_THEMES: SoundThemeId[] = ['mechanical', 'soft', 'typewriter', 'game'];

function getCuratedThemes() {
  const selectedThemes = ONBOARDING_THEMES
    .map((themeId) => THEMES.find((theme) => theme.id === themeId))
    .filter((theme): theme is ThemeOption => Boolean(theme));

  return selectedThemes.length > 0 ? selectedThemes : THEMES.slice(0, 6);
}

export function OnboardingModal({
  initialConfig,
  initialSoundEnabled,
  initialSoundTheme,
  initialThemeId,
  open,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [selectedConfig, setSelectedConfig] = useState<TestConfig>(initialConfig);
  const [selectedThemeId, setSelectedThemeId] = useState(initialThemeId);
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);
  const [soundTheme, setSoundTheme] = useState<SoundThemeId>(initialSoundTheme);
  const curatedThemes = useMemo(() => getCuratedThemes(), []);

  if (!open) {
    return null;
  }

  const selectedTheme = THEMES.find((theme) => theme.id === selectedThemeId) ?? curatedThemes[0];

  const completeOnboarding = () => {
    setStoredSoundTheme(soundTheme);
    onComplete({
      config: selectedConfig,
      soundEnabled,
      soundTheme,
      themeId: selectedThemeId,
    });
  };

  const steps = [
    {
      id: 'intro',
      title: 'Tezteru-ге қош келдіңіз',
      description: 'Алғашқы рет кіргенде негізгі мүмкіндіктерді бірден жинап алған дұрыс.',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURE_ITEMS.map((feature) => (
            <div key={feature} className="rounded-2xl border border-[var(--sub-color)]/15 bg-[var(--main-color)]/4 px-4 py-4 text-sm text-[var(--main-color)]">
              {feature}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'theme',
      title: 'Алғашқы theme таңдаңыз',
      description: 'Қай тақырыпта ұзақ отыратыныңыз UX-ке тікелей әсер етеді. Біреуі ұнамаса, кейін settings-тен толық ауыстырасыз.',
      content: (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {curatedThemes.map((theme) => {
            const isSelected = theme.id === selectedThemeId;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedThemeId(theme.id);
                  rememberRecentTheme(theme.id);
                  applyTheme(theme.id);
                }}
                className="rounded-2xl border p-3 text-left transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: theme.bg,
                  color: theme.main,
                  borderColor: isSelected ? theme.accent : theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
                  boxShadow: isSelected ? `0 0 0 2px ${theme.accent}33` : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold lowercase">{theme.name}</div>
                  {isSelected && <Check size={15} color={theme.accent} />}
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="block size-3 rounded-full" style={{ backgroundColor: theme.main }} />
                  <span className="block size-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                  <span className="block size-3 rounded-full" style={{ backgroundColor: theme.sub }} />
                </div>
                <div className="mt-4 rounded-xl border border-black/5 bg-white/20 px-3 py-2 text-sm leading-relaxed">
                  мәтін теру тез әрі анық көрінсін
                </div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      id: 'mode',
      title: 'Негізгі режимді таңдаңыз',
      description: 'Көпшілікке `30 секунд` жақсы бастама. Егер нақты дәлдікке жұмыс істесеңіз, `25 сөз` ыңғайлы.',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { id: 'time-30', label: '30 сек', description: 'Классикалық warm-up.', config: { ...selectedConfig, mode: 'time' as const, amount: 30 } },
            { id: 'time-60', label: '60 сек', description: 'Ұзақтау тұрақтылықты тексереді.', config: { ...selectedConfig, mode: 'time' as const, amount: 60 } },
            { id: 'words-25', label: '25 сөз', description: 'Қысқа әрі нақты өлшем.', config: { ...selectedConfig, mode: 'words' as const, amount: 25 } },
            { id: 'words-50', label: '50 сөз', description: 'Орта деңгейлі тәжірибе.', config: { ...selectedConfig, mode: 'words' as const, amount: 50 } },
          ].map((preset) => {
            const isSelected = selectedConfig.mode === preset.config.mode && selectedConfig.amount === preset.config.amount;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedConfig((current) => ({
                  ...current,
                  mode: preset.config.mode,
                  amount: preset.config.amount,
                }))}
                className={cn(
                  'rounded-2xl border px-4 py-4 text-left transition-colors',
                  isSelected
                    ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                    : 'border-[var(--sub-color)]/15 bg-[var(--main-color)]/4 hover:border-[var(--sub-color)]/30'
                )}
              >
                <div className="text-base font-semibold text-[var(--main-color)]">{preset.label}</div>
                <div className="mt-1 text-sm text-[var(--sub-color)]">{preset.description}</div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      id: 'sound',
      title: 'Дыбыс пен финал',
      description: 'Дыбысты қазір-ақ реттеп алыңыз. Ұнамағанын кейін settings ішінен тереңдетіп баптайсыз.',
      content: (
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--sub-color)]/15 bg-[var(--main-color)]/4 px-4 py-4">
            <div>
              <div className="text-sm font-semibold text-[var(--main-color)]">Перне дыбысы</div>
              <div className="mt-1 text-sm text-[var(--sub-color)]">Typing кезінде keypress пен error дыбыстары естіледі.</div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              className={cn(
                'inline-flex h-10 min-w-20 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors',
                soundEnabled
                  ? 'bg-[var(--accent-color)] text-[var(--bg-color)]'
                  : 'bg-[var(--main-color)]/8 text-[var(--sub-color)]'
              )}
            >
              {soundEnabled ? 'Қосулы' : 'Өшірулі'}
            </button>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {ONBOARDING_SOUND_THEMES.map((themeId) => {
              const theme = SOUND_THEMES.find((item) => item.id === themeId);
              if (!theme) {
                return null;
              }

              const isSelected = soundTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setSoundTheme(theme.id);
                    setStoredSoundTheme(theme.id);
                    if (soundEnabled) {
                      soundEngine.previewTheme(theme.id);
                    }
                  }}
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-left transition-colors',
                    isSelected
                      ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                      : 'border-[var(--sub-color)]/15 bg-[var(--main-color)]/4 hover:border-[var(--sub-color)]/30'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--main-color)]">{theme.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--sub-color)]">{theme.badge}</div>
                    </div>
                    {isSelected && <Check size={15} className="text-[var(--accent-color)]" />}
                  </div>
                  <div className="mt-2 text-sm text-[var(--sub-color)]">{theme.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 px-4 py-4 backdrop-blur-[4px] sm:items-center sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-4xl overflow-hidden rounded-[32px] border border-[var(--sub-color)]/15 bg-[var(--bg-color)] shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--sub-color)]/10 px-5 pb-5 pt-5 sm:px-7">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--main-color)]/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--sub-color)]">
                <Sparkles size={12} className="text-[var(--accent-color)]" />
                Алғашқы баптау
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--accent-color)]/20 bg-[var(--main-color)]/4">
                  <Keyboard size={22} className="text-[var(--accent-color)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--main-color)]">{currentStep.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--sub-color)]">{currentStep.description}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={completeOnboarding}
              className="rounded-full p-2 text-[var(--sub-color)] transition-colors hover:bg-[var(--main-color)]/6 hover:text-[var(--main-color)]"
              title="Өткізу"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[var(--sub-color)]">
              {steps.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-full px-3 py-1.5 transition-colors',
                    step === index
                      ? 'bg-[var(--accent-color)] text-[var(--bg-color)]'
                      : 'bg-[var(--main-color)]/5 text-[var(--sub-color)]'
                  )}
                >
                  {index + 1}. {item.title}
                </div>
              ))}
            </div>

            <div className="min-h-[280px]">
              {currentStep.content}
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-[var(--sub-color)]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm text-[var(--sub-color)]">
                <Palette size={16} className="text-[var(--accent-color)]" />
                <span className="lowercase">{selectedTheme?.name}</span>
                <span className="text-[var(--sub-color)]/35">•</span>
                <Volume2 size={16} className="text-[var(--accent-color)]" />
                <span>{soundEnabled ? 'Дыбыс қосулы' : 'Дыбыс өшірулі'}</span>
                <span className="text-[var(--sub-color)]/35">•</span>
                <Bell size={16} className="text-[var(--accent-color)]" />
                <span>{selectedConfig.mode === 'time' ? `${selectedConfig.amount} сек` : `${selectedConfig.amount} сөз`}</span>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--sub-color)]/15 px-4 py-2 text-sm font-medium text-[var(--main-color)] transition-colors hover:bg-[var(--main-color)]/6 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Артқа
                </button>
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition-opacity hover:opacity-90"
                  >
                    Келесі
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={completeOnboarding}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition-opacity hover:opacity-90"
                  >
                    Бастау
                    <Check size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
