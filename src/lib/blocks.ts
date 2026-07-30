// Blocks-as-data contract. This is the single source of truth shared by:
//   - the content collection schema (src/content.config.ts)
//   - the React render layer (src/components/blocks.tsx)
//   - the i4tow editor + /__preview harness (sends these objects via postMessage)
//
// Each block is a plain JSON object with a `kind` discriminator, so it
// serializes into frontmatter and renders identically in build and preview.

export interface HeroBlock {
  kind: 'hero';
  eyebrow?: string;
  heading: string;
  subheading?: string;
  paragraphs?: string[];
  /** Per-paragraph text alignment, indexed parallel to `paragraphs`. */
  paragraphAligns?: ParagraphAlign[];
  /** Alignment applied to the whole markdown body (supersedes paragraphAligns). */
  align?: ParagraphAlign;
  /** Manual heading-size override; default 'xl'. */
  headingSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional background image URL (e.g. a GitHub Pages gallery image). */
  image?: string;
  cta?: { label: string; href: string };
  buttons?: { label: string; href: string }[];
}

export type SiteWidth = 'contained' | 'full';
export type SiteThemeId = 'warmArtStudio' | 'minimalGallery' | 'boldEditorial';
export type SiteFontId =
  | 'dmSans' | 'roboto' | 'openSans' | 'lato' | 'montserrat'
  | 'poppins' | 'inter' | 'oswald' | 'raleway' | 'notoSans'
  | 'sourceSans3' | 'ubuntu' | 'nunitoSans' | 'merriweather'
  | 'playfairDisplay' | 'robotoSlab' | 'rubik' | 'ptSans'
  | 'workSans' | 'mulish' | 'robotoCondensed' | 'notoSerif'
  | 'libreBaskerville' | 'cormorantGaramond' | 'quicksand';

export interface SiteSettingsBlock {
  kind: 'siteSettings';
  pageWidth?: SiteWidth;
  themeId?: SiteThemeId;
  fontId?: SiteFontId;
  appearanceModeEnabled?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  lightPrimaryColor?: string;
  lightSecondaryColor?: string;
  lightBackgroundColor?: string;
  darkPrimaryColor?: string;
  darkSecondaryColor?: string;
  darkBackgroundColor?: string;
  logoUrl?: string;
}

/** Text alignment for a single paragraph. */
export type ParagraphAlign = 'left' | 'center' | 'right' | 'justify';

export interface RichTextBlock {
  kind: 'richText';
  heading?: string;
  /** Markdown string rendered to HTML by the render layer. */
  markdown: string;
  paragraphs?: string[];
  /** Per-paragraph text alignment, indexed parallel to `paragraphs`. Defaults to 'left'. */
  paragraphAligns?: ParagraphAlign[];
  /** Alignment applied to the whole markdown body (supersedes paragraphAligns). */
  align?: ParagraphAlign;
}

export interface GalleryBlock {
  kind: 'gallery';
  heading?: string;
  /** Optional intro prose shown above the grid (markdown, like MediaStory.story). */
  story?: string;
  paragraphs?: string[];
  paragraphAligns?: ParagraphAlign[];
  /** Alignment applied to the whole story body (supersedes paragraphAligns). */
  align?: ParagraphAlign;
  /** i4tow album id; images resolved at build (manifest) and rendered with blur-up. */
  albumId: string;
  items?: { src: string; alt?: string; thumbHash?: string; width?: number; height?: number }[];
}

/** Image carousel on one side, a short story on the other. */
export interface MediaStoryBlock {
  kind: 'mediaStory';
  heading: string;
  story: string;
  paragraphs?: string[];
  paragraphAligns?: ParagraphAlign[];
  /** Alignment applied to the whole markdown body (supersedes paragraphAligns). */
  align?: ParagraphAlign;
  imageSide?: 'left' | 'right';
  /** Whether the carousel advances automatically. Defaults to true. */
  autoSlide?: boolean;
  /** Auto-slide interval in seconds. Defaults to 10. */
  intervalSeconds?: number;
  /** Whether to show a progress bar below the image. Defaults to true. */
  showProgressBar?: boolean;
  images: { src: string; alt?: string }[];
}

export interface FeatureGridBlock {
  kind: 'featureGrid';
  heading?: string;
  features: { title: string; body: string; icon?: string }[];
}

export interface CtaBlock {
  kind: 'cta';
  heading: string;
  body?: string;
  paragraphs?: string[];
  paragraphAligns?: ParagraphAlign[];
  /** Alignment applied to the whole markdown body (supersedes paragraphAligns). */
  align?: ParagraphAlign;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  buttons?: { label: string; href: string }[];
}

/** Bespoke art-directed scrollytelling story (dev-built, not freely WYSIWYG). */
export interface ScrollytellingBlock {
  kind: 'scrollytelling';
  steps: { heading: string; body?: string; image?: string }[];
}

/** Generic tabular content (menus, pricing, schedules, specs). Cells are inline markdown. */
export interface TableBlock {
  kind: 'table';
  heading?: string;
  caption?: string;
  headers?: string[];
  rows: string[][];
}

export interface TestimonialsBlock {
  kind: 'testimonials';
  heading?: string;
  /** `quote` is markdown; `align` applies to it. `date` is optional. */
  items: { quote: string; author: string; role?: string; avatar?: string; date?: string; align?: ParagraphAlign }[];
}

export interface FaqBlock {
  kind: 'faq';
  heading?: string;
  /** `answer` is markdown; `align` applies to it. */
  items: { question: string; answer: string; align?: ParagraphAlign }[];
}

/** Contact details. Per-day hours, holidays, and locations (mapUrl is a plain link, not an iframe). */
export interface ContactBlock {
  kind: 'contact';
  heading?: string;
  phone?: string;
  email?: string;
  hours?: { mon?: string; tue?: string; wed?: string; thu?: string; fri?: string; sat?: string; sun?: string };
  holidays?: string[];
  locations?: { label?: string; address?: string; mapUrl?: string }[];
}

/** Embedded video. Only provider + id are stored; the renderer builds a safe embed URL. */
export interface VideoBlock {
  kind: 'video';
  provider: 'youtube' | 'vimeo';
  videoId: string;
  title?: string;
}

export interface PricingBlock {
  kind: 'pricing';
  heading?: string;
  /** `description` is markdown; `align` applies to it. */
  plans: { name: string; price: string; period?: string; features: string[]; description?: string; align?: ParagraphAlign; cta?: { label: string; href: string } }[];
}

/** Placeholder for an unconverted WordPress block. Live render falls back to `text`. */
export interface NeedsReviewBlock {
  kind: 'needsReview';
  wpBlock: string;
  text?: string;
  raw?: string;
  attrs?: Record<string, unknown>;
  sourceUrl?: string;
}

export type Block =
  | SiteSettingsBlock
  | HeroBlock
  | RichTextBlock
  | GalleryBlock
  | MediaStoryBlock
  | FeatureGridBlock
  | CtaBlock
  | ScrollytellingBlock
  | TableBlock
  | TestimonialsBlock
  | FaqBlock
  | ContactBlock
  | VideoBlock
  | PricingBlock
  | NeedsReviewBlock;

export type BlockKind = Block['kind'];
