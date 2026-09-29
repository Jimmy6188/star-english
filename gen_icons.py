# -*- coding: utf-8 -*-
"""生成 PWA 图标（纯 Python，无第三方依赖）"""
import math
import struct
import zlib
import os

def make_png(size, path):
    px = [[None] * size for _ in range(size)]
    cx = cy = size / 2
    r_bg = size * 0.5

    def lerp(a, b, t):
        return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

    top = (28, 43, 94)      # 深空蓝
    bottom = (11, 16, 38)   # 近黑
    for y in range(size):
        for x in range(size):
            # 圆形底
            dx, dy = x - cx, y - cy
            d = math.hypot(dx, dy)
            if d > r_bg:
                px[y][x] = (0, 0, 0, 0)
                continue
            t = (y / size)
            c = lerp(top, bottom, t)
            a = 255
            edge = r_bg - 1.5
            if d > edge:
                a = int(255 * (r_bg - d) / 1.5)
            px[y][x] = (c[0], c[1], c[2], a)

    s = size / 64.0  # 以 64 为设计基准的缩放

    def put(x, y, col):
        xi, yi = int(x), int(y)
        if 0 <= xi < size and 0 <= yi < size and px[yi][xi] is not None:
            px[yi][xi] = col

    def fill_circle(x0, y0, r, col):
        for y in range(size):
            for x in range(size):
                if (x - x0) ** 2 + (y - y0) ** 2 <= r * r:
                    put(x, y, col)

    def fill_rect(x0, y0, w, h, col):
        for y in range(size):
            for x in range(size):
                if x0 <= x < x0 + w and y0 <= y < y0 + h:
                    put(x, y, col)

    def fill_tri(p1, p2, p3, col):
        def sign(a, b, c):
            return (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1])
        minx = max(0, int(min(p1[0], p2[0], p3[0])))
        maxx = min(size - 1, int(max(p1[0], p2[0], p3[0])))
        miny = max(0, int(min(p1[1], p2[1], p3[1])))
        maxy = min(size - 1, int(max(p1[1], p2[1], p3[1])))
        for y in range(miny, maxy + 1):
            for x in range(minx, maxx + 1):
                v = [sign((x, y), p1, p2), sign((x, y), p2, p3), sign((x, y), p3, p1)]
                if (v[0] >= 0 and v[1] >= 0 and v[2] >= 0) or (v[0] <= 0 and v[1] <= 0 and v[2] <= 0):
                    put(x, y, col)

    cyan = (79, 209, 255, 255)
    white = (234, 242, 255, 255)
    gold = (255, 209, 102, 255)
    magenta = (255, 107, 214, 255)
    dark = (16, 27, 51, 255)

    # 小火箭：机身（斜 45 度朝上）
    fill_circle(32 * s, 30 * s, 13 * s, white)           # 机身
    fill_circle(32 * s, 30 * s, 8.2 * s, dark)           # 舷窗框
    fill_circle(32 * s, 30 * s, 6 * s, cyan)             # 舷窗
    # 机头
    fill_tri((20 * s, 26 * s), (44 * s, 26 * s), (32 * s, 7 * s), white)
    # 尾翼
    fill_tri((17 * s, 36 * s), (27 * s, 44 * s), (13 * s, 51 * s), magenta)
    fill_tri((47 * s, 36 * s), (37 * s, 44 * s), (51 * s, 51 * s), magenta)
    # 火焰
    fill_tri((26 * s, 46 * s), (38 * s, 46 * s), (32 * s, 60 * s), gold)

    # 几颗星星
    stars = [(12, 14, 1.6), (52, 18, 1.3), (14, 50, 1.2), (55, 48, 1.7), (43, 55, 1.1)]
    for (sx, sy, sr) in stars:
        fill_circle(sx * s, sy * s, sr * s, white)

    raw = b''
    for y in range(size):
        raw += b'\x00' + b''.join(bytes(px[y][x]) for x in range(size))

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr)
           + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
    print('wrote', path)

os.makedirs(os.path.join(os.path.dirname(__file__), 'icons'), exist_ok=True)
base = os.path.dirname(__file__)
make_png(192, os.path.join(base, 'icons', 'icon-192.png'))
make_png(512, os.path.join(base, 'icons', 'icon-512.png'))
