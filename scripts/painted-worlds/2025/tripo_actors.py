"""Prepare character-free rooms and fit textured Tripo GLBs to the original sets."""

import argparse
import hashlib
import json
import math
import runpy
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PRESETS = json.loads((HERE / "placements.json").read_text(encoding="utf-8"))
LEGACY = runpy.run_path(str(HERE.parent / "build_2025.py"))
STILLS = ("view-0", "view-1", "view-0-mobile", "view-1-mobile")
PACKAGE = ("scene.glb", *(f"{name}.webp" for name in STILLS))
HEADINGS = {"-Y": 0, "+X": 90, "+Y": 180, "-X": -90}
FLOOR_PARTS = {
    "solitude": ("sidewalk /",),
    "mirror": ("ground floor /",),
    "cosplayer": ("ground floor /", "Paper posing step"),
    "2025-36": ("Lacquer stage platform",),
    "diamond": ("Obsidian plinth",),
}
SEAT_PARTS = {"solitude": "bench seat slats", "cosplayer": "Simple graphite posing stool"}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def need(ok, reason):
    if not ok:
        raise ValueError(reason)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def room_path(room):
    return ROOT / "public" / "painted-worlds" / "rooms" / room


def room_hashes(room):
    return {name: digest(room_path(room) / name) for name in (*PACKAGE, "room.json")}


def open_blend(path):
    bpy.ops.wm.open_mainfile(filepath=str(path), use_scripts=False)
    bpy.context.preferences.filepaths.save_version = 0
    return bpy.context.scene


def save_blend(path):
    bpy.ops.wm.save_as_mainfile(filepath=str(path), compress=True)


def bounds(objects):
    bpy.context.view_layer.update()
    lower = [math.inf] * 3
    upper = [-math.inf] * 3
    for obj in objects:
        world = obj.matrix_world
        for vertex in obj.data.vertices:
            x, y, z = world @ vertex.co
            lower[0], lower[1], lower[2] = min(lower[0], x), min(lower[1], y), min(lower[2], z)
            upper[0], upper[1], upper[2] = max(upper[0], x), max(upper[1], y), max(upper[2], z)
    need(all(math.isfinite(v) for v in lower + upper), "No finite mesh bounds")
    return Vector(lower), Vector(upper)


def compact(v):
    return [round(x, 5) for x in v]


def locator(name, coords, yaw=0, size=.15):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_type = "ARROWS"
    obj.empty_display_size = size
    obj.location = coords
    obj.rotation_euler.z = math.radians(yaw)
    return obj


def mount_cosplayer_gear():
    """Separate capture equipment from the removed photographers and phone holder."""
    model = LEGACY["Model"](52025)
    for name in ("graphite", "audience edge", "audience lens", "camera reflection"):
        model.materials[name] = bpy.data.materials[name]
    for x, y, z, yaw, size in [(-2.28, 1.34, 1.48, 51, 1.0), (1.62, 2.89, 1.63, -28, 1.08)]:
        offset = Vector((x, y, z))
        spin = Matrix.Rotation(math.radians(yaw), 3, "Z")
        body = "Remounted photographer camera"
        model.round_box(body, "graphite", offset, (.34 * size, .15, .22), .024, math.radians(yaw))
        model.rod(body + " lens", "audience lens", offset + spin @ Vector((0, -.073, 0)),
                  offset + spin @ Vector((0, -.285, 0)), .087 * size, .095 * size, 16)
        model.rod(body + " glass", "camera reflection", offset + spin @ Vector((0, -.285, 0)),
                  offset + spin @ Vector((0, -.291, 0)), .071 * size, sides=16)
        tripod(model, "Camera", x, y, z - .10, .34)
    tripod(model, "Phone", .99, -2.42, 1.075, .21)
    model.emit()


def tripod(model, label, x, y, z, spread):
    center = (x, y, z * .67)
    model.rod(label + " stand column", "graphite", (x, y, z * .24), (x, y, z), .020, .016, 8)
    for angle in (.21, 2.3, 4.4):
        foot = (x + math.cos(angle) * spread, y + math.sin(angle) * spread, .019)
        model.rod(label + " stand legs", "audience edge", center, foot, .018, .011, 8)


