#!/usr/bin/env python3
"""Build static media catalogs from folders. Safe to run on every GitHub push.

Davy only uploads/removes content files. GitHub Actions regenerates catalogs, cover
thumbnails and PDF page previews then deploys the site in the same workflow.
"""
from __future__ import annotations
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

try:
    import fitz
    from mutagen.mp3 import EasyMP3
    from PIL import Image, ImageOps
except ImportError as exc:
    sys.exit('Build dependencies missing. Run: pip install pymupdf mutagen pillow: ' + str(exc))

ROOT = Path(__file__).resolve().parent.parent
PREVIEW_DIR = ROOT / 'zine-previews'
THUMB_DIR = ROOT / 'video-thumbnails'
JSON = ROOT / 'content.json'
ZINE_JSON = ROOT / 'zines-manifest.json'
META = ROOT / 'media-metadata.json'


def url(path: Path) -> str:
    return '/'.join(quote(part, safe='-_.~') for part in path.relative_to(ROOT).parts)


def files(folder: str, suffixes: set[str]):
    base = ROOT / folder
    return sorted((x for x in base.rglob('*') if x.is_file() and x.suffix.lower() in suffixes
                   and not x.name.startswith('.') and x.name.lower() != 'example.txt'),
                  key=lambda p: str(p).lower()) if base.exists() else []


def pretty(s: str):
    s = re.sub(r'^\d{1,3}[ ._-]+', '', s)
    s = re.sub(r'[-_]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def split_name(p: Path):
    name = pretty(p.stem)
    if ' -- ' in p.stem:
        parts = p.stem.split(' -- ', 1)
        return pretty(parts[0]), pretty(parts[1])
    return name, ''


def txt_header(p: Path):
    with p.open(encoding='utf-8-sig', errors='replace') as f:
        first = f.readline().strip().removeprefix('>').strip()
    m = re.match(r'^(.*?)\s+by\s+(.+)$', first, flags=re.I)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return first or pretty(p.stem), ''


def load_meta():
    if not META.exists():
        return {}
    return json.loads(META.read_text(encoding='utf-8'))


def metadata_for(meta, p):
    return meta.get(url(p), {})


def find_cover(p: Path):
    candidates = [x for x in p.parent.iterdir() if x.is_file() and x.suffix.lower() in {'.jpg','.jpeg','.png','.webp','.avif'}]
    if not candidates:
        return None
    candidates.sort(key=lambda x: (0 if re.search('cover|front|artwork', x.name, re.I) else 1, x.name.lower()))
    return candidates[0]


def music_catalog(meta):
    tracks = []
    for p in files('music', {'.mp3'}):
        old = metadata_for(meta,p)
        title, guessed_artist = split_name(p)
        album = p.parent.name if p.parent.parent.name != 'music' else ''
        artist = guessed_artist or (p.parent.parent.name if album else p.parent.name if p.parent.name != 'music' else '')
        cover = find_cover(p)
        try:
            tags = EasyMP3(p)
            if tags:
                title = tags.get('title', [title])[0].strip() or title
                album = tags.get('album', [album])[0].strip() or album
                artist = tags.get('artist', [artist])[0].strip() or artist
        except Exception as exc:
            print('Warning: MP3 metadata unavailable for',p.name, str(exc),file=sys.stderr)
        title = old.get('title') or title
        artist = old.get('artist') or artist
        album = old.get('album') or album
        result = {'title':title,'artist':artist,'album':album,'url':url(p)}
        if old.get('cover') and (ROOT / old['cover'].replace('%20',' ')).is_file():
            result['cover'] = old['cover']
        elif cover:
            result['cover'] = url(cover)
        tracks.append(result)
    # Keep original order and album grouping: numbered tracks sort by filename,
    # all songs from the same folder stay together.
    tracks.sort(key=lambda t: t['url'].casefold())
    return tracks


def image_catalog(meta):
    out=[]
    for p in files('art',{'.jpg','.jpeg','.png','.webp','.gif','.avif'}):
        old=metadata_for(meta,p)
        title,artist=split_name(p)
        out.append({'title':old.get('title') or title,'artist':old.get('artist') or artist,'url':url(p)})
    return out


def text_catalog(meta, directory):
    out=[]
    for p in files(directory,{'.txt'}):
        old=metadata_for(meta,p)
        title,artist=txt_header(p)
        out.append({'title':title or old.get('title','Untitled'), 'artist':artist or old.get('artist',''), 'url':url(p)})
    return out


def generate_video_thumbnail(video:Path, out:Path):
    if out.exists() and out.stat().st_mtime >= video.stat().st_mtime:
        return
    if subprocess.run(['bash','-c','command -v ffmpeg >/dev/null']).returncode != 0:
        return
    out.parent.mkdir(parents=True,exist_ok=True)
    proc=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','0.3','-i',str(video),
             '-frames:v','1','-vf','scale=640:-2:force_original_aspect_ratio=decrease',
             '-q:v','5',str(out)],capture_output=True,text=True)
    if proc.returncode != 0:
        print(f'Warning: cannot make thumbnail for {video.name}: {proc.stderr[:240]}',file=sys.stderr)
        out.unlink(missing_ok=True)


