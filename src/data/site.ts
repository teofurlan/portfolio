/** Single source for site-wide links (hero + footer). */
export const site = {
  name: 'Teo Furlan',
  url: 'https://teofurlan.com',
  links: {
    github: 'https://github.com/teofurlan',
    linkedin: 'https://www.linkedin.com/in/teo-furlan',
    dev: 'https://dev.to/teo_furlan',
    // Email is rendered lightly obfuscated (P3); never hardcode a mailto: in markup.
    email: { user: 'teofurlan03', domain: 'gmail.com' },
    /**
     * Public resume/CV PDFs per language. null = not published yet: every link to it is
     * hidden. The files must never print the phone number (BRIEF); put them in public/.
     */
    pdf: { en: '/resume.pdf' as string | null, es: '/es/cv.pdf' as string | null },
  },
} as const;

/** English paths; Base maps them to the page language with alternate(). Labels come from src/i18n/ui.ts. */
export const nav = [
  { href: '/', hash: '#projects', key: 'nav.work' },
  { href: '/build-session/', hash: '', key: 'nav.build' },
  { href: '/how-i-build/', hash: '', key: 'nav.ai' },
  { href: '/writing/', hash: '', key: 'nav.writing' },
  { href: '/about/', hash: '', key: 'nav.about' },
  { href: '/resume/', hash: '', key: 'nav.resume' },
] as const;
