/**
 * UI strings, one dictionary per language with identical keys (tested in
 * ui.test.ts). Page copy (case studies, essay, About...) lives in content
 * files, not here. Spanish is neutral (tú, no voseo) and an LLM draft until
 * Teo approves it.
 */
export const langs = ['en', 'es'] as const;
export type Lang = (typeof langs)[number];
export const defaultLang: Lang = 'en';

const en = {
  'skip': 'Skip to content',
  'draft': 'DRAFT — Teo rewrites',

  'nav.main': 'Main',
  'nav.work': 'Work',
  'nav.build': 'How this site was built',
  'nav.ai': 'How I build with AI',
  'nav.writing': 'Writing',
  'nav.about': 'About',
  'nav.resume': 'Resume',

  'lang.name': 'English',

  'theme.toggle': 'Dark theme',

  'contact.label': 'Contact',
  'contact.labelFooter': 'Contact (footer)',
  'contact.labelResume': 'Contact (resume)',
  'contact.resumePdf': 'Resume (PDF)',
  'contact.copyEmail': 'Copy email',
  'contact.copied': 'Copied',

  'footer.badgeLabel': 'Built with Gentle-AI — gentle-ai repository',
  'footer.badgeAlt': 'Built with Gentle-AI',
  'footer.builtWith': 'Built with the {gentle} harness and {aihero} skills',
  'footer.llm': 'Copy edited with an LLM. The raw build conversation is {here}, in Spanish.',
  'footer.llmLink': 'here',
  'footer.colophon': 'Colophon',
  'footer.rss': 'RSS',

  'meta.role': 'Role',
  'meta.tags': 'Tags',
  'meta.stack': 'Stack',
  'meta.team': 'Team',
  'meta.owned': 'What I owned',
  'meta.repo': 'Repo',
  'meta.private': 'Private, no link.',
  'meta.solo': 'Solo',
  'meta.teamOf': 'Team of',
  'meta.proof': 'Proof',
  'link.repo': 'GitHub repo',
  'link.demo': 'Live demo',
  'link.post': 'DEV post',
  'link.readCase': 'Read the case study',

  'gallery.label': 'Media',
  'about.timeline': 'Timeline',
  'about.photoAlt': 'A toddler kneeling on a wooden chair, both hands on a white computer keyboard on a desk.',
  'work.overview': 'Overview',
  'posts.devEnglish': 'English',
  'posts.inEnglish': '(in English)',

  'rail.label': 'Page map',
  'rail.title': 'Exploded index',
  'rail.work': 'Work',
  'rail.build': 'How this site was built',
  'rail.ai': 'How I build with AI',
  'rail.writing': 'Writing',
  'rail.about': 'About · 2004',
  'rail.shortWork': 'Work',
  'rail.shortBuild': 'Build',
  'rail.shortAi': 'AI',
  'rail.shortWriting': 'Writing',
  'rail.shortAbout': 'About',
  'rail.now': '5 sections, top to bottom',
  'rail.nowShort': 'Page map',

  'resume.title': 'Resume',
  'resume.download': 'Download PDF',
  'resume.work': 'Work',
  'resume.projects': 'Projects',
  'resume.education': 'Education',
  'resume.certificates': 'Certificates',
  'resume.skills': 'Skills and languages',
  'resume.languages': 'Languages',
  'resume.contact': 'Contact',
  'resume.present': 'present',
  'resume.location': 'Entre Ríos, Argentina (UTC−3) · open to remote.',

  'notfound.title': 'Page not found',
  'notfound.body': 'That page does not exist. Go back to the {home}.',
  'notfound.home': 'home page',
} as const;

export type UiKey = keyof typeof en;

