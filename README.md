# Baton Rouge Alternative — GitHub Pages

This is the full, ready-to-upload static site. Every photo, song, poem, article, video, and zine is discovered from its folder automatically **when GitHub Actions publishes the site**. Davy never has to edit `content.json`.

## First deployment (one time)

1. Make a new public GitHub repository, then upload **the contents** of this ZIP to its root (`index.html` should be at the top), committing to `main`. For lots of files / MP3s, use GitHub Desktop or `git` (the browser upload has a smaller per-file limit).
2. Under repository **Settings → Pages**, set **Build and deployment → Source: GitHub Actions**. **Do not choose “Deploy from a branch”** — our workflow builds files first and deploys the results.
3. Under **Actions**, check the **Publish Baton Rouge Alternative** workflow. On the first commit it will render the issue pages, refresh the catalog, and publish your site. If your workflow ran before you enabled Pages, click **Run workflow** once.
4. Find your public URL in Settings → Pages or in the workflow deployment. No Neocities account or backend is necessary.

## Future updates (Davy's workflow)

Simply add a new item to the folder that matches its category, or delete an old file, then **commit to `main`**. GitHub Actions will discover it, update the website, and publish automatically. No editing JSON, JS, CSS, or HTML. If you're uploading a video, use MP4 encoded as H.264/AAC for broad device support. The individual folder `EXAMPLE.txt` files explain filenames and placement.

| Folder | What to add |
|---|---|
| `music/` | `.mp3` tracks, optional cover.jpg/png in album folder |
| `art/` | `.jpg`, `.png`, `.webp`, `.gif`, `.avif` images |
| `poetry/` | `.txt` poems: first line `Title by Author`, blank line, then original lines |
| `articles/` | `.txt` articles in the same format |
| `videos/` | `.mp4` or `.webm` video; optional same-named JPG/PNG poster |
| `zines/` | `.pdf` zine issues; the workflow renders web previews and adds a slider tab |

Folders can contain subfolders. Music album names are inferred from album folders / MP3 metadata; preexisting titles and credits remain protected in `media-metadata.json`. New filenames like `Title -- Artist.mp4` or `Title -- Artist.png` automatically produce useful credits. Keep uppercase/lowercase exact in paths.

## About the PDF and zine reader

The home page **Fill the Form** button opens the **unaltered original consent PDF** at `pdf's/BR-Alt-Consent-Agreement.pdf`. Contributors can open/print/download and return the document themselves. It is **not** a web form and does not send submissions or signatures online.

Zines 1 and 2 are original 2018 booklet-print PDFs. Each PDF page is a two-page *print spread*; the reader turns through those 12 original spreads, rather than inventing single reading pages or altering the PDFs. Their original PDF downloads stay available. The existing separate download section below the reader remains unchanged.

## Troubleshooting and limits

- Each commit triggers `.github/workflows/publish.yml` which runs `scripts/build_site.py`, builds `content.json` and `zines-manifest.json` in a temporary deployment workspace, and **deploys those built files directly**. This means the files in your GitHub repo itself are a snapshot until the workflow runs — that is normal.
- GitHub Pages is public; do not store sensitive or private files. GitHub's Git repository file limit is 100 MB per file, and browser uploads have a lower limit (commonly 25 MB). Large video files may need H.264 compression or external hosting.
- `EXAMPLE.txt` files never appear in the galleries. No sample videos have been fabricated.
- Avoid naming a poem `EXAMPLE.txt` (this exact filename is reserved for instructions).
- MP4 `.mov` or HEVC files may not play on some Windows/Android browsers. Convert to H.264/AAC MP4.
- You can run the builder locally with `pip install -r requirements.txt` then `python scripts/build_site.py`, then `python -m http.server 8000`. Browse to `http://localhost:8000/`. `file://` alone is insufficient for fetch-based galleries.
- The original GitHub Pages starter zine page-flip uses no external CDNs or JS packages. The only runtime player is the browser's built-in audio/video player.
