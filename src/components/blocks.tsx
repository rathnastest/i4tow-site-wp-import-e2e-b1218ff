import type {
  Block,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeatureGridBlock,
  GalleryBlock,
  HeroBlock,
  MediaStoryBlock,
  NeedsReviewBlock,
  ParagraphAlign,
  PricingBlock,
  RichTextBlock,
  ScrollytellingBlock,
  SiteFontId,
  SiteThemeId,
  SiteWidth,
  TableBlock,
  TestimonialsBlock,
  VideoBlock,
} from '@/lib/blocks';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Reveal } from './motion';

marked.setOptions({ gfm: true, breaks: true });
// Authored by the site owner, but rendered on a public page - sanitize to a safe
// subset so a compromised/mistaken author can't inject script into visitors' pages.
const BODY_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'hr', 'img'];
const INLINE_TAGS = ['strong', 'em', 'b', 'i', 'u', 's', 'a', 'br', 'code'];
const ALLOWED_ATTR = ['href', 'title', 'src', 'alt'];

/** Source markdown for a text block: the flat field, falling back to the legacy paragraphs[]. */
function bodyMarkdown(flat?: string, paragraphs?: string[]): string {
  const f = (flat ?? '').trim();
  if (f) return f;
  return (paragraphs ?? []).map((p) => p.trim()).filter(Boolean).join('\n\n');
}

function renderBodyHtml(md: string): string {
  return DOMPurify.sanitize(marked.parse(md, { async: false }) as string, { ALLOWED_TAGS: BODY_TAGS, ALLOWED_ATTR });
}

/** Inline-only markdown (bold/italic/underline/links) for headings - no block elements. */
function inlineHtml(text: string): string {
  return DOMPurify.sanitize(marked.parseInline(text ?? '', { async: false }) as string, { ALLOWED_TAGS: INLINE_TAGS, ALLOWED_ATTR });
}

/** Renders a block's markdown body as sanitized, prose-styled HTML with a per-block alignment. */
function RichBody({ markdown, align, className = '' }: { markdown: string; align?: ParagraphAlign; className?: string }) {
  return <div className={`rich-body ${alignClass(align)} ${className}`} dangerouslySetInnerHTML={{ __html: renderBodyHtml(markdown) }} />;
}

const ALIGN_CLASS: Record<ParagraphAlign, string> = {
  left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify',
};

const SITE_FONT_IDS = new Set<SiteFontId>([
  'dmSans', 'roboto', 'openSans', 'lato', 'montserrat',
  'poppins', 'inter', 'oswald', 'raleway', 'notoSans',
  'sourceSans3', 'ubuntu', 'nunitoSans', 'merriweather',
  'playfairDisplay', 'robotoSlab', 'rubik', 'ptSans',
  'workSans', 'mulish', 'robotoCondensed', 'notoSerif',
  'libreBaskerville', 'cormorantGaramond', 'quicksand',
]);

function alignClass(align?: string): string {
  return ALIGN_CLASS[(align ?? '') as ParagraphAlign] ?? '';
}

