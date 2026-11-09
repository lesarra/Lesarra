"""Render a 10-second anime-style clip: a chubby hero jogs through falling
cherry blossoms at sunset, then stops for a big bite of a steamed bun."""
import math, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, S = 1280, 720, 2          # output size, supersample factor
FPS, SECONDS = 24, 10
N = FPS * SECONDS
OUT = sys.argv[1] if len(sys.argv) > 1 else "chubby_anime.mp4"
random.seed(7)

def sc(*v): return [x * S for x in v]
def lerp(a, b, t): return a + (b - a) * t
def lerpc(a, b, t): return tuple(int(lerp(x, y, t)) for x, y in zip(a, b))
def ease(t): t = max(0, min(1, t)); return t * t * (3 - 2 * t)

# ---------- static background layers ----------
def sky():
    img = Image.new("RGB", (W * S, H * S))
    d = ImageDraw.Draw(img)
    stops = [(0, (255, 140, 120)), (0.45, (255, 196, 150)), (0.75, (255, 226, 190)), (1, (255, 236, 210))]
    for y in range(H * S):
        t = y / (H * S)
        for i in range(len(stops) - 1):
            if stops[i][0] <= t <= stops[i + 1][0]:
                k = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0])
                d.line([(0, y), (W * S, y)], fill=lerpc(stops[i][1], stops[i + 1][1], k))
                break
    # sun with glow
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    for r, a in [(260, 40), (190, 70), (130, 255)]:
        g.ellipse(sc(940 - r / 2, 330 - r / 2, 940 + r / 2, 330 + r / 2), fill=(255, 245, 220, a))
    glow = glow.filter(ImageFilter.GaussianBlur(20 * S))
    img.paste(glow, (0, 0), glow)
    return img

