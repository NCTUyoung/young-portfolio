"""Finish the two supplied Tripo figures in the existing 2024 scene sources.

Run in Blender with --room ID --asset INPUT.glb --out EXTERNAL_ROOM_DIRECTORY.
Add --clay for four isolated orthographic views and the two room stations.
"""

import argparse
import json
from math import cos, pi, sin, tau
from pathlib import Path
import sys

import bpy
from mathutils import Euler, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_character_room as casting_tools
from finish_pair_palette import paint_actor

base = casting_tools.base
MAX_BYTES = 3 * 1024 * 1024

CONFIG = {
    "2024-18-4": {
        "height": 3.06, "anchor": (-1.20, -.41, .2875), "yaw": 4,
        "sha256": "91fd8b5c2634f4313b8e8238baecce2a7e33ddd23a5fb68fd5015ca82ac0db75",
    },
    "2024-52": {
        "height": 2.80, "anchor": (-.36, -.08, -.0075), "yaw": 0,
        "sha256": "6183e07daafd26529d4761d3a6a1d91bd25b01f3215fd07e382381d37a057407",
    },
}


def clay_views(studio, actor, config, out):
    height = config["height"]
    anchor = Vector(config["anchor"])
    target = anchor + Vector((0, 0, height * .50))
    base.setup_clay(studio.scene)
    # Record matching orthographic projections for reading the sculpt and painting regions.
    for obj in studio.scene.objects:
        obj.hide_render = obj not in actor
    for label, direction in {
        "front": (0, -1, 0), "right": (1, 0, 0),
        "back": (0, 1, 0), "left": (-1, 0, 0),
    }.items():
        view = base.frame(label, "", target + Vector(direction) * 8, target)
        base.set_camera(studio, view, False)
        camera = studio.scene.camera
        camera.data.type = "ORTHO"
        camera.data.ortho_scale = height * 1.10
        base.render(studio, view, out / f"clay-{label}.webp", (800, 800))
    scene = studio.scene
    scene.camera.data.type = "PERSP"
    for obj in scene.objects:
        obj.hide_render = False
    for index, view in enumerate(room_views(config["slug"])):
        base.render(studio, view, out / f"clay-room-{index}.webp", (880, 550))
        base.render(studio, view, out / f"clay-room-{index}-mobile.webp", (420, 608), True)


def room_views(slug):
    frame = base.frame
    if slug == "2024-18-4":
        return [
            frame("花冠與虹彩", "從左側白裙和胸前相合的兩手，看向右面的虹彩玻璃。",
                  (.10, -5.78, 2.13), (-.19, .41, 1.83), 37, 55),
            frame("手套與裙褶", "從另一側看花冠、手套和裙褶，遠處的花與玻璃逐層交疊。",
                  (-2.89, -5.01, 2.67), (-.15, .39, 1.80), 40, 54),
        ]
    return [
        frame("手勢與雙晶心", "從粉心與青心之間看靠近臉頰的手勢、交疊的腿與座面。",
              (.14, -5.50, 2.04), (-.08, .52, 1.39), 39, 57),
        frame("彩心與側影", "從斜側看坐姿和雙手、前後懸吊的晶心與光帶。",
              (1.95, -4.83, 2.49), (.03, .49, 1.38), 41, 57),
    ]


def arrange_flower_light(studio):
    section = bpy.data.collections["Freestanding beam of pearl light"]
    shift = Vector((.79, -.20, .25))
    for obj in section.objects:
        obj.location += shift
    studio.section("Iridescent edge around the pearl light")
    center = Vector((1.41, 2.91, 1.94)) + shift
    basis = Euler((pi / 2, 0, -.13)).to_matrix()
    hues = ("#afdc79", "#f8d58f", "#eea9af", "#e5a6d6", "#a499df", "#74cbea", "#8cddd7", "#a8e5bf")
    for index, hue in enumerate(hues):
        start = index * tau / len(hues)
        angles = [start + (step / 12) * tau / len(hues) for step in range(13)]
        material = studio.material(f"Prismatic pearl lip {index + 1}", hue, rough=.23, glow=.32, coat=.34)
        arc = [center + basis @ Vector((1.022 * cos(a), 1.022 * sin(a), .05)) for a in angles]
        studio.tube("Pearl light spectrum", arc, .019, material, sides=7)


