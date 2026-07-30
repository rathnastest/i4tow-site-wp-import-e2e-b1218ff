import { useEffect, useState } from 'react';

export interface NavLink {
  label: string;
  href: string;
}

interface Palette {
  canvas: string;
  surface: string;
  ink: string;
  inkSoft: string;
  clay: string;
  clayDeep: string;
  line: string;
}

type AppearanceChoice = 'light' | 'dark' | 'system';

// Links + brand are passed from BaseLayout, derived from the actual published
// pages - so the nav reflects what exists (no hardcoded/404 links).
export function Nav({
  brand,
  links,
  homeHref,
  logoUrl,
  pageWidth,
  appearanceModeEnabled,
  light,
  dark,
}: {
  brand: string;
  links: NavLink[];
  homeHref: string;
  logoUrl: string;
  pageWidth: 'contained' | 'full';
  appearanceModeEnabled: boolean;
  light: Palette;
  dark: Palette;
}) {
  const [open, setOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [choice, setChoice] = useState<AppearanceChoice>('system');
  const storageKey = 'i4tow.site.appearance';

  function applyAppearance(next: AppearanceChoice) {
    if (!appearanceModeEnabled) return;
    const mode = next === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : next;
    const palette = mode === 'dark' ? dark : light;
    const root = document.documentElement;
    root.style.setProperty('--color-canvas', palette.canvas);
    root.style.setProperty('--color-surface', palette.surface);
    root.style.setProperty('--color-ink', palette.ink);
    root.style.setProperty('--color-ink-soft', palette.inkSoft);
    root.style.setProperty('--color-clay', palette.clay);
    root.style.setProperty('--color-clay-deep', palette.clayDeep);
    root.style.setProperty('--color-line', palette.line);
    root.dataset.appearance = mode;
    root.dataset.appearanceChoice = next;
    root.style.colorScheme = mode;
  }

  function chooseAppearance(next: AppearanceChoice) {
    setChoice(next);
    window.localStorage.setItem(storageKey, next);
    applyAppearance(next);
    setAppearanceOpen(false);
  }

  useEffect(() => {
    if (!appearanceModeEnabled) return;
    const saved = window.localStorage.getItem(storageKey);
    const initial: AppearanceChoice = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    setChoice(initial);
    applyAppearance(initial);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if ((window.localStorage.getItem(storageKey) ?? 'system') === 'system') applyAppearance('system');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [appearanceModeEnabled, light, dark]);

  return (
    <nav className="sticky top-0 z-40 border-b border-line/60 bg-canvas/80 backdrop-blur">
      <div className={`mx-auto flex items-center justify-between px-6 py-4 ${pageWidth === 'full' ? 'w-full max-w-none' : 'max-w-6xl'}`}>
        <a href={homeHref} className="flex items-center gap-3 font-display text-lg text-clay">
          <img src={logoUrl} alt="" className="h-9 w-9 rounded-md object-contain" />
          <span>{brand}</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-5 md:flex">
          {links.length > 0 && (
            <ul className="flex gap-6 text-sm text-ink-soft">
              {links.map((n) => (
                <li key={n.href}><a href={n.href} className="transition-colors hover:text-clay">{n.label}</a></li>
              ))}
            </ul>
          )}
          {appearanceModeEnabled && (
            <div className="relative">
              <button type="button" onClick={() => setAppearanceOpen((v) => !v)} className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-clay" aria-haspopup="menu" aria-expanded={appearanceOpen}>
                {choice === 'system' ? 'System' : choice === 'dark' ? 'Dark' : 'Light'}
              </button>
              {appearanceOpen && (
                <div role="menu" className="absolute right-0 top-[calc(100%+0.4rem)] min-w-32 rounded-xl border border-line bg-surface p-1 text-sm text-ink shadow-soft">
                  {(['light', 'dark', 'system'] as AppearanceChoice[]).map((option) => (
                    <button key={option} type="button" role="menuitem" onClick={() => chooseAppearance(option)} className={`block w-full rounded-lg px-3 py-2 text-left capitalize hover:bg-canvas ${choice === option ? 'text-clay' : ''}`}>{option}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        {(links.length > 0 || appearanceModeEnabled) && (
          <button
            className="grid h-10 w-10 place-items-center text-ink md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open
                ? (<><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>)
                : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)}
            </svg>
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {open && (links.length > 0 || appearanceModeEnabled) && (
        <ul className="border-t border-line/60 px-6 py-3 text-sm text-ink-soft md:hidden">
          {links.map((n) => (
            <li key={n.href} className="py-2">
              <a href={n.href} className="block transition-colors hover:text-clay" onClick={() => setOpen(false)}>{n.label}</a>
            </li>
          ))}
          {appearanceModeEnabled && (
            <li className="mt-2 border-t border-line/60 pt-3">
              <span className="mb-2 block text-xs uppercase tracking-wide text-ink-soft">Appearance</span>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as AppearanceChoice[]).map((option) => (
                  <button key={option} type="button" onClick={() => chooseAppearance(option)} className={`rounded-full border border-line px-3 py-1.5 text-xs capitalize ${choice === option ? 'bg-clay text-canvas' : 'text-ink-soft'}`}>{option}</button>
                ))}
              </div>
            </li>
          )}
        </ul>
      )}
    </nav>
  );
}
