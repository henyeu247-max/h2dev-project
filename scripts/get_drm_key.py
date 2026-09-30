# H2DEV Project - Widevine L3 DRM Key Resolver
# Chuyên dụng giải mã luồng video/audio bảo vệ bản quyền DRM từ máy chủ Mona Cloud / EZDRM
import sys
from pathlib import Path
import requests
from pywidevine.cdm import Cdm
from pywidevine.device import Device
from pywidevine.pssh import PSSH

def get_key(pssh_b64, license_url):
    wvd_path = Path(__file__).resolve().parent.parent / "_tools" / "cdm" / "device.wvd"
    if not wvd_path.exists():
        raise FileNotFoundError(f"Device WVD not found at {wvd_path}")
    
    device = Device.load(wvd_path)
    cdm = Cdm.from_device(device)
    session_id = cdm.open()
    challenge = cdm.get_license_challenge(session_id, PSSH(pssh_b64))

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://video.mona-cloud.com",
        "Referer": "https://video.mona-cloud.com/"
    }
    res = requests.post(license_url, data=challenge, headers=headers, timeout=15)
    if res.status_code != 200:
        raise RuntimeError(f"License server returned status {res.status_code}: {res.text[:200]}")
    
    cdm.parse_license(session_id, res.content)
    for k in cdm.get_keys(session_id):
        if k.type == 'CONTENT':
            return f"{k.kid.hex}:{k.key.hex()}"
    raise RuntimeError("No CONTENT key found in license response")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: py -3 get_drm_key.py <PSSH_B64> <LICENSE_URL>")
        sys.exit(1)
    print(get_key(sys.argv[1], sys.argv[2]))
