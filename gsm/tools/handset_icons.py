"""Print the existing navigation artwork into the hardware sampling grid.

The source glyphs are integer, axis-aligned SVG paths. Pixel-center even-odd
filling preserves their holes without adding an SVG rendering dependency.
"""
import math
import re
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageChops, ImageColor


TOKEN = re.compile(r"[A-Za-z]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?")
GLYPHS = ("home", "stream", "settings")


def path_polygons(data):
    """Parse only the M/H/V/L/Z subset used by the authoritative SVG artwork."""
    if TOKEN.sub("", data).strip(" ,\t\n\r"):
        raise ValueError("Unsupported SVG path syntax")
    tokens = TOKEN.findall(data)
    polygons, current = [], []
    command, x, y, index = None, 0.0, 0.0, 0
    while index < len(tokens):
        if tokens[index].isalpha():
            command = tokens[index]
            index += 1
            if command not in {"M", "H", "V", "L", "Z"}:
                raise ValueError(f"Unsupported SVG path command: {command}")
            if command == "Z":
                if len(current) < 3:
                    raise ValueError("SVG path has an incomplete closed polygon")
                polygons.append(current)
                x, y = current[0]
                current, command = [], None
                continue
        if command is None:
            raise ValueError("SVG coordinates require an M/H/V/L command")
        count = 2 if command in {"M", "L"} else 1
        values = tokens[index:index + count]
        if len(values) != count or any(value.isalpha() for value in values):
            raise ValueError(f"Incomplete SVG {command} coordinates")
        values = [float(value) for value in values]
        if not all(math.isfinite(value) for value in values):
            raise ValueError("SVG coordinates must be finite")
        index += count
        if command == "M":
            if current:
                if len(current) < 3:
                    raise ValueError("SVG path has an incomplete polygon")
                polygons.append(current)
            x, y = values
            current = [(x, y)]
            command = "L"
        else:
            if not current:
                raise ValueError("SVG polygon must start with M")
            if command == "L":
                x, y = values
            elif command == "H":
                x = values[0]
            else:
                y = values[0]
            current.append((x, y))
    if current:
        if len(current) < 3:
            raise ValueError("SVG path has an incomplete polygon")
        polygons.append(current)
    if not polygons:
        raise ValueError("SVG glyph contains no filled polygons")
    return polygons


def inside_polygon(x, y, polygon):
    inside = False
    previous = polygon[-1]
    for point in polygon:
        ax, ay = previous
        bx, by = point
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx - ax) / (by - ay):
            inside = not inside
        previous = point
    return inside


def path_mask(data, size):
    polygons = path_polygons(data)
    width, height = size
    mask = Image.new("L", size)
    mask.putdata([
        255 if sum(inside_polygon((x + .5) * 24 / width,
                                  (y + .5) * 24 / height, polygon)
                   for polygon in polygons) % 2 else 0
        for y in range(height) for x in range(width)
    ])
    return mask


def load_glyphs(path):
    source = Path(path).read_text()
    section = re.search(r"const\s+navigationSprites\s*=\s*Object\.freeze\(\{(.*?)\}\);", source, re.S)
    if not section:
        raise ValueError("Cannot find the navigationSprites source catalog")
    glyphs = {}
    for name, markup in re.findall(r"\b(home|stream|settings)\s*:\s*'([^']+)'", section.group(1)):
        root = ET.fromstring("<svg>" + markup + "</svg>")
        paths = []
        for element in root:
            if element.tag != "path" or "d" not in element.attrib:
                raise ValueError(f"Unsupported SVG element in {name}")
            if set(element.attrib) - {"d", "fill-rule"}:
                raise ValueError(f"Unsupported SVG path attributes in {name}")
            path_polygons(element.attrib["d"])
            paths.append(element.attrib["d"])
        if not paths:
            raise ValueError(f"Empty SVG navigation glyph: {name}")
        glyphs[name] = paths
    if set(glyphs) != set(GLYPHS):
        raise ValueError("Navigation catalog must contain home, stream and settings")
    return glyphs


def load_inks(path):
    inks = {}
    for fields in re.findall(r"\{([^{}]+)\}", Path(path).read_text()):
        identifier = re.search(r"\bid\s*:\s*['\"]([a-z0-9-]+)['\"]", fields)
        color = re.search(r"\bink\s*:\s*['\"](#[0-9a-fA-F]{6})['\"]", fields)
        if identifier and color:
            inks[identifier.group(1)] = color.group(1)
    if not inks:
        raise ValueError("Cannot find the handset ink colors")
    return inks


def print_hardware_icons(image, glyphs, ink, wide=False):
    """Composite at native render size, before the complete housing is sampled."""
    image = image.copy()
    logical_width, logical_height = (660, 450) if wide else (470, 830)
    scale_x, scale_y = image.width / logical_width, image.height / logical_height
    centers = (235, 310, 385) if wide else (134, 215, 296)
    center_y = 349 if wide else 698
    rgb = ImageColor.getrgb(ink)
    for name, center_x, logical_size in zip(GLYPHS, centers, (24, 28, 24)):
        size = (round(logical_size * scale_x), round(logical_size * scale_y))
        mask = Image.new("L", size)
        for data in glyphs[name]:
            mask = ImageChops.lighter(mask, path_mask(data, size))
        mask = mask.point(lambda alpha: round(alpha * .94))
        printed = Image.new("RGBA", size, rgb)
        printed.putalpha(mask)
        # Rendered frames include 20 logical pixels around each side of the case.
        position = (round((center_x + 20) * scale_x - size[0] / 2),
                    round((center_y + 20) * scale_y - size[1] / 2))
        image.alpha_composite(printed, position)
    return image
