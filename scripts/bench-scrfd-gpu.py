# -*- coding: utf-8 -*-
"""
benchmark_scrfd_gpu.py  (v2 - with DLL path setup)
====================================================
DO THUC TE hieu nang SCRFD tren RTX 4060.
Tu dong them CUDA bin/x64 + cuDNN bin vao PATH truoc khi import onnxruntime.
"""
import os
import sys
import time

# --- Setup DLL paths BEFORE importing onnxruntime ---
CUDA_BIN = r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.1\bin\x64"
VENV = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUDNN_BIN = os.path.join(VENV, '.venv-gpu', 'Lib', 'site-packages', 'nvidia', 'cudnn', 'bin')

for p in [CUDA_BIN, CUDNN_BIN]:
    if os.path.isdir(p):
        os.add_dll_directory(p)
        os.environ['PATH'] = p + os.pathsep + os.environ.get('PATH', '')
        print(f'[PATH] Added: {p}')
    else:
        print(f'[PATH] MISSING: {p}')

import numpy as np

print('=' * 62)
print('  BENCHMARK SCRFD TREN RTX 4060 - SO DO THUC TE (v2)')
print('=' * 62)

import onnxruntime as ort
print(f'[1] onnxruntime: {ort.__version__}')

t0 = time.time()
from insightface.app import FaceAnalysis
print(f'[2] Import FaceAnalysis OK ({(time.time()-t0)*1000:.0f}ms)')
print(f'[3] Providers: {ort.get_available_providers()}')

t0 = time.time()
app = FaceAnalysis(
    name='buffalo_sc',
    providers=['CUDAExecutionProvider', 'CPUExecutionProvider'],
    allowed_modules=['detection']
)
app.prepare(ctx_id=0, det_size=(640, 640))
load_ms = (time.time() - t0) * 1000
print(f'[4] Model loaded (SCRFD) in {load_ms:.0f}ms')

session = app.models.get('detection')
actual = session.session.get_providers() if session else ['unknown']
print(f'[5] ACTUAL provider: {actual[0]}')

# Test images
img_640 = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
img_360 = np.random.randint(0, 255, (360, 640, 3), dtype=np.uint8)

# Warmup
print('[6] Warming up (20 runs)...')
for _ in range(20):
    _ = app.get(img_640)

# Benchmark 640x640
print('[7] Benchmark 640x640 (200 runs)...')
N = 200
t0 = time.time()
for _ in range(N):
    _ = app.get(img_640)
dt_640 = (time.time() - t0) / N * 1000
fps_640 = 1000 / dt_640
print(f'    Latency: {dt_640:.2f} ms/image | Throughput: {fps_640:.1f} images/sec')

# Benchmark 640x360
print('[8] Benchmark 640x360 (200 runs)...')
t0 = time.time()
for _ in range(N):
    _ = app.get(img_360)
dt_360 = (time.time() - t0) / N * 1000
fps_360 = 1000 / dt_360
print(f'    Latency: {dt_360:.2f} ms/image | Throughput: {fps_360:.1f} images/sec')

# VRAM
print('[9] VRAM:')
import subprocess
try:
    out = subprocess.run(
        ['nvidia-smi', '--query-gpu=memory.used,memory.total', '--format=csv,noheader,nounits'],
        capture_output=True, text=True, timeout=10)
    print(f'    nvidia-smi: {out.stdout.strip()} MiB')
except Exception as e:
    print(f'    err: {e}')

print()
print('=' * 62)
print('  SO SANH: DE XUAT GOC vs DO THUC TE')
print('=' * 62)
print(f'  De xuat goc:  ~1.5 ms/anh  |  >600 anh/s  |  ~480 MB VRAM')
print(f'  DO THUC TE:   {dt_640:.2f} ms/anh |  {fps_640:.0f} anh/s @ 640x640')
print(f'                {dt_360:.2f} ms/anh |  {fps_360:.0f} anh/s @ 640x360')
print('=' * 62)