def mountains(width):
    layer = Image.new("RGBA", (width, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    pts = [(0, H * S)]
    for x in range(0, width + 1, 40 * S):
        y = (430 + 40 * math.sin(x / (230 * S)) + 25 * math.sin(x / (97 * S))) * S
        pts.append((x, y))
    pts.append((width, H * S))
    d.polygon(pts, fill=(214, 140, 160, 255))
    return layer

def tree(d, x, base, s):
    d.rectangle([x - 10 * s, base - 120 * s, x + 10 * s, base], fill=(110, 70, 70))
    d.line([x, base - 90 * s, x - 45 * s, base - 150 * s], fill=(110, 70, 70), width=int(8 * s))
    d.line([x, base - 100 * s, x + 40 * s, base - 160 * s], fill=(110, 70, 70), width=int(8 * s))
    rnd = random.Random(int(x))
    for _ in range(14):
        cx = x + rnd.uniform(-95, 95) * s
        cy = base - 170 * s + rnd.uniform(-60, 45) * s
        r = rnd.uniform(38, 62) * s
        col = rnd.choice([(255, 183, 206), (255, 160, 190), (255, 205, 222), (248, 150, 185)])
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)

def trees(width):
    layer = Image.new("RGBA", (width, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for x in range(150 * S, width, 380 * S):
        tree(d, x, 560 * S, S)
    return layer

def ground(width):
    layer = Image.new("RGBA", (width, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rectangle([0, 555 * S, width, H * S], fill=(196, 160, 140))
    d.rectangle([0, 555 * S, width, 568 * S], fill=(150, 200, 120))
    for x in range(0, width, 120 * S):
        d.rectangle([x, 620 * S, x + 70 * S, 630 * S], fill=(178, 142, 124))
    return layer

TILE = W * S * 2
SKY, MTN, TREES, GROUND = sky(), mountains(TILE), trees(TILE), ground(TILE)

def scroll(canvas, layer, offset):
    o = int(offset) % TILE
    canvas.alpha_composite(layer.crop((o, 0, o + W * S, H * S)) if o + W * S <= TILE else
                           _wrap(layer, o))

def _wrap(layer, o):
    a = layer.crop((o, 0, TILE, H * S))
    b = layer.crop((0, 0, W * S - (TILE - o), H * S))
    out = Image.new("RGBA", (W * S, H * S))
    out.paste(a, (0, 0)); out.paste(b, (TILE - o, 0))
    return out

PETALS = [dict(x=random.uniform(0, W), y=random.uniform(-H, H), v=random.uniform(40, 90),
               sway=random.uniform(0, 6.28), r=random.uniform(5, 10)) for _ in range(70)]

# ---------- character ----------
OUT_C = (60, 35, 40)
SKIN, BLUSH, SHIRT, PANTS, HAIR = (255, 222, 196), (255, 150, 160), (90, 170, 230), (70, 80, 130), (255, 140, 50)

def ell(d, cx, cy, rx, ry, fill, w=5):
    d.ellipse(sc(cx - rx, cy - ry, cx + rx, cy + ry), fill=fill, outline=OUT_C, width=w * S)

def character(d, t, run, bite, chew):
    cx = 560
    bounce = abs(math.sin(t * 9)) * 18 * run
    squash = 1 + 0.06 * math.sin(t * 18) * run
    base = 555
    # legs
    for side, ph in [(-1, 0), (1, math.pi)]:
        swing = math.sin(t * 9 + ph) * 28 * run
        lx = cx + side * 38 + swing
        d.line(sc(cx + side * 38, base - 70 - bounce, lx, base - 8), fill=OUT_C, width=36 * S)
        d.line(sc(cx + side * 38, base - 70 - bounce, lx, base - 8), fill=PANTS, width=26 * S)
        ell(d, lx + 10, base - 6, 26, 13, (240, 240, 245))
    by = base - 165 - bounce
    # body (big round tummy)
    ell(d, cx, by, 118 * squash, 112 / squash, SHIRT, 6)
    ell(d, cx + 10, by + 22, 78 * squash, 66 / squash, (130, 195, 240), 0)
    d.ellipse(sc(cx + 4, by + 30, cx + 16, by + 42), fill=OUT_C)  # belly button
    # back arm
    sw = math.sin(t * 9) * 25 * run
    ell(d, cx - 112, by - 5 + sw, 30, 42, SKIN)
    # head
    hy = by - 150 - bounce * 0.3
    # hair back
    d.ellipse(sc(cx - 120, hy - 115, cx + 120, hy + 95), fill=HAIR, outline=OUT_C, width=5 * S)
    ell(d, cx, hy, 112, 100, SKIN, 6)
    # cheeks puff while chewing
    puff = 8 * chew
    ell(d, cx - 78, hy + 40, 34 + puff, 28 + puff, SKIN, 0)
    ell(d, cx + 78, hy + 40, 34 + puff, 28 + puff, SKIN, 0)
    d.ellipse(sc(cx - 100, hy + 28, cx - 58, hy + 52), fill=BLUSH)
    d.ellipse(sc(cx + 58, hy + 28, cx + 100, hy + 52), fill=BLUSH)
    # hair cap with jagged bangs and spikes on top
    pts = []
    for i in range(0, 181, 10):              # top arc, left -> right
        a = math.radians(180 + i)
        r = 1 + 0.10 * (i % 30 == 0 and 0 < i < 180)
        pts.append((cx + math.cos(a) * 122 * r, hy - 10 + math.sin(a) * 118 * r))
    bangs = [(118, 20), (95, -30), (75, 5), (50, -38), (25, -5), (0, -42), (-25, -8),
             (-50, -40), (-75, 0), (-95, -32), (-118, 20)]
    pts += [(cx + x, hy + y) for x, y in bangs]
    d.polygon([tuple(sc(x, y)) for x, y in pts], fill=HAIR, outline=OUT_C, width=5 * S)
    for x0, tip in [(-60, (-95, -170)), (-10, (-15, -185)), (45, (70, -175))]:
        d.polygon([tuple(sc(cx + x0 - 30, hy - 105)), tuple(sc(cx + tip[0], hy + tip[1])),
                   tuple(sc(cx + x0 + 30, hy - 110))], fill=HAIR, outline=OUT_C, width=5 * S)
    d.arc(sc(cx - 70, hy - 95, cx - 10, hy - 60), 200, 300, fill=(255, 190, 120), width=6 * S)
    # eyes: happy arcs while chewing, big sparkly otherwise
    for side in (-1, 1):
        ex = cx + side * 45
        if chew > 0.3:
            d.arc(sc(ex - 24, hy - 10, ex + 24, hy + 26), 200, 340, fill=OUT_C, width=7 * S)
        else:
            ell(d, ex, hy + 5, 22, 30, (255, 255, 255), 5)
            d.ellipse(sc(ex - 15, hy - 8, ex + 15, hy + 32), fill=(80, 50, 30))
            d.ellipse(sc(ex - 9, hy + 2, ex + 9, hy + 26), fill=(30, 20, 20))
            d.ellipse(sc(ex - 12, hy - 4, ex - 1, hy + 7), fill=(255, 255, 255))
            d.ellipse(sc(ex + 3, hy + 16, ex + 9, hy + 22), fill=(255, 255, 255))
    # mouth
    if bite > 0.5 and chew < 0.3:
        ell(d, cx, hy + 55, 22, 20, (200, 70, 80), 4)
    elif chew > 0.3:
        w = 14 + 6 * math.sin(t * 20)
        d.arc(sc(cx - w, hy + 40, cx + w, hy + 64), 20, 160, fill=OUT_C, width=5 * S)
    else:
        d.chord(sc(cx - 26, hy + 38, cx + 26, hy + 72), 0, 180, fill=(200, 70, 80), outline=OUT_C, width=4 * S)
    # front arm holding the bun (raises it to mouth for the bite)
    lift = ease(bite)
    ax = lerp(cx + 120, cx + 70, lift)
    ay = lerp(by + sw * -1, hy + 75, lift)
    ell(d, ax, ay, 32, 40, SKIN)
    bx, bby = ax + 25, ay - 40
    ell(d, bx, bby, 50, 38, (255, 250, 240), 5)
    d.arc(sc(bx - 25, bby - 30, bx + 25, bby + 5), 200, 340, fill=(220, 200, 180), width=4 * S)
    if chew > 0.05:   # bite mark
        d.ellipse(sc(bx - 62, bby - 30, bx - 22, bby + 10), fill=None)
        d.pieslice(sc(bx - 70, bby - 35, bx - 20, bby + 15), 300, 60, fill=(255, 225, 160))

def sparkles(d, t, k):
    for i in range(6):
        a = i / 6 * 6.28 + t * 2
        r = 190 + 20 * math.sin(t * 6 + i)
        x, y = 560 + math.cos(a) * r, 250 + math.sin(a) * r * 0.6
        s = (10 + 6 * math.sin(t * 10 + i)) * k
        d.polygon([tuple(sc(x, y - s)), tuple(sc(x + s * 0.3, y)), tuple(sc(x, y + s)), tuple(sc(x - s * 0.3, y))], fill=(255, 250, 180))
        d.polygon([tuple(sc(x - s, y)), tuple(sc(x, y + s * 0.3)), tuple(sc(x + s, y)), tuple(sc(x, y - s * 0.3))], fill=(255, 250, 180))

try:
    FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64 * S)
except OSError:
    FONT = ImageFont.load_default()

# ---------- render ----------
proc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt",
                         "yuv420p", "-crf", "18", "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
dist = 0.0
for f in range(N):
    t = f / FPS
    run = 1 - ease((t - 6.0) / 0.8)            # jog 0-6s, slow to a stop
    bite = ease((t - 7.0) / 0.6)               # raise bun 7-7.6s
    chew = ease((t - 7.8) / 0.3)               # chew from 7.8s
    dist += 260 / FPS * run
    frame = SKY.copy().convert("RGBA")
    scroll(frame, MTN, dist * 0.2 * S)
    scroll(frame, TREES, dist * 0.6 * S)
    scroll(frame, GROUND, dist * 1.0 * S)
    d = ImageDraw.Draw(frame)
    # shadow
    d.ellipse(sc(460, 545, 660, 570), fill=(150, 110, 100))
    character(d, t, run, bite, chew)
    for p in PETALS:
        y = (p["y"] + p["v"] * t) % (H + 40) - 20
        x = (p["x"] - dist * 0.8 + 30 * math.sin(t * 1.5 + p["sway"])) % (W + 40) - 20
        r = p["r"]
        d.ellipse(sc(x - r, y - r * 0.6, x + r, y + r * 0.6), fill=(255, 190, 210))
    if chew > 0:
        sparkles(d, t, chew)
        k = ease((t - 8.2) / 0.4)
        if k > 0:
            txt = "Itadakimasu!"
            tw = d.textlength(txt, font=FONT)
            y = lerp(5, 25, k) * S
            d.text(((W * S - tw) / 2, y), txt, font=FONT, fill=(255, 255, 255), stroke_width=8 * S, stroke_fill=OUT_C)
    # fade in/out
    img = frame.convert("RGB").resize((W, H), Image.LANCZOS)
    fade = min(1, t / 0.4, (SECONDS - t) / 0.4)
    if fade < 1:
        img = Image.blend(Image.new("RGB", (W, H)), img, max(0, fade))
    proc.stdin.write(img.tobytes())
proc.stdin.close(); proc.wait()
print("wrote", OUT)