def arrange_heart_orbits(studio):
    for name in ("Dark oval dais foundation", "Black mirror dais"):
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    bpy.data.objects["Blue luminous seam around the dais"].location.z -= .11
    orbit = bpy.data.collections["Ring dais and glass ribbons"]
    for obj in list(orbit.objects):
        if obj.name.startswith("Sloping orbit-mounted support ribbon"):
            obj.location.y += 2.0
        elif obj.name.startswith("Orbit rail anchoring foot"):
            obj.location += Vector((0, 2.0, -.22))
        elif obj.name.startswith("Tension stay from the base"):
            matrix = obj.matrix_world.copy()
            a = matrix @ Vector((0, 0, min(v.co.z for v in obj.data.vertices)))
            b = matrix @ Vector((0, 0, max(v.co.z for v in obj.data.vertices)))
            studio.group = orbit
            studio.beam(obj.name, a + Vector((0, 2.0, -.22)), b + Vector((0, 2.0, 0)),
                        .017, obj.data.materials[0])
            bpy.data.objects.remove(obj, do_unlink=True)
    hearts = [
        (.55, .88, -.24), (-1.04, 1.59, .08), (.10, .53, .04),
        (.58, 1.22, .56), (-.87, 1.68, .31),
    ]
    index = -1
    for obj in bpy.data.collections["Rose and lake blue suspended hearts"].objects:
        if obj.name.startswith("Closed polished heart shell"):
            index += 1
        obj.location += Vector(hearts[index])
        if obj.name.startswith("Balloon tether weight"):
            obj.location.z -= .525
        elif index == 4 and obj.name.startswith("High tensile filament above glass"):
            for vertex in obj.data.vertices:
                vertex.co.z -= .525 * min(1, max(0, (2.186 - vertex.co.z) / 1.96))


def publish_ready(studio, definition, room, views, out):
    base.setup_cycles(studio.scene, definition["look"]["sky"], definition["world"], 36)
    definition["lights"](studio)
    if room["id"] == "2024-52":
        studio.light("Soft light over the seated figure and its hand", "AREA", (-.80, -2.8, 3.73),
                     "#ffe7d6", 130, target=(-.36, 0, 1.76), size=2.1)
    base.set_camera(studio, views[0], False)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(out / "room.blend"), compress=True)
    delivery = out / "publish-ready"
    delivery.mkdir(exist_ok=True)
    model = delivery / "scene.glb"
    base.export(model)
    size = model.stat().st_size
    asset = casting_tools.glb_json(model)
    if size > MAX_BYTES or not any(node.get("name", "").startswith("Tripo | ") for node in asset["nodes"]):
        raise ValueError(f"Room GLB must include the Tripo mesh and fit in {MAX_BYTES} bytes. Got {size}.")
    room["views"] = [dict(view, position=base.y_up(view["position"]), target=base.y_up(view["target"])) for view in views]
    room["look"] = definition["look"]
    casting_tools.write_json(delivery / "room.json", room)
    print(f"EXPORTED {room['id']}: {size:,} bytes", flush=True)
    for index, view in enumerate(views):
        base.render(studio, view, delivery / f"view-{index}.webp", casting_tools.OFFLINE)
        base.render(studio, view, delivery / f"view-{index}-mobile.webp", casting_tools.MOBILE, True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--room", choices=CONFIG, required=True)
    parser.add_argument("--asset", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True, help="External evidence directory for this room")
    parser.add_argument("--clay", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    out = args.out.resolve()
    if out.is_relative_to(base.ROOMS):
        parser.error("--out must be separate from public room files")
    config = dict(CONFIG[args.room], slug=args.room)
    if casting_tools.digest(args.asset) != config["sha256"]:
        parser.error("The supplied GLB does not match the inspected Tripo original")
    if args.clay:
        out /= "gray"
    out.mkdir(parents=True, exist_ok=True)
    definition = casting_tools.room_definition(args.room, posed=True)
    studio = base.Studio(sum((i + 1) * ord(c) for i, c in enumerate(args.room)))
    definition["build"](studio)
    casting_tools.remove_stand_ins(bpy, args.room)
    bpy.context.view_layer.update()
    arrange = arrange_flower_light if args.room == "2024-18-4" else arrange_heart_orbits
    arrange(studio)
    studio.section("Pair room lighting and cameras")
    bpy.context.view_layer.update()
    actor, report = casting_tools.stage_asset(
        args.asset, Vector(config["anchor"]), config["height"], config["yaw"], None, 30000,
    )
    prefixes = casting_tools.CASTING[args.room].collision_groups
    hits = casting_tools.intersecting_props(studio.scene, actor, prefixes)
    report["intersectingProps"] = hits
    casting_tools.write_json(out / "source.json", report)
    print(f"Staged {args.room}: {report}", flush=True)
    if args.clay:
        clay_views(studio, actor, config, out)
        return
    if hits or abs(report["contactDelta"]) > .01:
        raise ValueError(f"Check pose contact and prop intersections before shading: {hits}")
    paint_actor(studio, actor, config, base.color)
    room = json.loads((base.ROOMS / args.room / "room.json").read_text(encoding="utf8"))
    publish_ready(studio, definition, room, room_views(args.room), out)


if __name__ == "__main__":
    main()
