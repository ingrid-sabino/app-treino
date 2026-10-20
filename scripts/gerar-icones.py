"""Gera os ícones do PWA (Tönus) em public/. Rode: python3 scripts/gerar-icones.py"""
from PIL import Image, ImageDraw

LIME = (212, 242, 106)
INK = (30, 27, 46)
LILAC = (185, 167, 245)


def icon(size: int, padding: float) -> Image.Image:
    scale = 4  # desenha grande e reduz para suavizar as bordas
    s = size * scale
    img = Image.new("RGB", (s, s), LIME)
    d = ImageDraw.Draw(img)
    inset = s * padding
    box = (inset, inset, s - inset, s - inset)
    width = int((s - 2 * inset) * 0.16)
    # Anel de Rotação: 300° em tinta, com uma ponta lilás (o Próximo treino)
    d.arc(box, start=-60, end=240, fill=INK, width=width)
    r = width * 0.85
    import math
    cx, cy = s / 2, s / 2
    rad = (s - 2 * inset - width) / 2
    a = math.radians(-60)
    px, py = cx + rad * math.cos(a), cy + rad * math.sin(a)
    d.ellipse((px - r, py - r, px + r, py + r), fill=LILAC, outline=INK, width=int(width * 0.18))
    return img.resize((size, size), Image.LANCZOS)


icon(192, 0.2).save("public/pwa-192x192.png")
icon(512, 0.2).save("public/pwa-512x512.png")
icon(512, 0.3).save("public/maskable-512x512.png")
icon(180, 0.2).save("public/apple-touch-icon.png")
icon(64, 0.14).save("public/favicon.png")
