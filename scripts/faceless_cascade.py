"""PH1 cascade 3 tang: SCRFD -> Chrominance/Geometry -> (ArcFace optional)
Giam false positive mat nguoi tren hoat hinh / 3D / cartoon.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

try:
    from PIL import Image
except Exception:
    Image = None


def chrominance_face_score(img) -> float:
    """0-1: cao = giong anh chup that (da thit, khong phang hoat hinh)."""
    if Image is None:
        return 0.5
    im = img.convert('RGB').resize((64, 64))
    px = list(im.getdata())
    skin = 0
    sat = 0
    for r, g, b in px:
        # YCrCb-ish skin gate
        if 60 <= r <= 255 and 40 <= g <= 200 and 20 <= b <= 170 and r > g > b and (r - b) > 15:
            skin += 1
        mx, mn = max(r, g, b), min(r, g, b)
        if mx > 0:
            sat += (mx - mn) / mx
    n = len(px) or 1
    skin_ratio = skin / n
    sat_mean = sat / n
    # hoat hinh thuong sat cao, skin that thap; anh that skin ~0.1-0.4, sat trung binh
    score = skin_ratio * 1.4 + (0.35 - abs(sat_mean - 0.28)) * 0.8
    return max(0.0, min(1.0, score))


def geometry_face_score(box, w, h) -> float:
    """Box mat hop ly (ty le, vi tri)."""
    if not box or w <= 0 or h <= 0:
        return 0.0
    x1, y1, x2, y2 = box[:4]
    bw, bh = max(1, x2 - x1), max(1, y2 - y1)
    ratio = bw / bh
    area = (bw * bh) / float(w * h)
    r_score = 1.0 - min(1.0, abs(ratio - 0.75) / 0.75)
    a_score = 1.0 if 0.01 <= area <= 0.45 else 0.2
    return max(0.0, min(1.0, 0.6 * r_score + 0.4 * a_score))


def is_true_face(scrfd_hits, image_path, min_score=0.45) -> dict:
    """Loc false positive SCRFD bang Chrominance + Geometry (tang 2).
    Tang 3 ArcFace: can insightface embedding — neu co thi gan vao day.
    """
    if Image is None:
        return {"kept": len(scrfd_hits), "filtered": 0, "reason": "PIL missing, skip cascade"}
    try:
        im = Image.open(image_path)
    except Exception as e:
        return {"kept": len(scrfd_hits), "filtered": 0, "reason": f"open fail {e}"}
    w, h = im.size
    ch = chrominance_face_score(im)
    kept = []
    filtered = []
    for hit in scrfd_hits:
        g = geometry_face_score(hit.get("box") or hit.get("bbox"), w, h)
        score = 0.55 * ch + 0.45 * g
        rec = {"box": hit.get("box") or hit.get("bbox"), "score": round(score, 3), "chrom": round(ch, 3), "geo": round(g, 3)}
        if score >= min_score:
            kept.append(rec)
        else:
            filtered.append(rec)
    return {
        "kept": len(kept),
        "filtered": len(filtered),
        "chrominance": round(ch, 3),
        "kept_boxes": kept,
        "filtered_boxes": filtered,
        "note": "Tang 2 Chrominance+Geometry. Tang 3 ArcFace chua noi."
    }


if __name__ == "__main__":
    # CLI: python faceless_cascade.py <image> <hits.json>
    if len(sys.argv) >= 3:
        img = sys.argv[1]
        hits = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
        if isinstance(hits, dict):
            hits = hits.get("faces") or hits.get("hits") or []
        print(json.dumps(is_true_face(hits, img), ensure_ascii=False, indent=2))
    else:
        print("usage: faceless_cascade.py <image> <hits.json>")
