#!/usr/bin/env python3
"""Build a NotebookLM batch folder from archived channel (urls + optional merged txt)."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

HUB = Path(__file__).resolve().parents[1]
CHANNELS = HUB / "channels"
BATCHES = HUB / "batches"
INDEX = HUB / "notebooks-index.md"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--channel", required=True, help="channel_id folder under channels/")
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--name", required=True, help="batch name e.g. wildlife-top50")
    ap.add_argument("--offset", type=int, default=0)
    args = ap.parse_args()

    ch = CHANNELS / args.channel
    meta_path = ch / "meta.json"
    if not meta_path.exists():
        raise SystemExit(f"missing {meta_path} — run archive_yt_channel.py first")
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    videos = meta.get("videos") or []
    slice_ = videos[args.offset : args.offset + args.limit]
    batch_dir = BATCHES / args.name
    batch_dir.mkdir(parents=True, exist_ok=True)
    urls = [v["url"] for v in slice_ if v.get("url")]
    (batch_dir / "urls.txt").write_text("\n".join(urls) + "\n", encoding="utf-8")
    # merge transcripts for offline PDF path (optional deep dump)
    parts = []
    for v in slice_:
        tfile = ch / "videos" / v["id"] / "transcript.txt"
        if tfile.exists():
            parts.append(f"# {v.get('title')}\nURL: {v.get('url')}\n\n{tfile.read_text(encoding='utf-8')}\n")
    if parts:
        (batch_dir / "transcripts_merged.md").write_text("\n---\n".join(parts), encoding="utf-8")
    manifest = {
        "name": args.name,
        "channel_id": args.channel,
        "channel_name": meta.get("channel_name"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "offset": args.offset,
        "limit": args.limit,
        "count": len(urls),
        "notebooklm_hint": {
            "title": f"YTB | {meta.get('channel_name')} | {args.name}",
            "add": "Paste urls.txt into NotebookLM sources (or upload transcripts_merged.md if too many links)",
            "pro_source_cap": 300,
            "recommended_batch": "80-150 for quality",
        },
        "urls": urls,
        "video_ids": [v["id"] for v in slice_],
    }
    (batch_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    # index line
    line = (
        f"| {args.name} | {meta.get('channel_name')} | {len(urls)} | "
        f"`batches/{args.name}` |  | {manifest['created_at'][:10]} |\n"
    )
    if not INDEX.exists():
        INDEX.write_text(
            "# NotebookLM batches index\n\n"
            "| batch | channel | sources | path | notebook_url | date |\n"
            "|---|---|---|---|---|---|\n",
            encoding="utf-8",
        )
    with INDEX.open("a", encoding="utf-8") as f:
        f.write(line)
    print(f"OK batch={batch_dir} sources={len(urls)}")
    print("Next: open NotebookLM → new notebook → add URLs from urls.txt")


if __name__ == "__main__":
    main()
