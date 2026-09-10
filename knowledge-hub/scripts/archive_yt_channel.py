#!/usr/bin/env python3
"""Archive YouTube channel metadata + transcripts to local knowledge-hub (durable)."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HUB = Path(__file__).resolve().parents[1]
CHANNELS = HUB / "channels"
YT_DLP = r"D:\Hermes-Work\venvs\hermes-work\Scripts\yt-dlp.exe"


def run(cmd: list[str], timeout: int = 600) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, encoding="utf-8", errors="replace")


def safe_id(s: str) -> str:
    return re.sub(r"[^\w\-]+", "_", s)[:80]


def archive_channel(channel_url: str, max_videos: int, skip_transcript: bool) -> Path:
    CHANNELS.mkdir(parents=True, exist_ok=True)
    # Resolve channel + flat playlist
    cmd = [
        YT_DLP,
        "--flat-playlist",
        "--dump-single-json",
        "--playlist-end",
        str(max_videos),
        channel_url,
    ]
    print("fetch playlist...", channel_url)
    p = run(cmd, timeout=300)
    if p.returncode != 0:
        print(p.stderr[:800], file=sys.stderr)
        raise SystemExit(f"yt-dlp failed: {p.returncode}")
    data = json.loads(p.stdout)
    ch_id = data.get("channel_id") or data.get("id") or safe_id(channel_url)
    ch_name = data.get("channel") or data.get("uploader") or ch_id
    out = CHANNELS / ch_id
    out.mkdir(parents=True, exist_ok=True)
    entries = data.get("entries") or []
    meta = {
        "channel_id": ch_id,
        "channel_name": ch_name,
        "channel_url": channel_url,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "video_count_fetched": len(entries),
        "videos": [],
    }
    for e in entries:
        if not e:
            continue
        vid = e.get("id")
        if not vid:
            continue
        title = e.get("title") or ""
        url = e.get("url") or e.get("webpage_url") or f"https://www.youtube.com/watch?v={vid}"
        if url and not str(url).startswith("http"):
            url = f"https://www.youtube.com/watch?v={vid}"
        vdir = out / "videos" / vid
        vdir.mkdir(parents=True, exist_ok=True)
        vmeta = {
            "id": vid,
            "title": title,
            "url": url,
            "duration": e.get("duration"),
            "upload_date": e.get("upload_date"),
            "view_count": e.get("view_count"),
        }
        (vdir / "meta.json").write_text(json.dumps(vmeta, ensure_ascii=False, indent=2), encoding="utf-8")
        tpath = vdir / "transcript.txt"
        if not skip_transcript and not tpath.exists():
            print("  transcript", vid, title[:50])
            # write auto subs to vdir
            scmd = [
                YT_DLP,
                "--skip-download",
                "--write-auto-sub",
                "--sub-lang",
                "en.*,vi.*,ja.*,ko.*,zh.*",
                "--sub-format",
                "vtt/best",
                "--convert-subs",
                "srt",
                "-o",
                str(vdir / "%(id)s.%(ext)s"),
                url,
            ]
            sp = run(scmd, timeout=180)
            # collect srt/vtt text
            texts = []
            for f in sorted(vdir.glob("*.srt")) + sorted(vdir.glob("*.vtt")):
                raw = f.read_text(encoding="utf-8", errors="replace")
                # strip timestamps roughly
                lines = []
                for line in raw.splitlines():
                    if re.match(r"^\d+$", line.strip()):
                        continue
                    if re.match(r"^\d{2}:\d{2}", line.strip()):
                        continue
                    if line.strip() in ("WEBVTT", "") or line.startswith("NOTE"):
                        continue
                    if "-->" in line:
                        continue
                    lines.append(line.strip())
                texts.append("\n".join(x for x in lines if x))
            if texts:
                tpath.write_text("\n\n".join(texts), encoding="utf-8")
                vmeta["transcript"] = str(tpath.relative_to(out))
            else:
                vmeta["transcript"] = None
                if sp.returncode != 0:
                    vmeta["transcript_error"] = (sp.stderr or "")[:300]
            (vdir / "meta.json").write_text(json.dumps(vmeta, ensure_ascii=False, indent=2), encoding="utf-8")
        meta["videos"].append(vmeta)
    (out / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    # urls list convenience
    urls = [v["url"] for v in meta["videos"] if v.get("url")]
    (out / "urls.txt").write_text("\n".join(urls) + "\n", encoding="utf-8")
    print(f"OK channel={ch_id} videos={len(urls)} -> {out}")
    return out


def main():
    ap = argparse.ArgumentParser(description="Archive YT channel to knowledge-hub")
    ap.add_argument("--channel-url", required=True, help="Channel or @handle or /videos URL")
    ap.add_argument("--max", type=int, default=30, help="Max videos (default 30)")
    ap.add_argument("--skip-transcript", action="store_true")
    args = ap.parse_args()
    if not Path(YT_DLP).exists():
        print("yt-dlp not found:", YT_DLP, file=sys.stderr)
        sys.exit(2)
    archive_channel(args.channel_url, args.max, args.skip_transcript)


if __name__ == "__main__":
    main()