def video_catalog():
    out=[]
    for p in files('videos',{'.mp4','.webm'}):
        title,artist=split_name(p)
        chosen=None
        for ext in ('.webp','.jpg','.jpeg','.png'):
            same=p.with_suffix(ext)
            if same.is_file():
                chosen=same
                break
        if chosen is None:
            digest=hashlib.sha256(p.relative_to(ROOT).as_posix().encode()).hexdigest()[:14]
            generated=THUMB_DIR/(digest+'.jpg')
            generate_video_thumbnail(p,generated)
            if generated.is_file():
                chosen=generated
        item={'title':title,'artist':artist,'url':url(p)}
        if chosen:
            item['poster']=url(chosen)
        out.append(item)
    # Remove thumbnails for videos that have since been deleted.
    used={Path(__import__('urllib.parse',fromlist=['unquote']).unquote(x['poster'])).name for x in out if x.get('poster','').startswith('video-thumbnails/')}
    if THUMB_DIR.exists():
        for old in THUMB_DIR.glob('*.jpg'):
            if old.name not in used: old.unlink()
    return out


def render_zines():
    manifest=[]
    for p in files('zines',{'.pdf'}):
        title=pretty(p.stem)
        match=re.fullmatch(r'BR Alternative Zine (\d+) (.+)',title)
        if match: title=f'Baton Rouge Alternative — Zine {match.group(1)} · {match.group(2)}'
        digest=hashlib.sha256(p.relative_to(ROOT).as_posix().encode()).hexdigest()[:12]
        target=PREVIEW_DIR/digest
        target.mkdir(exist_ok=True,parents=True)
        # Only rerender if PDF newer than image or number of pages differs.
        with fitz.open(p) as doc:
            if doc.needs_pass:
                print('Skipping protected PDF:',p.name,file=sys.stderr)
                continue
            pages=[]
            for i in range(len(doc)):
                image_path=target/f'{i+1:03d}.webp'
                if not image_path.exists() or image_path.stat().st_mtime < p.stat().st_mtime:
                    page=doc.load_page(i)
                    # 130 dpi gives excellent zoom at normal desktop and phone widths.
                    pix=page.get_pixmap(matrix=fitz.Matrix(1.5,1.5),colorspace=fitz.csRGB,alpha=False)
                    image=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
                    image.save(image_path,format='WEBP',quality=85,method=4)
                pages.append(url(image_path))
        short=(f'Zine {match.group(1)} · {match.group(2)}' if match else title)
        manifest.append({'title':title,'label':short,'pdf':url(p),'pages':pages})
    # Latest issue appears first; older issues remain selectable.
    manifest.sort(key=lambda a:a['title'].casefold(), reverse=True)
    return manifest


def write_if_changed(p:Path, obj):
    s=json.dumps(obj,ensure_ascii=False,indent=2)+'\n'
    if not p.exists() or p.read_text(encoding='utf-8')!=s:
        p.write_text(s,encoding='utf-8')


def main():
    meta=load_meta()
    border=json.loads((ROOT/'border-presets.json').read_text())
    data={'music':music_catalog(meta),'art':image_catalog(meta),
          'poetry':text_catalog(meta,'poetry'),'articles':text_catalog(meta,'articles'),
          'videos':video_catalog(), 'border':border}
    write_if_changed(JSON,data)
    write_if_changed(ZINE_JSON,render_zines())
    print('Catalog updated:', *(f'{k}={len(v)}' for k,v in data.items()), f'zines={len(json.loads(ZINE_JSON.read_text()))}')

if __name__=='__main__':
    main()
