#!/usr/bin/env python
# SCRFD tang 1 — detect mat tren avatars raw kenh (H2DEV Batch F / PH1)
# Input : data-tabs/raw-kenh-mau.json records (fileName -> assets/raw-kenh/)
# Output: data/scrfd-hits.json  { schema, model, generatedAt, records:[{id,file,faces:[{box,score,kps}]}] }
# Chay: python scripts/scrfd_detect.py [--limit N]  (mac dinh FULL 156/156)
from __future__ import annotations
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import numpy as np
import onnxruntime as ort

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "models" / "scrfd" / "10g_bnkps.onnx"
RAW_JSON = ROOT / "data-tabs" / "raw-kenh-mau.json"
OUT_JSON = ROOT / "data" / "scrfd-hits.json"
IMG_DIR = ROOT / "assets" / "raw-kenh"

INPUT_SIZE = (640, 640)   # W, H (VGA chuan SCRFD)
CONF_THRESH = 0.5
NMS_IOU = 0.4
STRIDES = [8, 16, 32]
FMC = [2, 2, 2]           # feature map channels per stride (model 10g_bnkps RuteNL: 16800 anchors)

from PIL import Image  # noqa: E402


def letterbox(im: Image.Image):
    w, h = im.size
    tw, th = INPUT_SIZE
    scale = min(tw / w, th / h)
    nw, nh = int(round(w * scale)), int(round(h * scale))
    im2 = im.convert("RGB").resize((nw, nh))
    canvas = np.full((th, tw, 3), 114, dtype=np.uint8)
    ox, oy = (tw - nw) // 2, (th - nh) // 2
    canvas[oy:oy + nh, ox:ox + nw, :] = np.array(im2)
    return canvas, scale, ox, oy, w, h


def distance2bbox(points, distance):
    x1 = points[:, 0] - distance[:, 0]
    y1 = points[:, 1] - distance[:, 1]
    x2 = points[:, 0] + distance[:, 2]
    y2 = points[:, 1] + distance[:, 3]
    return np.stack([x1, y1, x2, y2], axis=1)


def nms(boxes, scores, iou):
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(boxes[i, 0], boxes[order[1:], 0])
        yy1 = np.maximum(boxes[i, 1], boxes[order[1:], 1])
        xx2 = np.minimum(boxes[i, 2], boxes[order[1:], 2])
        yy2 = np.minimum(boxes[i, 3], boxes[order[1:], 3])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        o = inter / (np.maximum(1e-9, (boxes[i, 2] - boxes[i, 0]) * (boxes[i, 3] - boxes[i, 1])
                                + (boxes[order[1:], 2] - boxes[order[1:], 0]) * (boxes[order[1:], 3] - boxes[order[1:], 1]) - inter))
        order = order[1:][o <= iou]
    return keep