def prepare(room, evidence, output):
    spec = PRESETS[room]
    scene = open_blend(evidence / "blends" / f"{room}.blend")
    hashes = room_hashes(room)
    need(digest(evidence / "final" / room / "scene.glb") == hashes["scene.glb"],
         f"{room}: base blend evidence differs from the current public GLB")
    objects = [obj for obj in scene.objects if obj.type == "MESH"]
    removed = []
    for prefix in spec["remove"]:
        group = [obj for obj in objects if obj.name.startswith(prefix)]
        need(group, f"{room}: missing legacy actor batch {prefix}")
        removed.extend(group)
    need(len(removed) == len(set(removed)), f"{room}: removal prefixes overlap")
    old_min, old_max = bounds(removed)
    names = sorted(obj.name for obj in removed)
    for obj in removed:
        bpy.data.objects.remove(obj, do_unlink=True)
    if room == "cosplayer":
        mount_cosplayer_gear()
    for name, role in spec["roles"].items():
        locator(f"TRIPO {name} | anchor and yaw", role["target"], role["yaw"], .24)
        locator(f"TRIPO {name} | supporting floor", (*role["target"][:2], role["floor"]))
    if "mirror" in spec:
        locator("Shared mirror plane | Y", (-.32, spec["mirror"]["y"], 2.12), size=.23)
    output.mkdir(parents=True, exist_ok=True)
    scene.camera = bpy.data.objects["view-0"]
    save_blend(output / "base.blend")
    write_json(output / "prepare.json", {
        "room": room, "basePublicHashes": hashes, "removed": names,
        "removedBoundsZUp": [compact(old_min), compact(old_max)], "roles": spec["roles"],
        "environmentMeshCount": sum(obj.type == "MESH" for obj in scene.objects),
    })
    LEGACY["configure_render"](scene, "gray", False)
    for name in ("view-0", "view-1", "side-inspection"):
        LEGACY["render"](scene, bpy.data.objects[name], output / f"{name}-base.png", (680, 420))
    print(f"PREPARED {room}: removed {len(names)} legacy meshes", flush=True)


def glb_info(path):
    file_size = path.stat().st_size
    with path.open("rb") as stream:
        magic, version, length, json_size, chunk = struct.unpack("<4sIII4s", stream.read(20))
        need(magic == b"glTF" and version == 2 and length == file_size and chunk == b"JSON"
             and 0 < json_size <= length - 20, f"{path.name}: invalid GLB header")
        doc = json.loads(stream.read(json_size))
    refs = doc.get("buffers", []) + doc.get("images", [])
    need(all("uri" not in ref or ref["uri"].startswith("data:") for ref in refs),
         f"{path.name}: keep the textures and buffers embedded")
    need(doc.get("meshes"), f"{path.name}: no mesh")
    return doc


