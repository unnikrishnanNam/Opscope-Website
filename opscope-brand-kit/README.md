# Opscope brand kit

**Mark:** Lens p (Heavy). The bowl of the "p" is also a lens, and the orange pupil marks what's being watched.
**Wordmark:** Manrope ExtraBold (800) with −0.05em tracking. The text in every SVG is converted to outlines, so you don't need the font installed.

## Colours

| Name   | Hex       | Use                                              |
|--------|-----------|--------------------------------------------------|
| Ink    | `#17140F` | Mark and wordmark on light backgrounds           |
| Paper  | `#F6F3EE` | Light background; mark and wordmark on dark      |
| Signal | `#E8590C` | The pupil; app-icon and favicon background       |
| Night  | `#101418` | Dark background; browser `theme-color`           |

## What's in here

- `svg/`: master files. Use these wherever SVG is accepted.
  - `opscope-logo*`: the mark and wordmark together (the primary logo).
  - `opscope-mark*`: the mark on its own.
  - `opscope-wordmark*`: the text on its own.
  - `-reversed`: for dark backgrounds.
  - `-black` and `-white`: single-colour versions for print or embossing.
  - `opscope-mark-currentcolor.svg`: inherits the CSS `color` of its parent, with the pupil staying orange. Inline it in the dashboard UI so it follows light and dark themes.
  - `opscope-app-icon*`: rounded-tile icons, in orange and in dark.
- `png/`: raster exports. The mark comes at 256, 512 and 1024 px; the logo at 480, 960 and 1920 px wide.
- `favicon/`: copy everything into your web root (for Vite, `public/`), then paste `head-snippet.html` into `<head>`. It includes:
  - `favicon.ico` (16, 32 and 48 px) and `favicon.svg`.
  - `apple-touch-icon.png` (180 px).
  - Android icons at 192 and 512 px, plus a maskable 512 px icon.
  - `site.webmanifest`.
- `social/`: `og-image.png` (1200×630) for link previews, and `github-social-preview.png` (1280×640). Upload the GitHub one under the repo's **Settings → Social preview**.

## Usage rules

- **Clear space:** keep at least one bowl-stroke width (about a quarter of the mark's width) empty on every side.
- **Minimum size:** the full logo should be at least 96 px wide. Below 24 px, use the orange tile (favicon) rather than the bare mark.
- **Pupil colour:** it stays Signal orange in the colour versions and only matches the body colour in the single-colour versions.
- **Don't** stretch the logo, rotate it, add effects, or retype the wordmark in another font.
