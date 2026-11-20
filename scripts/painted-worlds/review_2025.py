"""Build 2025 review contact sheets and verify the six files in each room.

Run with standard Python and Pillow. --source points to inventory.json's directory.
"""

import argparse
import json
import math
import struct
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
SLUGS = ("solitude", "2025-36", "mirror", "diamond", "cosplayer")
VIEWS = ("view-0", "view-1", "side-inspection")
MOBILE = ("view-0-mobile", "view-1-mobile")


def contact(items, source, phase):
    evidence = source / "2025-場景證據"
    ink, paper = "#3c3b44", "#ebe7e0"
    font = ImageFont.truetype("segoeui.ttf", 18)
    small = ImageFont.truetype("segoeui.ttf", 15)
    columns = (("original", "Original artwork", 282),
               ("view-0", "01  Frontal composition", 450),
               ("view-1", "02  Shifted composition", 450),
               ("side-inspection", "Depth inspection", 450))
    if phase != "gray":
        columns += ((MOBILE[0], "01  Mobile", 190), (MOBILE[1], "02  Mobile", 190))
    width = 16 + sum(cell + 12 for _, _, cell in columns)
    height = 38 + 323 * len(items)
    sheet = Image.new("RGB", (width, height), paper)
    draw = ImageDraw.Draw(sheet)
    for row, item in enumerate(items):
        slug = item["slug"]
        baseline = 21 + row * 323
        draw.text((16, baseline), f"{row + 1:02}   {slug}", fill=ink, font=font)
        x = 16
        for name, caption, cell in columns:
            path = (ROOT / "public" / "images" / item["filename"] if name == "original"
                    else evidence / phase / slug / (name + ".png"))
            with Image.open(path) as image:
                preview = ImageOps.contain(image.convert("RGB"), (cell, 265), Image.Resampling.LANCZOS)
                sheet.paste(preview, (x + (cell - preview.width) // 2, baseline + 31 + (265 - preview.height) // 2))
            draw.text((x, baseline + 296), caption, fill=ink, font=small)
            x += cell + 12
    sheet.save(evidence / f"{phase}-comparison.jpg", quality=94, subsampling=0)


def glb_check(path):
    raw = path.read_bytes()
    magic, version, length, json_length, kind = struct.unpack_from("<4sIII4s", raw)
    assert magic == b"glTF" and version == 2 and length == len(raw) and kind == b"JSON"
    assert len(raw) <= 2_500_000
    glb = json.loads(raw[20:20 + json_length])
    nodes = glb["nodes"]
    assert nodes and all("mesh" in node and "camera" not in node for node in nodes)
    assert "KHR_lights_punctual" not in glb.get("extensionsUsed", [])
    assert "images" not in glb
    assert all("translation" not in node and "rotation" not in node and "scale" not in node for node in nodes)
    primitives = [primitive for mesh in glb["meshes"] for primitive in mesh["primitives"]]
    triangles = sum(glb["accessors"][p["indices"]]["count"] // 3 for p in primitives)
    positions = [glb["accessors"][p["attributes"]["POSITION"]] for p in primitives]
    mins = [min(p["min"][axis] for p in positions) for axis in range(3)]
    maxs = [max(p["max"][axis] for p in positions) for axis in range(3)]
    assert mins[1] > -.2 and maxs[1] > 2
    assert triangles > 1_000
    return {"bytes": len(raw), "meshNodes": len(nodes), "triangles": triangles,
            "boundsYUp": [[round(x, 3) for x in p] for p in (mins, maxs)]}


def verify(source, items):
    exhibit = ROOT / "public" / "painted-worlds"
    summaries = {}
    for item in items:
        slug = item["slug"]
        room = exhibit / "rooms" / slug
        config = json.loads((room / "room.json").read_text(encoding="utf-8"))
        assert (config["id"], config["year"], config["workId"], config["title"]) == (
            slug, 2025, item["workId"], item["title"])
        path = f"./rooms/{slug}/"
        assert config["model"] == path + "scene.glb"
        assert config["stills"] == [path + f"view-{i}.webp" for i in range(2)]
        assert config["mobileStills"] == [path + name + ".webp" for name in MOBILE]
        views = config["views"]
        assert len(views) == 2
        for view in views:
            assert view["label"] and view["description"]
            assert all(len(view[k]) == 3 and all(math.isfinite(x) for x in view[k]) for k in ("position", "target"))
            assert view["position"][1] > 0 and 3 <= math.dist(view["position"], view["target"]) <= 9
            assert view["fov"] == 50 and view["mobileFov"] == 55
        assert math.dist(views[0]["position"], views[1]["position"]) > 2
        assert all(config["look"][key].startswith("#") for key in ("sky", "key", "fill", "ground"))
        assert 0 < config["look"]["fog"]["near"] < config["look"]["fog"]["far"]
        summary = glb_check(room / "scene.glb")
        summary["stills"] = {}
        for url in config["stills"] + config["mobileStills"]:
            still = exhibit / url
            with Image.open(still) as image:
                assert image.format == "WEBP"
                assert image.size == ((720, 1120) if "mobile" in url else (1440, 900))
                image.load()
                assert max(channel[1] - channel[0] for channel in image.convert("RGB").getextrema()) > 75
                summary["stills"][still.name] = {"size": image.size, "bytes": still.stat().st_size}
        blend = source / "2025-場景證據" / "blends" / (slug + ".blend")
        summary["blendBytes"] = blend.stat().st_size
        summaries[slug] = summary
        print(f"{slug}: {summary['bytes']:,} GLB bytes, {summary['meshNodes']} meshes, {summary['triangles']:,} triangles")
    (source / "2025-場景證據" / "verification.json").write_text(
        json.dumps(summaries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--phase", required=True, choices=("gray", "proof", "final"))
    args = parser.parse_args()
    items = json.loads((args.source / "inventory.json").read_text(encoding="utf-8-sig"))
    by_slug = {item["slug"]: item for item in items}
    ordered = [by_slug[slug] for slug in SLUGS]
    contact(ordered, args.source, args.phase)
    if args.phase == "final":
        verify(args.source, ordered)


if __name__ == "__main__":
    main()
