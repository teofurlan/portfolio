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

export const nav = [
  { href: '/#work', label: 'Work' },
  { href: '/build-session/', label: 'How this site was built' },
  { href: '/how-i-build/', label: 'How I build with AI' },
  { href: '/writing/', label: 'Writing' },
  { href: '/about/', label: 'About' },
  { href: '/cv/', label: 'CV' },
] as const;
