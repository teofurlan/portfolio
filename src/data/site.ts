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
    cv: '/cv.pdf',
  },
} as const;

/** English paths; Base maps them to the page language with alternate(). Labels come from src/i18n/ui.ts. */
export const nav = [
  { href: '/', hash: '#work', key: 'nav.work' },
  { href: '/build-session/', hash: '', key: 'nav.build' },
  { href: '/how-i-build/', hash: '', key: 'nav.ai' },
  { href: '/writing/', hash: '', key: 'nav.writing' },
  { href: '/about/', hash: '', key: 'nav.about' },
  { href: '/resume/', hash: '', key: 'nav.resume' },
] as const;