def import_meshes(path):
    glb_info(path)
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    imported = set(bpy.context.scene.objects) - before
    depsgraph = bpy.context.evaluated_depsgraph_get()
    baked = []
    for obj in sorted(imported, key=lambda ob: ob.name):
        if obj.type != "MESH":
            continue
        evaluated = obj.evaluated_get(depsgraph)
        matrix = evaluated.matrix_world.copy()
        mesh = bpy.data.meshes.new_from_object(
            evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
        if mesh.polygons:
            baked.append((obj.name, mesh, matrix))
    need(baked, f"{path.name}: no usable evaluated mesh")
    for obj in imported:
        bpy.data.objects.remove(obj, do_unlink=True)
    return baked


def as_vector(value, label):
    need(isinstance(value, list) and len(value) == 3
         and all(type(x) in (int, float) and math.isfinite(x) for x in value), f"{label}: expected [x,y,z]")
    return Vector(value)


def read_asset(source_root, entry):
    path = (source_root / entry["file"]).resolve(strict=True)
    need(path.is_relative_to(source_root) and path.suffix.lower() == ".glb" and path.is_file(),
         f"Use a GLB under the specified Tripo root: {path}")
    return path


def placement(spec, preset):
    target = as_vector(spec.get("target", preset["target"]), "target")
    yaw = spec.get("yaw", preset["yaw"])
    height = spec.get("height", preset["height"])
    need(type(yaw) in (int, float) and math.isfinite(yaw) and type(height) in (float, int)
         and .4 <= height <= 4, "Invalid yaw or target height")
    return target, yaw, height


def contact_at(point, prefixes, label):
    hits = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not obj.name.startswith(prefixes):
            continue
        inverse = obj.matrix_world.inverted()
        local_point = inverse @ (point + Vector((0, 0, .22)))
        down = inverse.to_3x3() @ Vector((0, 0, -1))
        hit, local_hit, _, _ = obj.ray_cast(local_point, down, distance=.44)
        if hit:
            hits.append(((obj.matrix_world @ local_hit).z, obj.name))
    need(hits, f"{label}: no support geometry at {compact(point)}")
    z, name = max(hits)
    need(abs(point.z - z) <= .055, f"{label}: {compact(point)} misses {name} at z={z:.3f}")
    return {"point": compact(point), "surface": name, "z": round(z, 5)}


def fit(room, role, preset, src, path):
    parts = import_meshes(path)
    collection = bpy.data.collections.new(f"Tripo {room} {role}")
    bpy.context.scene.collection.children.link(collection)
    objects = []
    for part_name, mesh, matrix in parts:
        obj = bpy.data.objects.new(f"Tripo {role} | {part_name}", mesh)
        collection.objects.link(obj)
        obj.matrix_world = matrix
        objects.append(obj)
    lower, upper = bounds(objects)
    height = upper.z - lower.z
    need(.0001 < height < 100000, f"{role}: degenerate import height")
    target, yaw, fit_height = placement(src, preset)
    normalized_front = src.get("forward")
    need(normalized_front in HEADINGS, f"{role}: measure forward as one of {list(HEADINGS)} after import")
    anchor = as_vector(src["anchor"], f"{role}.anchor")
    margin = max(.001, height * .12)
    need(all(lower[i] - margin <= anchor[i] <= upper[i] + margin for i in range(3)),
         f"{role}: source anchor outside imported model; check coordinate axes and units")
    rotation = Matrix.Rotation(math.radians(yaw - HEADINGS[normalized_front]), 4, "Z")
    transform = (Matrix.Translation(target) @ rotation @ Matrix.Scale(fit_height / height, 4)
                 @ Matrix.Translation(-anchor))
    for obj in objects:
        obj.matrix_world = transform @ obj.matrix_world
    soles = [transform @ as_vector(p, f"{role}.soles") for p in src["soles"]]
    need(preset["plantedSoles"] <= len(soles) <= 2, f"{role}: mark only planted soles")
    contacts = [contact_at(p, FLOOR_PARTS[room], f"{role} sole") for p in soles]
    if room in SEAT_PARTS and role == "hero":
        contacts.append(contact_at(target, (SEAT_PARTS[room],), f"{role} seat"))
    labels = preset.get("landmarks", [])
    if not preset.get("optional"):
        labels = ["face"] + labels
    markers = src.get("landmarks", {})
    need(set(labels).issubset(markers), f"{role}: mark {', '.join(labels)} in the unplaced source")
    landmarks = {name: transform @ as_vector(value, f"{role}.{name}") for name, value in markers.items()}
    for marker_name, value in landmarks.items():
        locator(f"CHECK {role} {marker_name}", value)
    return objects, {
        "source": src["file"], "sourceSha256": digest(path), "sourceBoundsZUp": [compact(lower), compact(upper)],
        "target": compact(target), "yawDegrees": yaw, "scale": fit_height / height,
        "placedSoles": list(map(compact, soles)), "supportContacts": contacts,
        "placedLandmarks": {k: compact(v) for k, v in landmarks.items()},
        "meshCount": len(objects),
        "materials": sorted({s.material.name for obj in objects for s in obj.material_slots if s.material}),
    }


def add_mirror(objects, report, mirror):
    y = mirror["y"]
    fingertip = Vector(report["placedLandmarks"]["mirrorFingertip"])
    dx = abs(fingertip.x - mirror["archCenterX"])
    radius = mirror["archRadius"]
    top = mirror["archShoulder"] + math.sqrt(max(0, radius * radius - dx * dx))
    need(dx < radius - .065 and mirror["archBase"] + .07 < fingertip.z < top - .07
         and .016 < y - fingertip.y < .23, f"Fingertip outside the arch approach: {compact(fingertip)}")
    need(bounds(objects)[1].y < y - .020, "Visitor intersects the silvered pane")
    in_glass = Matrix.Translation((0, 2 * y, 0)) @ Matrix.Diagonal((1, -1, 1, 1))
    collection = bpy.data.collections.new("Mirror | linked original mesh and materials")
    bpy.context.scene.collection.children.link(collection)
    for obj in objects:
        copy = bpy.data.objects.new("Mirror linked | " + obj.name, obj.data)
        collection.objects.link(copy)
        copy.matrix_world = in_glass @ obj.matrix_world
        need(copy.data is obj.data, "Mirror must reuse the original mesh")
    reflected = in_glass @ fingertip
    locator("CHECK mirror reflected fingertip", reflected)
    return {"planeY": y, "linkedMeshCount": len(objects), "fingertipGap": round((reflected - fingertip).length, 5)}


def render_candidate(scene, output, reports, cpu):
    LEGACY["configure_render"](scene, "final", cpu)
    for name in (*STILLS, "side-inspection"):
        size = (720, 1120) if name.endswith("-mobile") else (1440, 900)
        dest = output / f"{name}.png"
        LEGACY["render"](scene, bpy.data.objects[name], dest, size)
        if name in STILLS:
            LEGACY["to_webp"](dest, output / f"{name}.webp")
    for role, report in reports.items():
        if "face" not in report["placedLandmarks"]:
            continue
        yaw = math.radians(report["yawDegrees"])
        forward = Vector((math.sin(yaw), -math.cos(yaw), .06))
        markers = report["placedLandmarks"]
        soles = [Vector(p) for p in report["placedSoles"]]
        posed = {**markers, "feet": compact(sum(soles, Vector()) / len(soles))}
        for name, coords in posed.items():
            if name.endswith("EarTip") or name in ("swordTip", "bowTop"):
                continue
            point = Vector(coords)
            eye = point + forward * 1.10 + Vector((0, 0, .26 if name == "feet" else 0))
            if name == "mirrorFingertip" or role == "hero" and yaw > math.pi:
                eye = point + Vector((-1.10, -.57, .16))
            cam = LEGACY["camera"](f"QA {role} {name}", eye, point, 32)
            LEGACY["render"](scene, cam, output / f"detail-{role}-{name}.png", (800, 640))


def candidate(room, base, output, source_root, manifest, cpu):
    spec = PRESETS[room]
    entries = read_json(manifest)[room]
    need(set(entries).issubset(spec["roles"]), f"{room}: unknown role in source manifest")
    required = [name for name, preset in spec["roles"].items() if not preset.get("optional")]
    need(all(role in entries for role in required), f"{room}: missing role(s) from {required}")
    paths = {role: read_asset(source_root, src) for role, src in entries.items()}
    need(len({digest(p) for p in paths.values()}) == len(paths),
         f"{room}: upload separate subjects, including distinct crowd actors")
    snapshot = read_json(base / "prepare.json")["basePublicHashes"]
    need(snapshot == room_hashes(room), f"{room}: public package changed since prepare")
    scene = open_blend(base / "base.blend")
    output.mkdir(parents=True, exist_ok=True)
    reports, mirror_report = {}, None
    for role, preset in spec["roles"].items():
        if role not in entries:
            continue
        objects, reports[role] = fit(room, role, preset, entries[role], paths[role])
        if "mirror" in spec:
            mirror_report = add_mirror(objects, reports[role], spec["mirror"])
    bpy.ops.file.pack_all()
    scene.camera = bpy.data.objects["view-0"]
    save_blend(output / "room.blend")
    scene = open_blend(output / "room.blend")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in scene.objects:
        if obj.type == "MESH":
            obj.select_set(True)
    path = output / "scene.glb"
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                             export_yup=True, export_cameras=False, export_lights=False,
                             export_animations=False)
    doc = glb_info(path)
    need(all("mesh" in node for node in doc["nodes"]), "Export unexpectedly includes non-mesh nodes")
    render_candidate(scene, output, reports, cpu)
    write_json(output / "candidate.json", {
        "room": room, "basePublicHashes": snapshot, "roles": reports, "mirror": mirror_report,
        "glbBytes": path.stat().st_size, "embeddedImages": len(doc.get("images", [])),
        "outputs": {name: digest(output / name) for name in PACKAGE},
    })
    print(f"CANDIDATE {room}: {path.stat().st_size:,} bytes", flush=True)


