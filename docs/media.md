# Media

Where pictures and other media live, and how they get onto the site.

## Folders

| Folder | Holds | In git |
| --- | --- | --- |
| `media-src/<project>/` | Originals: screenshots, photos, slide images, as they came (PNG/JPG). Never served. | yes |
| `public/images/<project>/` | The optimized WebP files the site serves, referenced by absolute path (`/images/<project>/<name>`). | yes |
| `public/` (root) | Site-wide static files (favicon). | yes |
| `docs/` | Markdown only. No media, except `docs/inspiration/` (design reference images, see `art-direction.md`). | yes |

Future types follow the same split: originals in `media-src/<project>/` (e.g. `.wav`, `.mp4`), what the site serves in `public/<type>/<project>/` (`public/audio/`, `public/video/`). Videos hosted elsewhere (YouTube) are not stored: see `VideoEmbed` in `architecture.md`.

Never reference `media-src/` from the site, and never put original PNGs in `public/`.

## Adding pictures to a project

1. Copy the originals to `media-src/<project>/` with descriptive kebab-case names (`phone-wifi-list.jpg`).
2. Convert each one:

   ```
   node scripts/optimize-image.mjs media-src/<project>/<file> <project> <name> [--crop left,top,width,height] [--gray]
   ```

   This writes `public/images/<project>/<name>-960.webp` (page and carousel, quality 78) and `<name>-1920.webp` (full-size viewer, quality 82). The number is the longest side in pixels, so portrait and landscape both work, and nothing is enlarged. `--crop` (pixels of the original) is how a banner is cut from a photo. The script uses `sharp`, which comes with Astro.
3. Reference it in the project's front matter without size suffix or extension (`/images/<project>/<name>`) and set `orientation: portrait` for tall pictures. See `content.md`.

The banner of a showcase page is `header-1920.webp` (16:9, crop it from the original).
