# Opscope website (Deprecated)

The single-page site for [Opscope](https://github.com/unnikrishnanNam/OpScope). Plain HTML, CSS and
JavaScript, with no build step and no dependencies apart from Google Fonts.

```
index.html            the page
assets/css/style.css  tokens (light and dark), layout, animations
assets/js/main.js     theme switch, scroll story, reveals, demos, tabs, copy buttons
assets/img/           app screenshots (WebP, light and dark)
favicon.*, *.png      icons and the social preview image, from the brand kit
site.webmanifest      web app manifest (relative paths, so it works under /<repo>/)
.nojekyll             tells GitHub Pages to serve the files as they are
```

`opscope-brand-kit/`, `public/` and `screenshots/` are the source material the site was made from.
The page doesn't load anything from them.

## Run locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, open **Settings → Pages**, choose **Deploy from a branch**, pick `main` and `/ (root)`.
3. If the site's address isn't `https://unnikrishnannam.github.io/OpScope-Website/`, change the two
   `og-image.png` URLs in `index.html` (link previews need an absolute address).