const es: Record<UiKey, string> = {
  'skip': 'Saltar al contenido',
  'draft': 'BORRADOR — traducción a revisar por Teo',

  'nav.main': 'Principal',
  'nav.work': 'Trabajo',
  'nav.build': 'Cómo se construyó este sitio',
  'nav.ai': 'Cómo construyo con IA',
  'nav.writing': 'Escritos',
  'nav.about': 'Sobre mí',
  'nav.resume': 'CV',

  'lang.name': 'Español',

  'theme.toggle': 'Tema oscuro',

  'contact.label': 'Contacto',
  'contact.labelFooter': 'Contacto (pie de página)',
  'contact.labelResume': 'Contacto (CV)',
  'contact.resumePdf': 'CV (PDF)',
  'contact.copyEmail': 'Copiar correo',
  'contact.copied': 'Copiado',

  'footer.badgeLabel': 'Hecho con Gentle-AI — repositorio de gentle-ai',
  'footer.badgeAlt': 'Hecho con Gentle-AI',
  'footer.builtWith': 'Hecho con el arnés {gentle} y las skills de {aihero}',
  'footer.llm': 'Traducido con un LLM y pendiente de revisión. La conversación completa de la construcción está {here}, en español.',
  'footer.llmLink': 'aquí',
  'footer.colophon': 'Colofón',
  'footer.rss': 'RSS',

  'meta.role': 'Rol',
  'meta.tags': 'Etiquetas',
  'meta.stack': 'Stack',
  'meta.team': 'Equipo',
  'meta.owned': 'Lo que hice yo',
  'meta.repo': 'Repositorio',
  'meta.private': 'Privado, sin enlace.',
  'meta.solo': 'Individual',
  'meta.teamOf': 'Equipo de',
  'meta.proof': 'Prueba',
  'link.repo': 'Repositorio en GitHub',
  'link.demo': 'Demo en vivo',
  'link.post': 'Artículo en DEV',
  'link.readCase': 'Leer el caso de estudio',

  'gallery.label': 'Medios',
  'about.timeline': 'Línea de tiempo',
  'about.photoAlt': 'Un niño pequeño arrodillado sobre una silla de madera, con ambas manos sobre un teclado blanco de computadora en un escritorio.',
  'work.overview': 'Resumen',
  'posts.devEnglish': 'Inglés',
  'posts.inEnglish': '(en inglés)',

  'rail.label': 'Mapa de la página',
  'rail.title': 'Índice desplegado',
  'rail.work': 'Trabajo',
  'rail.build': 'Cómo se construyó este sitio',
  'rail.ai': 'Cómo construyo con IA',
  'rail.writing': 'Escritos',
  'rail.about': 'Sobre mí · 2004',
  'rail.shortWork': 'Trabajo',
  'rail.shortBuild': 'Build',
  'rail.shortAi': 'IA',
  'rail.shortWriting': 'Escritos',
  'rail.shortAbout': 'Sobre mí',
  'rail.now': '5 secciones, de arriba hacia abajo',
  'rail.nowShort': 'Mapa de la página',

  'resume.title': 'CV',
  'resume.download': 'Descargar PDF',
  'resume.work': 'Experiencia',
  'resume.projects': 'Proyectos',
  'resume.education': 'Educación',
  'resume.certificates': 'Certificados',
  'resume.skills': 'Habilidades e idiomas',
  'resume.languages': 'Idiomas',
  'resume.contact': 'Contacto',
  'resume.present': 'actualidad',
  'resume.location': 'Entre Ríos, Argentina (UTC−3) · disponible para trabajo remoto.',

  'notfound.title': 'Página no encontrada',
  'notfound.body': 'Esa página no existe. Vuelve a la {home}.',
  'notfound.home': 'página de inicio',
};

export const ui: Record<Lang, Record<UiKey, string>> = { en, es };

/** `const t = useTranslations(lang); t('nav.work')`. */
export function useTranslations(lang: Lang = defaultLang) {
  return (key: UiKey): string => ui[lang][key] ?? ui[defaultLang][key];
}
export const t = useTranslations;

/** Split "text {slot} text" into parts so Astro can put links in the slots. */
export function slots(text: string): Array<{ text: string } | { slot: string }> {
  return text.split(/\{(\w+)\}/).map((part, i) => (i % 2 ? { slot: part } : { text: part }));
}