function siteHref(href: string): string {
  if (/^(https?:|mailto:|tel:|sms:|#)/i.test(href) || href.startsWith('//')) return href;
  // Default-deny unknown schemes (javascript:, data:, vbscript:, …) to prevent
  // a scripted link from authored/imported content reaching the public page.
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return '#';
  if (!href.startsWith('/')) return href;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${base}${href.replace(/^\/+/, '')}`;
}

function siteAsset(src: string): string {
  if (/^(https?:|data:|blob:)/i.test(src) || src.startsWith('//')) return src;
  if (!src.startsWith('/')) return src;
  return siteHref(src);
}

// ── Button ─────────────────────────────────────────────────────────────────
// warmArtStudio: pill (rounded-full) - organic, friendly
// minimalGallery + boldEditorial: sharp rectangle - architectural, editorial
function Button({ href, children, variant = 'primary', themeId = 'warmArtStudio' }: {
  href: string; children: ReactNode; variant?: 'primary' | 'ghost'; themeId?: SiteThemeId;
}) {
  const radius = themeId === 'warmArtStudio' ? 'rounded-full' : 'rounded-none';
  const base = `inline-flex items-center gap-2 ${radius} px-6 py-3 text-sm font-medium transition-transform duration-200 will-change-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay`;
  const styles = variant === 'primary'
    ? 'bg-clay text-canvas hover:bg-clay-deep shadow-soft'
    : 'border border-line text-ink hover:border-clay hover:text-clay';
  return <a href={siteHref(href)} className={`${base} ${styles}`}>{children}</a>;
}

function Section({ children, className = '', width = 'contained' }: { children: ReactNode; className?: string; width?: SiteWidth }) {
  const widthClass = width === 'full' ? 'max-w-[1600px]' : 'max-w-6xl';
  return <section className={`mx-auto w-full ${widthClass} px-6 py-20 md:py-28 ${className}`}>{children}</section>;
}

function buttonsFrom(...groups: Array<{ label: string; href: string }[] | { label: string; href: string } | undefined>): { label: string; href: string }[] {
  return groups.flatMap((group) => Array.isArray(group) ? group : group ? [group] : []).filter((button) => button.label && button.href).slice(0, 3);
}

// ── Hero ───────────────────────────────────────────────────────────────────
// warmArtStudio: centered layout, gradient top→bottom, soft spring
// minimalGallery: left-aligned, wide eyebrow tracking, architectural
// boldEditorial: 72dvh min-height, left-aligned, text sits at bottom on image
function Hero({ b, width, themeId }: { b: HeroBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const body = bodyMarkdown(b.subheading, b.paragraphs);
  const buttons = buttonsFrom(b.buttons, b.cta);
  const isCenter = themeId === 'warmArtStudio';
  const isEditorial = themeId === 'boldEditorial';

  const eyebrowTracking = themeId === 'minimalGallery' ? 'tracking-[0.3em]' : 'tracking-[0.2em]';
  const gradientClass = isEditorial
    ? 'bg-gradient-to-t from-canvas via-canvas/80 to-canvas/10'
    : 'bg-gradient-to-b from-canvas/70 via-canvas/60 to-canvas';
  const headingMaxW = isCenter ? 'max-w-4xl mx-auto' : isEditorial ? 'max-w-5xl' : 'max-w-3xl';
  // Manual heading-size override (e.g. to fit a long title); default is the largest.
  const headingSizeClass = { sm: 'display-sm', md: 'display-md', lg: 'display-lg', xl: 'display-xl' }[b.headingSize ?? 'xl'];

  return (
    <header className={`relative overflow-hidden${isEditorial ? ' flex min-h-[72dvh] flex-col justify-end' : ''}`}>
      {b.image && (
        <div className="absolute inset-0 -z-10">
          <img src={siteAsset(b.image)} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          <div className={`absolute inset-0 ${gradientClass}`} />
        </div>
      )}
      <Section width={width} className={`${isEditorial ? 'pb-16 pt-24 md:pb-24' : 'md:py-36'} ${isCenter ? 'text-center' : 'text-left'}`}>
        {b.eyebrow && (
          <Reveal as="p">
            <span className={`text-sm font-medium uppercase text-clay ${eyebrowTracking}`}>{b.eyebrow}</span>
          </Reveal>
        )}
        <Reveal as="h1">
          <span className={`${headingSizeClass} mt-4 block text-ink ${headingMaxW}`} dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
        </Reveal>
        {body && (
          <Reveal delay={80}>
            <RichBody markdown={body} align={isCenter ? b.align : 'left'} className={`mt-6 max-w-2xl text-lg text-ink-soft ${isCenter ? 'mx-auto' : ''}`} />
          </Reveal>
        )}
        {buttons.length > 0 && (
          <Reveal delay={160}>
            <div className={`mt-9 flex flex-wrap gap-3 ${isCenter ? 'justify-center' : ''}`}>
              {buttons.map((button) => (
                <Button key={`${button.href}:${button.label}`} href={button.href} themeId={themeId}>{button.label}</Button>
              ))}
            </div>
          </Reveal>
        )}
      </Section>
    </header>
  );
}

function RichText({ b, width, themeId }: { b: RichTextBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const body = bodyMarkdown(b.markdown, b.paragraphs);
  const isCenter = themeId !== 'minimalGallery';
  return (
    <Section width={width} className={isCenter ? 'text-center' : 'text-left'}>
      {b.heading && (
        <Reveal as="h2">
          <span className="display-lg mx-auto mb-8 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
        </Reveal>
      )}
      {body && (
        <Reveal>
          <RichBody markdown={body} align={b.align} className={`${isCenter ? 'mx-auto' : ''} max-w-3xl text-lg leading-relaxed text-ink-soft`} />
        </Reveal>
      )}
    </Section>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────
// warmArtStudio: 3-col 4:5 aspect, staggered reveal, 5% scale hover
// minimalGallery: 3-col 1:1 aspect, no stagger (clean simultaneity), opacity hover
// boldEditorial: 2-col 3:4 portrait (dramatic), staggered, stronger scale hover
function Gallery({ b, width, themeId }: { b: GalleryBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const items = b.items ?? [];

  const gridClass = themeId === 'boldEditorial'
    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6'
    : 'grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5';

  const aspectClass = themeId === 'boldEditorial' ? 'aspect-[3/4]'
    : themeId === 'minimalGallery' ? 'aspect-square'
      : 'aspect-[4/5]';

  const imgHoverClass = themeId === 'minimalGallery'
    ? 'transition-opacity duration-350 group-hover:opacity-80'
    : themeId === 'boldEditorial'
      ? 'transition-transform duration-400 group-hover:scale-[1.09]'
      : 'transition-transform duration-500 group-hover:scale-105';

  // minimalGallery: reveal all at once (no stagger) - deliberate simultaneous discipline
  const delayFor = (i: number) => themeId === 'minimalGallery' ? 0 : (i % 3) * 60;

  const story = bodyMarkdown(b.story, b.paragraphs);

  return (
    <Section width={width}>
      {b.heading && (
        <Reveal as="h2">
          <span className={`display-lg block text-ink ${story ? 'mb-4' : 'mb-10'}`} dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
        </Reveal>
      )}
      {story && (
        <Reveal>
          <RichBody markdown={story} align={b.align} className="mb-10 max-w-2xl text-lg leading-relaxed text-ink-soft" />
        </Reveal>
      )}
      <div className={gridClass}>
        {items.map((it, i) => (
          <Reveal key={i} delay={delayFor(i)}>
            <figure className="group overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-soft">
              <img
                src={siteAsset(it.src)}
                alt={it.alt ?? ''}
                width={it.width}
                height={it.height}
                loading="lazy"
                decoding="async"
                className={`${aspectClass} w-full object-cover ${imgHoverClass}`}
              />
            </figure>
          </Reveal>
        ))}
        {items.length === 0 && <p className="col-span-full text-ink-soft">Add images to this gallery in your i4tow studio.</p>}
      </div>
    </Section>
  );
}

// ── FeatureGrid ────────────────────────────────────────────────────────────
// warmArtStudio: rounded cards with surface background
// minimalGallery: ruled top-line only - no box, no background, pure editorial spacing
// boldEditorial: strong full border, no background - stark magazine frame
function FeatureGrid({ b, width, themeId }: { b: FeatureGridBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const cardClass = themeId === 'minimalGallery'
    ? 'h-full border-t-2 border-ink/20 pb-4 pt-6'
    : themeId === 'boldEditorial'
      ? 'h-full border-2 border-ink/35 p-7'
      : 'h-full rounded-[var(--radius-card)] border border-line bg-surface/60 p-7';

  return (
    <Section width={width}>
      {b.heading && (
        <Reveal as="h2">
          <span className="display-lg mb-10 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
        </Reveal>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {b.features.map((f, i) => (
          <Reveal key={i} delay={(i % 3) * 60}>
            <article className={cardClass}>
              <h3 className="font-display text-xl text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(f.title) }} />
              <p className="mt-3 text-ink-soft" dangerouslySetInnerHTML={{ __html: inlineHtml(f.body) }} />
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Cta({ b, width, themeId }: { b: CtaBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const body = bodyMarkdown(b.body, b.paragraphs);
  const buttons = buttonsFrom(b.buttons, b.primary, b.secondary);
  return (
    <Section width={width}>
      <Reveal>
        <div className="rounded-[var(--radius-card)] bg-clay px-8 py-14 text-center text-canvas md:py-20">
          <h2 className="display-lg mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
          {body && <RichBody markdown={body} align={b.align} className="mx-auto mt-4 max-w-xl text-canvas/85" />}
          {buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {buttons.map((button, i) => (
                <a
                  key={`${button.href}:${button.label}`}
                  href={siteHref(button.href)}
                  className={
                    i === 0
                      ? `${themeId === 'warmArtStudio' ? 'rounded-full' : 'rounded-none'} bg-canvas px-6 py-3 text-sm font-medium text-clay-deep transition-transform hover:-translate-y-0.5`
                      : `${themeId === 'warmArtStudio' ? 'rounded-full' : 'rounded-none'} border border-canvas/40 px-6 py-3 text-sm font-medium text-canvas transition-transform hover:-translate-y-0.5`
                  }
                >
                  {button.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </Section>
  );
}

// ── Table ──────────────────────────────────────────────────────────────────
// Generic tabular content (menus, pricing, schedules). Accessible (<th scope>,
// caption) and mobile-safe (horizontal scroll wrapper).
function Table({ b, width }: { b: TableBlock; width: SiteWidth }) {
  return (
    <Section width={width}>
      {b.heading && <Reveal as="h2"><span className="display-lg mb-8 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} /></Reveal>}
      <Reveal>
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
          <table className="w-full border-collapse text-left text-ink">
            {b.caption && <caption className="px-4 py-3 text-left text-sm text-ink-soft">{b.caption}</caption>}
            {b.headers && b.headers.length > 0 && (
              <thead>
                <tr className="border-b border-line bg-surface/60">
                  {b.headers.map((h, i) => (<th key={i} scope="col" className="px-4 py-3 font-display text-sm" dangerouslySetInnerHTML={{ __html: inlineHtml(h) }} />))}
                </tr>
              </thead>
            )}
            <tbody>
              {b.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-line/60 last:border-0">
                  {row.map((cell, ci) => (<td key={ci} className="px-4 py-3 align-top text-ink-soft" dangerouslySetInnerHTML={{ __html: inlineHtml(cell) }} />))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </Section>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────────
function Testimonials({ b, width, themeId }: { b: TestimonialsBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const cardClass = themeId === 'boldEditorial' ? 'h-full border-2 border-ink/35 p-7' : 'h-full rounded-[var(--radius-card)] border border-line bg-surface/60 p-7';
  return (
    <Section width={width}>
      {b.heading && <Reveal as="h2"><span className="display-lg mb-10 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} /></Reveal>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {b.items.map((t, i) => (
          <Reveal key={i} delay={(i % 3) * 60}>
            <figure className={cardClass}>
              <RichBody markdown={t.quote} align={t.align} className="text-ink-soft" />
              <figcaption className="mt-4 flex items-center gap-3">
                {t.avatar && <img src={siteAsset(t.avatar)} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" />}
                <span>
                  <span className="block font-display text-sm text-ink">{t.author}</span>
                  {(t.role || t.date) && <span className="block text-xs text-ink-soft">{[t.role, t.date].filter(Boolean).join(' · ')}</span>}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────
// Native <details>/<summary> accordion - works without JS.
function Faq({ b, width }: { b: FaqBlock; width: SiteWidth }) {
  return (
    <Section width={width}>
      {b.heading && <Reveal as="h2"><span className="display-lg mb-8 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} /></Reveal>}
      <div className="mx-auto max-w-3xl divide-y divide-line border-y border-line">
        {b.items.map((item, i) => (
          <Reveal key={i}>
            <details className="group py-4">
              <summary className="cursor-pointer list-none font-display text-lg text-ink marker:content-['']" dangerouslySetInnerHTML={{ __html: inlineHtml(item.question) }} />
              <RichBody markdown={item.answer} align={item.align} className="mt-3 text-ink-soft" />
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ── Contact ────────────────────────────────────────────────────────────────
// Sanitized mailto/tel/map LINKS (no iframe embed → no XSS). Per-day hours,
// holidays observed, and one or more locations.
const DAYS: { key: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'; label: string }[] = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' }, { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' }, { key: 'sun', label: 'Sun' },
];
function Contact({ b, width }: { b: ContactBlock; width: SiteWidth }) {
  const hourRows = DAYS.filter((d) => b.hours?.[d.key]);
  const locations = (b.locations ?? []).filter((l) => l.label || l.address || l.mapUrl);
  return (
    <Section width={width}>
      {b.heading && <Reveal as="h2"><span className="display-lg mb-8 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} /></Reveal>}
      <Reveal>
        <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-2">
          <div className="space-y-3 text-ink-soft">
            {b.phone && <p><span className="font-display text-ink">Phone </span><a className="underline hover:no-underline" href={siteHref(`tel:${b.phone.replace(/[^+\d]/g, '')}`)}>{b.phone}</a></p>}
            {b.email && <p><span className="font-display text-ink">Email </span><a className="underline hover:no-underline" href={siteHref(`mailto:${b.email}`)}>{b.email}</a></p>}
            {locations.map((loc, i) => (
              <div key={i} className="pt-2">
                {loc.label && <p className="font-display text-ink">{loc.label}</p>}
                {loc.address && <p dangerouslySetInnerHTML={{ __html: inlineHtml(loc.address) }} />}
                {loc.mapUrl && <a className="text-sm underline hover:no-underline" href={siteHref(loc.mapUrl)} target="_blank" rel="noreferrer">View on map</a>}
              </div>
            ))}
          </div>
          {(hourRows.length > 0 || (b.holidays && b.holidays.length > 0)) && (
            <div>
              {hourRows.length > 0 && (
                <>
                  <h3 className="font-display text-ink">Hours</h3>
                  <dl className="mt-2 space-y-1 text-ink-soft">
                    {hourRows.map((d) => (<div key={d.key} className="flex justify-between gap-4"><dt>{d.label}</dt><dd>{b.hours![d.key]}</dd></div>))}
                  </dl>
                </>
              )}
              {b.holidays && b.holidays.length > 0 && (
                <>
                  <h3 className="mt-5 font-display text-ink">Holidays observed</h3>
                  <ul className="mt-2 list-disc pl-5 text-ink-soft">{b.holidays.map((h, i) => (<li key={i}>{h}</li>))}</ul>
                </>
              )}
            </div>
          )}
        </div>
      </Reveal>
    </Section>
  );
}

// ── Video ──────────────────────────────────────────────────────────────────
// SAFE EMBED: the iframe src is built from a known host + a validated id, never
// a raw URL from untrusted content. A malformed id renders nothing.
function Video({ b, width }: { b: VideoBlock; width: SiteWidth }) {
  if (!/^[\w-]{1,64}$/.test(b.videoId)) return null; // reject anything but an opaque id
  const src = b.provider === 'vimeo'
    ? `https://player.vimeo.com/video/${b.videoId}`
    : `https://www.youtube-nocookie.com/embed/${b.videoId}`;
  return (
    <Section width={width}>
      <Reveal>
        <div className="relative mx-auto aspect-video max-w-3xl overflow-hidden rounded-[var(--radius-card)] border border-line">
          <iframe
            src={src} title={b.title ?? 'Embedded video'} loading="lazy"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
          />
        </div>
      </Reveal>
    </Section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────
// ── NeedsReview (unconverted import placeholder) ─────────────────────────────
// Live render is a quiet text fallback so published content is never lost; the
// "review/convert" affordance lives in the editor, not on the live site.
function NeedsReview({ b, width }: { b: NeedsReviewBlock; width: SiteWidth }) {
  if (!b.text?.trim()) return null;
  return (
    <Section width={width}>
      <RichBody markdown={b.text} className="text-ink-soft" />
    </Section>
  );
}

function Pricing({ b, width, themeId }: { b: PricingBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const cardClass = themeId === 'boldEditorial' ? 'border-2 border-ink/35 p-7' : 'rounded-[var(--radius-card)] border border-line bg-surface/60 p-7';
  return (
    <Section width={width}>
      {b.heading && <Reveal as="h2"><span className="display-lg mb-10 block text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} /></Reveal>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {b.plans.map((p, i) => (
          <Reveal key={i} delay={(i % 3) * 60}>
            <article className={`flex h-full flex-col ${cardClass}`}>
              <h3 className="font-display text-xl text-ink">{p.name}</h3>
              <p className="mt-2"><span className="display-md text-ink">{p.price}</span>{p.period && <span className="text-ink-soft"> / {p.period}</span>}</p>
              {p.description && <RichBody markdown={p.description} align={p.align} className="mt-3 text-sm text-ink-soft" />}
              <ul className="mt-5 flex-1 space-y-2 text-ink-soft">
                {p.features.map((f, fi) => (<li key={fi} dangerouslySetInnerHTML={{ __html: inlineHtml(f) }} />))}
              </ul>
              {p.cta?.label && p.cta?.href && (
                <a href={siteHref(p.cta.href)} className={`mt-6 inline-block text-center ${themeId === 'warmArtStudio' ? 'rounded-full' : 'rounded-none'} bg-clay px-5 py-2.5 text-sm font-medium text-canvas transition-transform hover:-translate-y-0.5`}>{p.cta.label}</a>
              )}
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ── Scrollytelling ─────────────────────────────────────────────────────────
// All themes: sticky image panel tracks active step via IntersectionObserver
//   (previously always showed step[0] image - now reactive).
// warmArtStudio: small clay-colored chapter number, cozy spacing
// minimalGallery: large architectural tabular number with wide tracking
// boldEditorial: massive watermark number behind heading (text-ink/5 ghost)
function Scrollytelling({ b, width, themeId }: { b: ScrollytellingBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const widthClass = width === 'full' ? 'max-w-[1600px]' : 'max-w-6xl';

  useEffect(() => {
    const observers = b.steps.map((_, idx) => {
      const el = stepRefs.current[idx];
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry?.isIntersecting) setActiveStep(idx); },
        { rootMargin: '-30% 0px -30% 0px', threshold: 0 },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, [b.steps]);

  const currentImage = b.steps[activeStep]?.image ?? b.steps[0]?.image;

  return (
    <section className={`mx-auto w-full ${widthClass} px-6 py-20`}>
      <div className="grid gap-12 md:grid-cols-2">
        {/* Steps column */}
        <div className="space-y-[60vh] md:space-y-[70vh]">
          {b.steps.map((s, i) => (
            <Reveal key={i}>
              <div ref={(el) => { stepRefs.current[i] = el; }}>
                {themeId === 'boldEditorial' ? (
                  // Massive watermark number behind heading - high drama
                  <div className="relative">
                    <span className="pointer-events-none absolute -left-2 -top-10 select-none text-[9rem] font-black leading-none text-ink/[0.04]" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="display-lg relative text-ink">{s.heading}</h3>
                    {s.body && <p className="mt-4 max-w-md text-lg text-ink-soft">{s.body}</p>}
                  </div>
                ) : themeId === 'minimalGallery' ? (
                  // Architectural chapter marker - large tabular number, wide tracking
                  <div>
                    <span className="mb-4 block text-4xl font-light tabular-nums tracking-widest text-clay">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="display-lg text-ink">{s.heading}</h3>
                    {s.body && <p className="mt-4 max-w-md text-lg text-ink-soft">{s.body}</p>}
                  </div>
                ) : (
                  // warmArtStudio: intimate clay label
                  <div>
                    <span className="font-display text-sm text-clay">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="display-lg mt-2 text-ink">{s.heading}</h3>
                    {s.body && <p className="mt-4 max-w-md text-lg text-ink-soft">{s.body}</p>}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* Sticky image panel - reacts to active step */}
        <div className="hidden md:block">
          <div className="sticky top-24 overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-soft">
            {currentImage ? (
              // key forces remount on image change, replaying the step-image-in animation
              <img
                key={currentImage}
                src={siteAsset(currentImage)}
                alt=""
                className="aspect-[3/4] w-full object-cover"
                style={{ animation: 'step-image-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both' }}
              />
            ) : (
              <div className="grid aspect-[3/4] place-items-center text-ink-soft">Add images to steps in your studio.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── MediaStory (carousel) ──────────────────────────────────────────────────
// warmArtStudio: progress bar (linear fill) - organic, fluid
// minimalGallery: flat segment indicators (square ticks) - precise, architectural
// boldEditorial: large typographic counter "02 / 07" with arrow controls below
function MediaStory({ b, width, themeId }: { b: MediaStoryBlock; width: SiteWidth; themeId: SiteThemeId }) {
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const imgs = b.images ?? [];
  const n = imgs.length;
  const body = bodyMarkdown(b.story, b.paragraphs);
  const autoSlide = b.autoSlide ?? true;
  const intervalSeconds = typeof b.intervalSeconds === 'number' && Number.isFinite(b.intervalSeconds) && b.intervalSeconds >= 1 ? Math.round(b.intervalSeconds) : 10;
  const showProgressBar = b.showProgressBar ?? true;
  const go = (d: number) => setI((p) => (n ? (p + d + n) % n : 0));

  useEffect(() => {
    if (!autoSlide || n <= 1) return undefined;
    const timer = window.setInterval(() => setI((p) => (p + 1) % n), intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [autoSlide, intervalSeconds, n]);

  useEffect(() => {
    if (!showProgressBar || n <= 1) {
      setProgress(0);
      return undefined;
    }
    if (!autoSlide) {
      setProgress(((i + 1) / n) * 100);
      return undefined;
    }
    setProgress(0);
    const frame = window.requestAnimationFrame(() => setProgress(100));
    return () => window.cancelAnimationFrame(frame);
  }, [autoSlide, i, intervalSeconds, n, showProgressBar]);

  // Per-theme carousel progress indicator
  const progressEl = n > 1 && (
    themeId === 'boldEditorial' ? (
      // Typographic counter with inline arrows - editorial authority
      <div className="flex items-center justify-between border-t border-ink/15 px-1 py-3">
        <button onClick={() => go(-1)} aria-label="Previous image" className="text-lg font-light text-ink-soft transition-colors hover:text-ink">←</button>
        <span className="text-xs font-medium tabular-nums tracking-[0.2em] text-ink-soft">
          {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </span>
        <button onClick={() => go(1)} aria-label="Next image" className="text-lg font-light text-ink-soft transition-colors hover:text-ink">→</button>
      </div>
    ) : themeId === 'minimalGallery' ? (
      // Flat segment ticks - architectural precision
      <div className="flex gap-1 p-3" role="tablist" aria-label="Carousel navigation">
        {imgs.map((_, idx) => (
          <button
            key={idx}
            role="tab"
            aria-selected={idx === i}
            aria-label={`Slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-[3px] flex-1 transition-colors duration-200 ${idx === i ? 'bg-clay' : 'bg-line'}`}
            style={{ borderRadius: 0 }}
          />
        ))}
      </div>
    ) : showProgressBar ? (
      // Linear progress fill - warm, fluid
      <div className="h-1 bg-line" role="progressbar" aria-label="Carousel progress" aria-valuemin={1} aria-valuemax={n} aria-valuenow={i + 1}>
        <div
          className="h-full bg-clay"
          style={{
            width: `${progress}%`,
            transition: autoSlide ? `width ${intervalSeconds}s linear` : 'width 300ms ease',
          }}
        />
      </div>
    ) : null
  );

  const prevNextButtons = themeId !== 'boldEditorial' && n > 1 && (
    <>
      <button onClick={() => go(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-canvas/85 text-ink shadow-soft hover:bg-canvas">‹</button>
      <button onClick={() => go(1)} aria-label="Next image" className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-canvas/85 text-ink shadow-soft hover:bg-canvas">›</button>
    </>
  );

  const media = (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-soft">
      {n > 0 ? (
        <img src={siteAsset(imgs[i]!.src)} alt={imgs[i]!.alt ?? ''} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="grid aspect-[4/3] place-items-center text-ink-soft">Add images in your studio</div>
      )}
      {prevNextButtons}
      {progressEl}
    </div>
  );
  const story = (
    <div className="flex flex-col justify-center">
      <h2 className="display-lg text-ink" dangerouslySetInnerHTML={{ __html: inlineHtml(b.heading) }} />
      {body && <RichBody markdown={body} align={b.align} className="mt-4 text-lg leading-relaxed text-ink-soft" />}
    </div>
  );
  return (
    <Section width={width}>
      <Reveal>
        <div className="grid items-stretch gap-8 md:grid-cols-2">
          {(b.imageSide ?? 'left') === 'left' ? <>{media}{story}</> : <>{story}{media}</>}
        </div>
      </Reveal>
    </Section>
  );
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  const settings = blocks.find((b) => b.kind === 'siteSettings');
  const width: SiteWidth = settings?.kind === 'siteSettings' && settings.pageWidth === 'full' ? 'full' : 'contained';
  const themeId: SiteThemeId = settings?.kind === 'siteSettings' && (settings.themeId === 'minimalGallery' || settings.themeId === 'boldEditorial') ? settings.themeId : 'warmArtStudio';
  const fontId: SiteFontId = settings?.kind === 'siteSettings' && SITE_FONT_IDS.has(settings.fontId as SiteFontId) ? settings.fontId as SiteFontId : 'dmSans';
  const visibleBlocks = blocks.filter((b) => b.kind !== 'siteSettings');
  return (
    <div data-site-font={fontId}>
      {visibleBlocks.map((b, i) => {
        switch (b.kind) {
          case 'hero': return <Hero key={i} b={b} width={width} themeId={themeId} />;
          case 'richText': return <RichText key={i} b={b} width={width} themeId={themeId} />;
          case 'gallery': return <Gallery key={i} b={b} width={width} themeId={themeId} />;
          case 'mediaStory': return <MediaStory key={i} b={b} width={width} themeId={themeId} />;
          case 'featureGrid': return <FeatureGrid key={i} b={b} width={width} themeId={themeId} />;
          case 'cta': return <Cta key={i} b={b} width={width} themeId={themeId} />;
          case 'scrollytelling': return <Scrollytelling key={i} b={b} width={width} themeId={themeId} />;
          case 'table': return <Table key={i} b={b} width={width} />;
          case 'testimonials': return <Testimonials key={i} b={b} width={width} themeId={themeId} />;
          case 'faq': return <Faq key={i} b={b} width={width} />;
          case 'contact': return <Contact key={i} b={b} width={width} />;
          case 'video': return <Video key={i} b={b} width={width} />;
          case 'pricing': return <Pricing key={i} b={b} width={width} themeId={themeId} />;
          case 'needsReview': return <NeedsReview key={i} b={b} width={width} />;
          default: return null;
        }
      })}
    </div>
  );
}
