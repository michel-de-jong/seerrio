"""Render the Seerr Mobile app icons into assets/ and store artwork into store/.

Run with: python3 scripts/generate-icons.py (needs Pillow).
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SIZE = 1024
SCALE = 4
ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
STORE = ROOT / "store"

BG_TOP = (49, 46, 129)
BG_BOTTOM = (17, 24, 39)
GLOW = (97, 95, 255)
RING_START = (129, 140, 248)
RING_END = (192, 132, 252)
BADGE = (97, 95, 255)
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def diagonal_gradient(size, start, end):
    small = Image.new("RGB", (256, 256))
    pixels = small.load()
    for y in range(256):
        for x in range(256):
            pixels[x, y] = lerp(start, end, (x + y) / 510)
    return small.resize((size, size), Image.BICUBIC)


def background(size):
    image = diagonal_gradient(size, BG_TOP, BG_BOTTOM).convert("RGBA")
    glow = Image.new("L", (size, size), 0)
    radius = size * 0.36
    center = size / 2
    ImageDraw.Draw(glow).ellipse(
        (center - radius, center - radius, center + radius, center + radius), fill=150
    )
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.12))
    image.paste(Image.new("RGBA", (size, size), GLOW + (255,)), (0, 0), glow)
    return image


def glyph_mask(size, scale):
    """White-on-black mask of the ring, play triangle and request badge."""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    c = size / 2
    unit = size / 1024 * scale

    ring_r, ring_w = 300 * unit, 64 * unit
    draw.ellipse((c - ring_r, c - ring_r, c + ring_r, c + ring_r), fill=255)
    inner = ring_r - ring_w
    draw.ellipse((c - inner, c - inner, c + inner, c + inner), fill=0)

    rounding = 28 * unit
    tri = [
        (c - 95 * unit, c - 140 * unit),
        (c - 95 * unit, c + 140 * unit),
        (c + 150 * unit, c),
    ]
    draw.polygon(tri, fill=255)
    for i, start in enumerate(tri):
        end = tri[(i + 1) % 3]
        draw.line([start, end], fill=255, width=round(rounding * 2))
        draw.ellipse(
            (start[0] - rounding, start[1] - rounding, start[0] + rounding, start[1] + rounding),
            fill=255,
        )
    return mask


def badge_geometry(size, scale):
    c = size / 2
    unit = size / 1024 * scale
    return c + 212 * unit, c - 212 * unit, 96 * unit, unit


def foreground(size, scale):
    """Transparent layer with the gradient ring, white play and badge."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = glyph_mask(size, scale)
    ring_gradient = diagonal_gradient(size, RING_START, RING_END).convert("RGBA")

    play_only = Image.new("L", (size, size), 0)
    c = size / 2
    unit = size / 1024 * scale
    inner = (300 - 64) * unit
    ImageDraw.Draw(play_only).ellipse((c - inner, c - inner, c + inner, c + inner), fill=255)
    play_only = ImageChops.multiply(play_only, mask)
    ring_only = ImageChops.subtract(mask, play_only)

    layer.paste(ring_gradient, (0, 0), ring_only)
    layer.paste(Image.new("RGBA", (size, size), WHITE + (255,)), (0, 0), play_only)

    bx, by, br, unit = badge_geometry(size, scale)
    outline = br + 22 * unit
    layer_cut = Image.new("L", (size, size), 0)
    ImageDraw.Draw(layer_cut).ellipse((bx - outline, by - outline, bx + outline, by + outline), fill=255)
    alpha = ImageChops.subtract(layer.getchannel("A"), layer_cut)
    layer.putalpha(alpha)

    ImageDraw.Draw(layer).ellipse((bx - br, by - br, bx + br, by + br), fill=BADGE + (255,))
    layer.paste(Image.new("RGBA", (size, size), WHITE + (255,)), (0, 0), plus_mask(size, scale))
    return layer


def plus_mask(size, scale):
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    bx, by, _, unit = badge_geometry(size, scale)
    arm, thick = 46 * unit, 18 * unit
    draw.rounded_rectangle((bx - arm, by - thick, bx + arm, by + thick), radius=thick, fill=255)
    draw.rounded_rectangle((bx - thick, by - arm, bx + thick, by + arm), radius=thick, fill=255)
    return mask


def monochrome(size, scale):
    alpha = ImageChops.subtract(foreground(size, scale).getchannel("A"), plus_mask(size, scale))
    layer = Image.new("RGBA", (size, size), WHITE + (0,))
    layer.putalpha(alpha)
    return layer


def render(build, out_size):
    return build(SIZE * SCALE).resize((out_size, out_size), Image.LANCZOS)


def feature_graphic():
    """Google Play feature graphic: 1024x500, glyph centred on the brand gradient."""
    width, height = 1024 * SCALE, 500 * SCALE
    canvas = background(width).crop((0, (width - height) // 2, width, (width + height) // 2))
    glyph_size = round(height * 1.25)
    glyph = foreground(glyph_size, 1.0)
    canvas.alpha_composite(glyph, ((width - glyph_size) // 2, (height - glyph_size) // 2))
    return canvas.resize((1024, 500), Image.LANCZOS).convert("RGB")


def main():
    full = render(lambda s: Image.alpha_composite(background(s), foreground(s, 1.0)), SIZE)
    full.convert("RGB").save(ASSETS / "icon.png", optimize=True)
    full.resize((48, 48), Image.LANCZOS).save(ASSETS / "favicon.png", optimize=True)

    # Android adaptive icons crop to the central ~66%, so the glyph is drawn smaller.
    render(lambda s: foreground(s, 0.78), SIZE).save(ASSETS / "android-icon-foreground.png", optimize=True)
    render(background, SIZE).convert("RGB").save(ASSETS / "android-icon-background.png", optimize=True)
    render(lambda s: monochrome(s, 0.78), SIZE).save(ASSETS / "android-icon-monochrome.png", optimize=True)
    render(lambda s: foreground(s, 1.0), SIZE).save(ASSETS / "splash-icon.png", optimize=True)

    STORE.mkdir(exist_ok=True)
    full.resize((512, 512), Image.LANCZOS).convert("RGB").save(STORE / "play-icon-512.png", optimize=True)
    feature_graphic().save(STORE / "play-feature-graphic.png", optimize=True)


if __name__ == "__main__":
    main()