def main():
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
    if not MODEL.exists():
        print("MISSING MODEL:", MODEL)
        sys.exit(2)

    sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
    iname = sess.get_inputs()[0].name
    out_names = [o.name for o in sess.get_outputs()]

    records = json.loads(RAW_JSON.read_text(encoding="utf-8"))["records"]
    if limit:
        records = records[:limit]

    heights = [INPUT_SIZE[1] // s for s in STRIDES]
    widths = [INPUT_SIZE[0] // s for s in STRIDES]
    anchor_centers, anchor_strides = [], []
    for h, w, s in zip(heights, widths, STRIDES):
        xs = np.arange(w)
        ys = np.arange(h)
        cx, cy = np.meshgrid(xs, ys)
        pts = np.stack([(cx + 0.5) * s, (cy + 0.5) * s], axis=-1).reshape(-1, 2)
        for _ in range(FMC[STRIDES.index(s)]):
            anchor_centers.append(pts)
            anchor_strides.append(np.full((pts.shape[0], 1), s, dtype=np.float32))
    anchor_centers = np.concatenate(anchor_centers, axis=0).astype(np.float32)
    anchor_strides = np.concatenate(anchor_strides, axis=0).astype(np.float32)

    out_records = []
    t0 = time.time()
    for idx, r in enumerate(records):
        fname = r.get("fileName") or ""
        img_path = IMG_DIR / fname
        rec = {"id": r.get("id"), "file": fname, "faces": []}
        if not fname or not img_path.exists():
            rec["error"] = "file-missing"
            out_records.append(rec)
            continue
        try:
            canvas, scale, ox, oy, ow, oh = letterbox(Image.open(img_path))
            blob = (canvas.astype(np.float32) - 127.5) / 128.0
            blob = blob.transpose(2, 0, 1)[np.newaxis, ...]
            outs = sess.run(out_names, {iname: blob})

            scores_list, bbox_list, kps_list = [], [], []
            for o in outs:
                o = np.asarray(o)
                if o.ndim == 3:
                    o = o.reshape(-1, o.shape[-1])
                c = o.shape[1] if o.ndim == 2 else o.shape[-1]
                if c == 1:
                    scores_list.append(o)
                elif c == 4:
                    bbox_list.append(o)
                elif c == 10:
                    kps_list.append(o)
            if not scores_list or not bbox_list:
                rec["error"] = "unexpected-output-shapes:" + ",".join(str(o.shape) for o in outs)
                out_records.append(rec)
                continue

            # Decode PER-BRANCH: moi score branch i <-> bbox branch i <-> stride STRIDES[i].
            # Anchors tung branch = pts fm (fmh x fmw) x stride, LAP reps lan (heads cung toa do).
            all_boxes, all_scores, all_kps = [], [], []
            for bi, s_branch in enumerate(scores_list):
                stride = STRIDES[bi] if bi < len(STRIDES) else STRIDES[-1]
                fmh, fmw = INPUT_SIZE[1] // stride, INPUT_SIZE[0] // stride
                xs = np.arange(fmw)
                ys = np.arange(fmh)
                cx, cy = np.meshgrid(xs, ys)
                pts = np.stack([(cx + 0.5) * stride, (cy + 0.5) * stride], axis=-1).reshape(-1, 2).astype(np.float32)
                n = s_branch.shape[0]
                reps = max(1, n // (fmh * fmw))
                anchors = np.tile(pts, (reps, 1))
                d = bbox_list[bi].reshape(-1, 4).astype(np.float32)
                boxes = distance2bbox(anchors, d * stride)
                sc = s_branch.reshape(-1)
                kps_b = None
                if bi < len(kps_list):
                    kk = kps_list[bi].reshape(-1, 10).astype(np.float32)
                    kps_b = anchors[:, np.newaxis, :] + (kk.reshape(-1, 5, 2) * stride)
                all_boxes.append(boxes)
                all_scores.append(sc)
                if kps_b is not None:
                    all_kps.append(kps_b)
            bboxes = np.concatenate(all_boxes, axis=0)
            scores = np.concatenate(all_scores, axis=0)
            kps_all = np.concatenate(all_kps, axis=0) if all_kps else None

            order = scores.argsort()[::-1]
            picked = order[scores[order] >= CONF_THRESH][:1000]
            if picked.size:
                keep = nms(bboxes[picked], scores[picked], NMS_IOU)
                picked = picked[keep]
            for i in picked:
                x1, y1, x2, y2 = bboxes[i]
                # ve toa do goc (bo letterbox offset + scale)
                fx1 = max(0.0, min(ow, (x1 - ox) / max(scale, 1e-9)))
                fy1 = max(0.0, min(oh, (y1 - oy) / max(scale, 1e-9)))
                fx2 = max(0.0, min(ow, (x2 - ox) / max(scale, 1e-9)))
                fy2 = max(0.0, min(oh, (y2 - oy) / max(scale, 1e-9)))
                face = {"box": [round(fx1, 1), round(fy1, 1), round(fx2, 1), round(fy2, 1)], "score": round(float(scores[i]), 4)}
                if kps_all is not None:
                    face["kps"] = [[round(float(px), 1), round(float(py), 1)] for px, py in kps_all[i]]
                rec["faces"].append(face)
        except Exception as e:  # noqa: BLE001
            rec["error"] = f"{type(e).__name__}: {e}"
        out_records.append(rec)
        if (idx + 1) % 40 == 0:
            print(f"  progress {idx + 1}/{len(records)}", flush=True)

    with_faces = sum(1 for r in out_records if r.get("faces"))
    out = {
        "schema": "h2dev.scrfd-hits.v1",
        "model": "scrfd_10g_bnkps (10g_bnkps.onnx, insightface SCRFD-10GF)",
        "confThresh": CONF_THRESH,
        "nmsIoU": NMS_IOU,
        "inputSize": list(INPUT_SIZE),
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "total": len(out_records),
        "withFaces": with_faces,
        "records": out_records,
    }
    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=1, default=float), encoding="utf-8")
    dt = time.time() - t0
    print(f"SCRFD DONE: {len(out_records)} anh | co mat: {with_faces} | thoi gian {dt:.1f}s | -> {OUT_JSON}")


if __name__ == "__main__":
    main()
