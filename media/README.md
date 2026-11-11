# Media originals

Original, full-resolution files. They are **not** served as-is: the site build
copies them through Astro's image pipeline (resize, AVIF/WebP, metadata
stripped). Never delete originals after optimizing.

## Layout

```
media/
  photos/              Personal timeline photos (About section)
    photos.yaml        Caption + alt text for each photo
  projects/<slug>/     Project media; <slug> matches content/projects/<slug>.md
```

## Naming convention

```
<year>[-<month>]_<subject>_<nn>.<ext>
```

| Part | Rule | Example |
|---|---|---|
| `year[-month]` | When the photo was taken; month optional (`MM`). Sorts chronologically | `2009`, `2019-03` |
| `subject` | Lowercase kebab-case, English, 1–4 words | `first-computer` |
| `nn` | Two-digit counter for alternatives of the same moment | `01`, `02` |
| `ext` | Keep the original format (`jpg`, `png`, `heic`, `mp4`) | `jpg` |

Only lowercase letters, digits, `-` and `_`. No spaces, accents or `ñ`.

### Timeline photos (`media/photos/`)

```
<year>_first-computer_01.jpg        Childhood at the computer (the only photo for now)
<year>_robot-arm_01.jpg             Optional, later: a current "now" photo
```

### Project media (`media/projects/<slug>/`)

```
<year>[-<month>]_<kind>-<subject>_<nn>.<ext>
```

`kind` is one of `photo`, `video`, `render`, `diagram`, `screenshot`:

```
media/projects/mtds/2026-09_photo-arm-assembled_01.jpg
media/projects/mtds/2026-11_video-congress-demo_01.mp4
media/projects/mtds/2026-05_render-cad-model_01.png
```

## Captions and alt text

`media/photos/photos.yaml` holds one entry per file:

- `caption`: one line tied to a timeline milestone (shown on the page).
- `alt`: what the image shows, for screen readers.

Write them in Spanish if it is easier; the build session translates and asks
you to confirm.

## Privacy

Phone photos usually carry GPS location in their EXIF metadata. The build
strips all metadata, but avoid committing originals with location to a
**public** repository: either remove the location before adding the file, or
keep `media/` out of the public repo.
