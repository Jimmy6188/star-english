# -*- coding: utf-8 -*-
"""
星际求知号 - 场景词卡插画批量生成（开发用，不参与网页运行）

用 Agnes Image（agnes-image-2.5-flash，apihub.agnes-ai.com）按 tools/scene-prompts.md
的 prompt 批量生成 12 张无文字场景插画，转 JPG 存 assets/scenes/<id>.jpg。

前置：
  1) agnes-image 技能已装：~/.claude/skills/agnes-image/.env 里有 AGNES_API_KEY
  2) pip install --user pillow requests

用法：
  python tools/gen-scene-images.py            # 只产缺失的图
  python tools/gen-scene-images.py --force    # 全部重产
  python tools/gen-scene-images.py --only sc01,sc05   # 只产指定场景
  python tools/gen-scene-images.py --seed 42  # 固定种子（可复现）

prompt 与 tools/scene-prompts.md 同步维护；改这里时同步改那边（反之亦然）。
"""
import argparse
import os
import sys
import time
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "scenes"
ENV_FILE = Path.home() / ".claude" / "skills" / "agnes-image" / ".env"

API_BASE = "https://apihub.agnes-ai.com/v1"
MODEL = "agnes-image-2.5-flash"
ENDPOINT = f"{API_BASE}/images/generations"

STYLE = ("Flat children's picture book illustration, bright cheerful colors, soft rounded shapes, "
         "daylight, clean composition, ABSOLUTELY NO TEXT, no letters, no words, no labels, no signs. ")

SCENES = [
    ("sc01", "A cheerful farm meadow with green grass and a small pond. A cat, a dog, a rabbit and a horse standing on the grass, a little bird flying in the sky, a fish jumping out of the pond."),
    ("sc02", "A wooden table with fresh fruits: an apple, a banana, an orange, a pear and a mango arranged on the table, a bunch of purple grapes hanging above. Warm kitchen background."),
    ("sc03", "A study desk seen from the front: an open book, a pencil, a ruler, an eraser and a pen lying neatly on the desk, a school backpack leaning against the desk."),
    ("sc04", "An open wooden wardrobe: a shirt, a dress, a coat and a sweater hanging on hangers in the upper row, a pair of trousers and a hat on the shelf below. Cozy bedroom light."),
    ("sc05", "A big window showing the sky with different weather at once: bright sun, a white cloud, falling rain, a thunderstorm, snowflakes drifting, and swirling wind lines."),
    ("sc06", "A cozy children's bedroom: a bed, a sofa, an open door, a window on the wall, a wall clock and a table lamp on a nightstand."),
    ("sc07", "A friendly little town street with six working people: a doctor with a first-aid kit, a teacher with a book, a farmer with a straw hat holding vegetables, a nurse, a taxi driver standing by a small taxi, and a police officer."),
    ("sc08", "A family dinner table: a birthday cake in the middle, and on the table a bowl of rice, a fried egg, a glass of milk, a glass of juice and a loaf of bread."),
    ("sc09", "A cozy playroom corner: a kite flying near the ceiling, a gift box on a shelf, and on the floor a ball, a teddy bear toy, a Russian nesting doll and a toy robot."),
    ("sc10", "A warm family photo scene in a living room: grandfather and grandmother sitting on a sofa, father and mother standing behind them, a little boy and a little girl playing on the carpet in front."),
    ("sc11", "Five balloons of different colors floating in a bright room: a red balloon, a blue balloon, a yellow balloon, a green balloon and a pink balloon in a row near the ceiling, one black balloon lower down. Party decorations in background."),
    ("sc12", "A cute friendly robot standing in the center, big and clear, with clearly visible eyes, ears, nose, mouth, hands and feet, so each body part can be pointed at. Simple background.")
]


def load_key():
    if not ENV_FILE.exists():
        sys.exit(f"✗ 未找到 {ENV_FILE}，先配置 AGNES_API_KEY")
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("AGNES_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit(f"✗ {ENV_FILE} 里没有 AGNES_API_KEY")


def generate(prompt, key, seed=None, timeout=180):
    resp = requests.post(
        ENDPOINT,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={
            "model": MODEL,
            "prompt": prompt,
            "size": "1K",
            "ratio": "16:9",
            "seed": seed,
            "extra_body": {"response_format": "url"}
        },
        timeout=timeout,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"API {resp.status_code}: {resp.text[:200]}")
    data = resp.json()
    url = (data.get("data") or [{}])[0].get("url")
    if not url:
        raise RuntimeError(f"响应里没有图片 URL: {str(data)[:200]}")
    img = requests.get(url, timeout=120)
    img.raise_for_status()
    return img.content


def to_jpg(png_bytes, out_path):
    """PNG → JPG（RGB、质量 87），控制在 250KB 内，失败逐级降质量。"""
    import io
    im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    for q in (87, 80, 72, 64):
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=q, optimize=True)
        if buf.tell() <= 250 * 1024 or q == 64:
            out_path.write_bytes(buf.getvalue())
            return im.size, buf.tell(), q
    return im.size, buf.tell(), q


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="已存在的图也重产")
    ap.add_argument("--only", help="只产指定场景，逗号分隔，如 sc01,sc05")
    ap.add_argument("--seed", type=int, default=None, help="固定随机种子（可复现）")
    args = ap.parse_args()

    key = load_key()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    todo = SCENES if not args.only else [s for s in SCENES if s[0] in args.only.split(",")]

    ok, skip, fail = 0, 0, 0
    for sid, body in todo:
        out = OUT_DIR / f"{sid}.jpg"
        if out.exists() and not args.force:
            print(f"↷ {sid}.jpg 已存在，跳过（--force 重产）")
            skip += 1
            continue
        prompt = STYLE + body
        try:
            t0 = time.time()
            png = generate(prompt, key, seed=args.seed)
            size, nbytes, q = to_jpg(png, out)
            kb = nbytes / 1024
            flag = "✓" if kb <= 250 else "⚠超250KB"
            print(f"✓ {sid}.jpg {size[0]}x{size[1]} {kb:.0f}KB (q{q}) {time.time()-t0:.0f}s {flag}")
            ok += 1
        except Exception as e:
            print(f"✗ {sid} 失败：{e}")
            fail += 1
        time.sleep(1)  # 温和限速

    print(f"\n完成：成功 {ok} · 跳过 {skip} · 失败 {fail}")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