def install(room, output):
    receipt = read_json(output / "candidate.json")
    need(receipt["room"] == room and receipt["basePublicHashes"] == room_hashes(room),
         f"{room}: current public files differ from the reviewed base")
    need(receipt["glbBytes"] <= 2_500_000, "Optimize the candidate to fit the room budget before installation")
    files = {name: (output / name).read_bytes() for name in PACKAGE}
    need(all(hashlib.sha256(data).hexdigest() == receipt["outputs"][name] for name, data in files.items()),
         "Candidate files changed after render")
    for name, data in files.items():
        target = room_path(room) / name
        stage = target.with_name(f".{name}.tripo.tmp")
        stage.write_bytes(data)
        stage.replace(target)
    print(f"INSTALLED {room}: {len(files)} assets", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("prepare", "candidate", "install"))
    parser.add_argument("--evidence", type=Path, required=True)
    parser.add_argument("--only", nargs="+", choices=tuple(PRESETS))
    parser.add_argument("--source-root", type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--cpu", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if args.operation == "candidate" and not (args.only and args.source_root and args.manifest):
        parser.error("candidate needs --only, --source-root and --manifest")
    if args.operation == "install" and not args.only:
        parser.error("install requires the reviewed room slug(s) after --only")
    evidence = args.evidence.resolve(strict=True)
    for room in args.only or PRESETS:
        stage = evidence / "角色重製" / room
        if args.operation == "prepare":
            prepare(room, evidence, stage / "base")
        elif args.operation == "candidate":
            candidate(room, stage / "base", stage / "candidate",
                      args.source_root.resolve(strict=True), args.manifest, args.cpu)
        else:
            install(room, stage / "candidate")


if __name__ == "__main__":
    main()
