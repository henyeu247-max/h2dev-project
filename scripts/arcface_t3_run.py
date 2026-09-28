#!/usr/bin/env python
# Tang 3 ArcFace — xac nhan box la "mat nguoi that" bang embedding so voi gallery.
# Gallery khach quan: top-20 box kept T2 co chrominance >= 0.5 (da thit that) + SCRFD score cao.
# Dau ra: data/cascade-t3-report.json (phan bo similarity + kept theo nguong 0.2/0.3/0.4)
# Chay: python scripts/arcface_t3_run.py
from __future__ import annotations
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "models" / "arcface" / "w600k_mbf.onnx"
HITS = ROOT / "data" / "scrfd-hits.json"
T2 = ROOT / "data" / "cascade-t2-report.json"
IMG_DIR = ROOT / "assets" / "raw-kenh"
OUT = ROOT / "data" / "cascade-t3-report.json"
STATUS = ROOT / "data" / "phan-he-status.json"

GALLERY_SIZE = 20
GALLERY_CHROM_MIN = 0.5
THRESHOLDS = [0.2, 0.3, 0.4]


def crop_face(img, box, margin=0.2):
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    if w <= 2 or h <= 2:
        return None
    mx, my = w * margin, h * margin
    l, t = max(0, int(x1 - mx)), max(0, int(y1 - my))
    r, b = min(img.width, int(x2 + mx)), min(img.height, int(y2 + my))
    if r - l < 4 or b - t < 4:
        return None
    return img.crop((l, t, r, b)).resize((112, 112))


def embed(sess, iname, im112):
    x = (np.asarray(im112, dtype=np.float32) - 127.5) / 127.5
    x = x.transpose(2, 0, 1)[np.newaxis, ...]
    v = sess.run(None, {iname: x})[0].reshape(-1)
    n = np.linalg.norm(v)
    return v / (n or 1.0)


def main():
    hits_all = json.loads(HITS.read_text(encoding="utf-8"))["records"]
    t2 = {r["id"]: r for r in json.loads(T2.read_text(encoding="utf-8"))["results"]}
    sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
    iname = sess.get_inputs()[0].name

    # Thu thap boxes kept T2 (cascade report khong luu box — dung T2 minScore logic lai qua chrominance kept flag)
    candidates = []  # (id, file, box, scrfdScore, chrom)
    for r in hits_all:
        t2r = t2.get(r["id"])
        if not t2r or t2r.get("kept", 0) <= 0:
            continue
        chrom = t2r.get("chrominance")
        faces = r.get("faces") or []
        if not faces:
            continue
        top = max(faces, key=lambda f: f["score"])
        candidates.append({"id": r["id"], "file": r["file"], "box": top["box"],
                           "score": top["score"], "chrom": chrom})

    # Gallery: chrom cao + scrfd score cao
    good = [c for c in candidates if c["chrom"] is not None and c["chrom"] >= GALLERY_CHROM_MIN]
    good.sort(key=lambda c: -c["score"])
    gallery = good[:GALLERY_SIZE]
    print(f"gallery: {len(gallery)}/{len(candidates)} boxes (chrom >= {GALLERY_CHROM_MIN})")

    img_cache = {}
    def load_img(f):
        if f not in img_cache:
            p = IMG_DIR / f
            img_cache[f] = Image.open(p).convert("RGB") if p.exists() else None
        return img_cache[f]

    def box_embed(c):
        img = load_img(c["file"])
        if img is None:
            return None
        crop = crop_face(img, c["box"])
        if crop is None:
            return None
        return embed(sess, iname, crop)

    gal_vecs = []
    for c in gallery:
        v = box_embed(c)
        if v is not None:
            gal_vecs.append(v)
    if not gal_vecs:
        print("gallery rong — dung lai")
        sys.exit(2)
    centroid = np.mean(np.stack(gal_vecs), axis=0)
    centroid = centroid / (np.linalg.norm(centroid) or 1.0)
    print(f"gallery embeddings: {len(gal_vecs)}")

    # Tat ca boxes kept T2 → embedding → cosine voi centroid
    sims = []
    per_image = []
    t0 = time.time()
    for r in hits_all:
        t2r = t2.get(r["id"])
        if not t2r or t2r.get("kept", 0) <= 0:
            continue
        img = load_img(r["file"])
        if img is None:
            continue
        faces = r.get("faces") or []
        top = max(faces, key=lambda f: f["score"]) if faces else None
        if top is None:
            continue
        v = box_embed({"file": r["file"], "box": top["box"]})
        if v is None:
            continue
        sim = float(np.dot(v, centroid))
        sims.append(sim)
        per_image.append({"id": r["id"], "sim": round(sim, 4), "scrfdScore": top["score"], "chrom": t2r.get("chrominance")})
    sims_arr = np.array(sims) if sims else np.array([0.0])

    kept_by = {}
    for t in THRESHOLDS:
        kept_by[str(t)] = int((sims_arr >= t).sum())

    report = {
        "schema": "h2dev.cascade-t3.v1",
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "model": "w600k_mbf.onnx (ArcFace MobileFace, 512d, input 112x112)",
        "gallery": {"size": len(gal_vecs), "chromMin": GALLERY_CHROM_MIN, "source": "top SCRFD-score kept-T2 boxes"},
        "boxesEvaluated": int(sims_arr.size),
        "similarity": {
            "min": round(float(sims_arr.min()), 4),
            "p25": round(float(np.percentile(sims_arr, 25)), 4),
            "median": round(float(np.median(sims_arr)), 4),
            "p75": round(float(np.percentile(sims_arr, 75)), 4),
            "max": round(float(sims_arr.max()), 4),
        },
        "keptByThreshold": kept_by,
        "results": per_image,
        "note": "Tang 3 ArcFace noi — so embedding box voi centroid gallery nguoi that (chrom cao).",
    }
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=1, default=float), encoding="utf-8")

    if STATUS.exists():
        st = json.loads(STATUS.read_text(encoding="utf-8"))
        ph1 = st.get("PH1") or {}
        ph1["missing"] = []
        ph1["note"] = "Cascade 3 tang DA NOI (29/09): SCRFD t1 + Chrom/Geo t2 + ArcFace t3 (gallery centroid). Doc data/cascade-t3-report.json de chon nguong van hanh."
        st["PH1"] = ph1
        STATUS.write_text(json.dumps(st, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"ARCFACE T3 DONE: {sims_arr.size} boxes | sim {report['similarity']['min']}..{report['similarity']['max']} "
          f"| kept@0.2={kept_by['0.2']} @0.3={kept_by['0.3']} @0.4={kept_by['0.4']} | time={time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
