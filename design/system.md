# Design system — teofurlan.com

Synced from `src/styles/global.css` (the only design source). One token set, two themes: light
"paper" (default) and dark "blueprint" (`prefers-color-scheme: dark` or `data-theme`).

## Colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#e4d9bd` | `#0a1a33` | Page ground (paper / blueprint) |
| `--bg2` | `#d6c9a6` | `#06122a` | Footer, wash |
| `--sheet` | `#efe6cf` | `#0e2547` | Sheet face (cards, panels) |
| `--ink` | `#10131a` | `#e9f0fb` | Body text |
| `--ink2` | `#363e4b` | `#adbed8` | Secondary text |
| `--line` | `#1d2c47` | `#7fa6dc` | Frames, plate edges |
| `--hair` | `#6b6957` | `#5b84bb` | Hairlines (≥ 3:1) |
| `--accent` | `#a62f08` | `#ffb84d` | Accent (one per view) |
| `--on-accent` | `#ffffff` | `#0a1a33` | Text on accent |
| `--link` | `#0a3b78` | `#9cc4ff` | Links |
| `--focus` | `#0a3b78` | `#ffd089` | Focus ring |
| `--plate-on` | `#ecc9ae` | `#46391f` | Active plate fill |
| `--grid` | `rgba(29,44,71,.14)` | `rgba(127,166,220,.13)` | Drafting grid |
| `--matte` | `#f6f0de` | `#efe7d2` | Photo matte |

Source: `src/styles/global.css:3-50`.

## Typography

- `--sans`: "IBM Plex Sans", then `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- `--mono`: "IBM Plex Mono", then `ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace`.
- Fonts are self-hosted via `@fontsource` in the app; artboards use the fallback stacks.

Source: `src/styles/global.css:19-20`.

## Component rules

- Engineering-drawing language: framed sheets, hairlines, mono part labels, one accent.
- Motion only under `prefers-reduced-motion: no-preference` (`src/styles/global.css:55,123,235`).
