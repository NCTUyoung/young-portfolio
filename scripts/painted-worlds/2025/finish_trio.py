"""Fit and package the three original Tripo sculptures for the 2025 rooms."""

import argparse
import math
import runpy
import shutil
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree


HERE = Path(__file__).resolve().parent
API = runpy.run_path(str(HERE / "tripo_actors.py"))
LEGACY = API["LEGACY"]
SLUGS = ("cosplayer", "diamond", "2025-36")
VIEWS = API["STILLS"]
FILES = (*API["PACKAGE"], "room.json")
PROPOSALS = API["ROOT"].parent / "young-portfolio-設計提案"
TRIPO = PROPOSALS / "畫界-Tripo-重製"
OLD = PROPOSALS / "畫界-2024-2026" / "2025-場景證據"
DIRECTIONS = {"minus-y": (0, -1, 0), "plus-x": (1, 0, 0),
              "plus-y": (0, 1, 0), "minus-x": (-1, 0, 0), "top": (0, -.0001, 1)}
FIT = {
    "cosplayer": {"height": 2.83, "yaw": -7, "xy": (.025, .165), "floor": .086,
                  "contact": ("Paper posing step",), "triangles": 77_000},
    "diamond": {"height": 2.85, "yaw": -8, "pitch": -.93, "xy": (.08, .20), "floor": .138,
                "contact": ("Obsidian plinth",), "triangles": 82_000},
    "2025-36": {"height": 2.85, "yaw": 11, "xy": (0, .05), "floor": .18,
                 "contact": ("Lacquer stage platform / pitch lacquer",), "triangles": 80_000},
}

PALETTES = {
    "cosplayer": {"ink": "#261f30", "skin": "#e9d3cc", "hair": "#e6dcd3", "cuff": "#f4e9e3",
                  "fishnet": "#807077", "shoe": "#302836", "ear": "#4c3c50", "seat": "#9f949d",
                  "glasses": "#51444e"},
    "diamond": {"skin": "#dbc4d7", "hair": "#6479b9", "ice": "#b9c9f5", "bow": "#e1e4ff",
                "dress": "#302b61", "indigo": "#454b89", "edge": "#7e8dc7", "boot": "#dedff7",
                "steel": "#a8bcec", "hilt": "#626fa5"},
    "2025-36": {"navy": "#203356", "blue": "#315b91", "lapel": "#111c30", "sole": "#181924",
                 "skin": "#e8c2b2", "bun": "#805b4e", "braid": "#a16448", "gold": "#b89a64"},
}
RGB = {room: {name: LEGACY["linear"](value) for name, value in colors.items()}
       for room, colors in PALETTES.items()}


def fade(value, low, high):
    t = min(1.0, max(0.0, (value - low) / (high - low)))
    return t * t * (3 - 2 * t)


def band(value, low, high, soft=.012):
    return fade(value, low - soft, low + soft) * (1 - fade(value, high - soft, high + soft))


def ellipse(x, y, cx, cy, rx, ry, soft=.16):
    return 1 - fade(math.hypot((x - cx) / rx, (y - cy) / ry), 1 - soft, 1 + soft)


def mix(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def cosplayer_color(point, normal):
    x, y, z = point
    rgb = RGB["cosplayer"]
    if z < .299 and y > -.094 and -.218 < x < .113:
        return rgb["seat"]
    if z < .097:
        return mix(rgb["shoe"], rgb["fishnet"], fade(z, .072, .098) * .42)
    if z < .405:
        cross = max(abs(math.sin((x * 71 + z * 82) * math.pi)),
                    abs(math.sin((x * 71 - z * 82) * math.pi)))
        hose = mix(rgb["fishnet"], rgb["ink"], fade(cross, .77, 1) * .42)
        return mix(hose, rgb["ink"], fade(z, .350, .395)) if abs(x + .05) < .10 else hose
    if z > .802:
        return mix(rgb["ink"], rgb["ear"], .24 + .45 * max(0, -normal.y))
    skin, hair = rgb["skin"], rgb["hair"]
    if z > .662:
        brow = .757 - .07 * max(0, abs(x + .065) - .052)
        hair_mask = max(fade(z, brow - .010, brow + .012), fade(y, -.002, .052),
                        fade(abs(x + .072), .061, .094) * band(z, .673, .786))
        color = mix(skin, hair, hair_mask)
        lenses = [math.hypot((x - cx) / .021, (z - cz) / .016)
                  for cx, cz in ((-.093, .718), (-.051, .708))]
        rims = max(band(dist, .87, 1.04, .13) for dist in lenses)
        return mix(color, rgb["glasses"], rims * (1 - fade(y, -.044, -.012)) * .7)
    pigtail = max(ellipse(x, z, -.217, .584, .067, .075), ellipse(x, z, .098, .584, .069, .076))
    neck_bow = ellipse(x, z, -.075, .627, .055, .018) * (1 - fade(y, -.012, .028))
    below_neckline = 1 - fade(z, .527 + .42 * abs(x + .061), .552 + .42 * abs(x + .061))
    torso = 1 - fade(abs(x + .052), .082, .118)
    leotard = below_neckline * torso
    cuff = max(ellipse(x, z, .057, .403, .040, .025), ellipse(x, z, -.169, .557, .037, .021))
    color = mix(skin, rgb["ink"], max(neck_bow, leotard))
    return mix(mix(color, rgb["cuff"], cuff), hair, pigtail * fade(y, -.089, -.043))


def diamond_color(point, normal):
    x, y, z = point
    rgb = RGB["diamond"]
    sword_x = -.488 + .427 * z
    steel = band(x - sword_x, -.017, .021, .009) * (1 - fade(z, .61, .67))
    if steel > .6:
        return mix(rgb["steel"], rgb["ice"], max(0, -normal.y) * .58)
    hilt = ellipse(x, z, -.181, .769, .031, .045)
    if hilt > .62:
        return mix(rgb["steel"], rgb["hilt"], .58)
    bow = max(fade(z, .819, .849), fade(abs(x - .017), .108, .15) * band(z, .702, .91))
    if bow > .70 and x > -.128:
        return mix(rgb["ice"], rgb["bow"], .56 + .36 * abs(normal.z))
    if z > .640 and -.129 < x < .148:
        forehead = .750 - .14 * max(0, abs(x + .027) - .047)
        hair = max(fade(z, forehead, forehead + .025), fade(y, -.049, .014), fade(x, .048, .092))
        return mix(mix(rgb["skin"], rgb["hair"], hair), rgb["bow"], bow * .75)
    if z < .144 and (x < -.223 or .043 < x < .190):
        return mix(rgb["boot"], rgb["edge"], .27 * abs(normal.y))
    skirt = max(fade(x, .033, .129), ellipse(x, z, -.018, .383, .294, .135))
    bent_knee = ellipse(x, z, -.144, .204, .058, .051)
    bent_boot = ellipse(x, z, .098, .143, .076, .093)
    straight_boot = ellipse(x, z, -.287, .127, .060, .123)
    bodice = ellipse(x, z, .012, .442, .116, .092)
    petals = mix(rgb["dress"], rgb["ice"], fade(normal.z + .35 * normal.y, -.17, .54))
    petals = mix(petals, rgb["edge"], .18)
    gray = mix(rgb["skin"], rgb["ice"], bodice * .83)
    arm_gloves = ellipse(x, z, -.209, .634, .076, .092) + ellipse(x, z, -.182, .706, .050, .081)
    gray = mix(gray, rgb["boot"], min(1, arm_gloves * .9))
    return mix(mix(gray, petals, skirt * (1 - bent_knee)), rgb["boot"], max(bent_boot, straight_boot))


def pair_color(point, normal):
    x, y, z = point
    rgb = RGB["2025-36"]
    short = 1 - fade(x, -.078, -.026)
    if z < .218:
        return mix(rgb["sole"], rgb["lapel"], fade(z, .167, .220))
    blue_hat = max(fade(z, .911, .926), short * fade(z, .838 + .22 * (x + .145), .858 + .22 * (x + .145)))
    head = max(ellipse(x, z, .038, .874, .077, .055), ellipse(x, z, -.131, .805, .057, .049))
    hair = max(fade(y, -.026, .048), fade(-x, .116, .161) * short,
               fade(x, .061, .105) * (1 - short))
    braid = band(x, .102, .151, .009) * band(z, .712, .860, .010) * fade(y, -.078, -.034)
    cheeks = mix(rgb["skin"], mix(rgb["braid"], rgb["bun"], short), max(hair, braid) * .92)
    high_hand = ellipse(x, z, -.186, .736, .035, .029)
    low_hand = ellipse(x, z, -.073, .669, .026, .031) * (1 - fade(y, -.093, -.063))
    hanging_hands = max(ellipse(x, z, .137, .467, .031, .046), ellipse(x, z, -.018, .417, .028, .041))
    lapel = 1 - fade(abs(x - (.035 - .038 * (z - .62))), .022, .046)
    lapel *= band(z, .566, .795) * (1 - fade(y, -.043, .011))
    color = mix(rgb["navy"], rgb["lapel"], lapel)
    buttons = max(ellipse(x, z, .034, level, .005, .007) for level in (.615, .646, .676))
    color = mix(color, rgb["gold"], buttons * (1 - fade(y, -.072, -.035)))
    color = mix(color, cheeks, max(head, braid))
    color = mix(color, rgb["skin"], max(high_hand, low_hand, hanging_hands))
    hat = mix(rgb["navy"], rgb["blue"], .57 + .27 * max(0, normal.z))
    return mix(color, hat, blue_hat)


SURFACES = {"cosplayer": cosplayer_color, "diamond": diamond_color, "2025-36": pair_color}


def simplify(obj, triangles):
    bpy.context.view_layer.objects.active = obj
    modifier = obj.modifiers.new("Preserve the Tripo surface", "DECIMATE")
    modifier.ratio = min(1, triangles / len(obj.data.polygons))
    modifier.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def orthographic_views(scene, output, center, extent, directions=DIRECTIONS):
    for name, direction in directions.items():
        eye = center + Vector(direction).normalized() * extent * 3
        camera = LEGACY["camera"]("Inspection " + name, eye, center, 45)
        camera.data.type = "ORTHO"
        camera.data.ortho_scale = extent * 1.15
        LEGACY["render"](scene, camera, output / f"{name}.png", (640, 640))
        bpy.data.objects.remove(camera, do_unlink=True)


def inspect(slug, source_root, old, evidence):
    output = evidence / slug / "source"
    output.mkdir(parents=True, exist_ok=True)
    scene = API["open_blend"](old / "角色重製" / slug / "base" / "base.blend")
    API["write_json"](output / "environment.json", {
        obj.name: [API["compact"](obj.matrix_world @ Vector(corner)) for corner in obj.bound_box]
        for obj in scene.objects if obj.type == "MESH"
    })
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new("Tripo review")
    source = source_root / f"{slug}.glb"
    imported = API["import_meshes"](source)
    objects, source_parts = [], {}
    for name, mesh, matrix in imported:
        mesh.transform(matrix)
        obj = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(obj)
        source_parts[name] = {"triangles": len(mesh.polygons), "bounds": [list(v) for v in API["bounds"]([obj])]}
        simplify(obj, 190_000 * len(mesh.polygons) // sum(len(m.polygons) for _, m, _ in imported))
        objects.append(obj)
    lower, upper = API["bounds"](objects)
    API["write_json"](output / "source.json", {
        "sha256": API["digest"](source), "file": source.name, "parts": source_parts,
        "reviewBounds": [list(lower), list(upper)], "baselineHashes": API["room_hashes"](slug),
    })
    API["save_blend"](output / "sculpture.blend")
    LEGACY["configure_render"](scene, "gray", False)
    scene.display.shading.show_shadows = False
    orthographic_views(scene, output, (lower + upper) / 2, max(upper - lower))
    print(f"INSPECTED {slug}", flush=True)


def append_sculpture(slug, path):
    with bpy.data.libraries.load(str(path), link=False) as (source, destination):
        destination.objects = source.objects
    objects = [obj for obj in destination.objects if obj is not None and obj.type == "MESH"]
    API["need"](len(objects) == 1, f"{slug}: expected the delivered single mesh")
    actor, = objects
    actor.name = f"Tripo | {slug}"
    actor.data.name = f"Tripo sculpture | {slug}"
    bpy.context.scene.collection.objects.link(actor)
    return actor


def remove_pair_base(actor):
    mesh = bmesh.new()
    mesh.from_mesh(actor.data)
    plane = .057
    geometry = list(mesh.verts) + list(mesh.edges) + list(mesh.faces)
    cut = bmesh.ops.bisect_plane(mesh, geom=geometry, dist=.00002, plane_co=(0, 0, plane),
                                plane_no=(0, 0, 1), clear_inner=True)
    edge_rim = [item for item in cut["geom_cut"] if isinstance(item, bmesh.types.BMEdge)
                and item.is_valid and item.is_boundary]
    bmesh.ops.holes_fill(mesh, edges=edge_rim, sides=0)
    bmesh.ops.recalc_face_normals(mesh, faces=list(mesh.faces))
    mesh.to_mesh(actor.data)
    mesh.free()
    actor.data.update()
    return plane


def remove_prefixes(scene, prefixes):
    names = [obj.name for obj in scene.objects if obj.type == "MESH" and obj.name.startswith(prefixes)]
    for name in names:
        bpy.data.objects.remove(scene.objects[name], do_unlink=True)
    return names


def prepare_cosplayer(scene, original):
    removed = remove_prefixes(scene, ("Simple graphite posing stool", "Stool feet", "Phone stand ",
                                     "Camera neck strap", "Remounted photographer camera", "Camera stand "))
    # Reuse a faceless near holder and a single standing background silhouette from the set.
    phone = ("Near kneeling photographer", "Foreground phone paper sleeves",
             "Foreground phone holder hands", "Phone grip fingers")
    prefixes = (*phone, "Photographer 6 ", "Sculpted camera ")
    with bpy.data.libraries.load(str(original), link=False) as (source, destination):
        destination.objects = [name for name in source.objects if name.startswith(prefixes)
                               and "cheek outline" not in name]
    names = []
    for obj in destination.objects:
        original_name = obj.name
        if original_name.startswith("Sculpted camera "):
            mesh = bmesh.new()
            mesh.from_mesh(obj.data)
            outside = [vert for vert in mesh.verts if not (1.88 < vert.co.x < 2.75 and .94 < vert.co.y < 1.75)]
            bmesh.ops.delete(mesh, geom=outside, context="VERTS")
            mesh.to_mesh(obj.data)
            mesh.free()
            if not obj.data.polygons:
                bpy.data.objects.remove(obj, do_unlink=True)
                continue
        obj.name = "Set silhouette | " + original_name
        scene.collection.objects.link(obj)
        names.append(original_name)
    API["need"](any(name.startswith("Foreground phone holder hands") for name in names)
                and any(name.startswith("Photographer 6 ") for name in names), "Missing set silhouettes")
    phone_parts = (*("Set silhouette | " + name for name in phone), "Vertical foreground phone", "Inset blank phone",
                   "Phone glass angled", "Phone rear lens")
    for obj in scene.objects:
        if obj.name.startswith(phone_parts):
            obj.location += Vector((-.19, .32, 0))
    return {"removed": removed, "retainedSilhouettes": names}


def paint(slug, actor):
    mesh = actor.data
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    for attribute in list(mesh.color_attributes):
        mesh.color_attributes.remove(attribute)
    colors = mesh.color_attributes.new(name="Original palette", type="BYTE_COLOR", domain="POINT")
    surface = SURFACES[slug]
    colors.data.foreach_set("color", [c for vert in mesh.vertices for c in (*surface(vert.co, vert.normal), 1)])
    mesh.color_attributes.active_color = colors
    mat = bpy.data.materials.new(f"{slug} | Tripo color fields")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = .53 if slug == "diamond" else .69
    bsdf.inputs["Metallic"].default_value = .12 if slug == "diamond" else .01
    field = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    field.layer_name = colors.name
    mat.node_tree.links.new(field.outputs["Color"], bsdf.inputs["Base Color"])
    mesh.materials.clear()
    mesh.materials.append(mat)


CONTACT_REGIONS = {
    "cosplayer": {"left shoe": (-.25, -.115, -.24, -.105), "right shoe": (.03, .16, -.24, -.102),
                  "integrated seat": (-.20, .09, -.075, .21)},
    "diamond": {"extended boot": (-.41, -.247, -.25, .25), "folded boot": (.043, .184, -.25, .25),
                "sword tip": (-.51, -.431, -.25, .25)},
    "2025-36": {"shorter's left boot": (-.23, -.144, -.27, .27),
                "shorter's right boot": (-.143, -.069, -.27, .27),
                "taller's left boot": (-.065, .061, -.27, .27),
                "taller's right boot": (.100, .190, -.27, .27)},
}


def support_region(points, region):
    left, right, near, far = region
    return [p for p in points if left <= p.x <= right and near <= p.y <= far]


def level_cosplayer_seat(actor):
    points = [vertex.co for vertex in actor.data.vertices]
    regions = CONTACT_REGIONS["cosplayer"]
    shoe_z = min(p.z for p in support_region(points, regions["right shoe"]))
    seat = support_region(points, regions["integrated seat"])
    difference = max(0, min(p.z for p in seat) - shoe_z)
    for point in seat:
        point.z -= difference * (1 - fade(point.z, .022, .125))
    actor.data.update()
    return round(difference, 6)


def place(slug, actor, fit):
    local = [vertex.co.copy() for vertex in actor.data.vertices]
    low, high = API["bounds"]([actor])
    scale = fit["height"] / (high.z - low.z)
    rotation = (Matrix.Rotation(math.radians(fit.get("pitch", 0)), 4, "Y")
                @ Matrix.Rotation(math.radians(fit["yaw"]), 4, "Z"))
    shaped = rotation @ Matrix.Scale(scale, 4)
    min_z = min((shaped @ point).z for point in local)
    actor.matrix_world = Matrix.Translation((*fit["xy"], fit["floor"] + .001 - min_z)) @ shaped
    bpy.context.view_layer.update()
    contacts = {}
    for label, region in CONTACT_REGIONS[slug].items():
        points = support_region(local, region)
        API["need"](points, f"{slug}: missing {label} contact region")
        support_point = min(points, key=lambda p: (actor.matrix_world @ p).z)
        world_point = actor.matrix_world @ support_point
        contacts[label] = API["contact_at"](world_point, fit["contact"], f"{slug} {label}")
        contacts[label]["gap"] = round(world_point.z - contacts[label]["z"], 5)
        API["need"](-.007 <= contacts[label]["gap"] <= .018,
                    f"{slug}: {label} misses its supporting surface: {contacts[label]['gap']} m")
    return {"contacts": contacts, "sourceFront": "-Y", "yaw": fit["yaw"], "pitch": fit.get("pitch", 0), "scale": scale,
            "worldBoundsZUp": [API["compact"](v) for v in API["bounds"]([actor])]}


def check_set_clearance(scene, actor):
    def world_tree(obj):
        return BVHTree.FromPolygons([obj.matrix_world @ v.co for v in obj.data.vertices],
                                    [list(p.vertices) for p in obj.data.polygons])

    tree = world_tree(actor)
    low, high = API["bounds"]([actor])
    checked = []
    for obj in scene.objects:
        if obj.type != "MESH" or obj == actor or not obj.data.polygons:
            continue
        box = [obj.matrix_world @ Vector(p) for p in obj.bound_box]
        if any(max(p[a] for p in box) < low[a] or min(p[a] for p in box) > high[a] for a in range(3)):
            continue
        API["need"](not tree.overlap(world_tree(obj)), f"Tripo intersects set mesh {obj.name}")
        checked.append(obj.name)
    return checked


STATIONS = {
    "cosplayer": [((.15, -4.67, 2.15), (.03, .00, 1.51), 46, 52),
                  ((2.85, -3.72, 2.19), (.06, .04, 1.45), 48, 51)],
    "diamond": [((.66, -4.44, 2.06), (-.12, .12, 1.55), 47, 53),
                ((-2.41, -4.08, 2.17), (-.13, .16, 1.48), 47, 53)],
    "2025-36": [((.38, -4.12, 2.13), (.0, .10, 1.65), 48, 49),
                ((-2.26, -3.60, 2.02), (.0, .09, 1.58), 47, 49)],
}


def set_cameras(scene, slug, metadata):
    if slug == "2025-36":
        metadata["look"].update(key="#ffe5ce", fill="#a1baff", ground="#70424f",
                                keyIntensity=3.2, fillIntensity=1.95, skyIntensity=1.15)
    for i, (position, target, fov, mobile_fov) in enumerate(STATIONS[slug]):
        metadata["views"][i].update(position=LEGACY["y_up"](position), target=LEGACY["y_up"](target),
                                    fov=fov, mobileFov=mobile_fov)
        for suffix, angle in (("", fov), ("-mobile", mobile_fov)):
            camera = scene.objects[f"view-{i}{suffix}"]
            camera.location = position
            camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
            camera.data.sensor_fit = "VERTICAL"
            camera.data.lens = camera.data.sensor_height / (2 * math.tan(math.radians(angle) / 2))


def export(scene, actor, path):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in scene.objects:
        if obj.type == "MESH" and obj.data.polygons:
            obj.select_set(True)
    for _ in range(4):
        bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                                 export_yup=True, export_texcoords=False, export_cameras=False,
                                 export_lights=False, export_animations=False, export_vertex_color="ACTIVE")
        size = path.stat().st_size
        if size <= 3 * 1024 * 1024:
            break
        simplify(actor, round(len(actor.data.polygons) * .68))
    API["need"](size <= 3 * 1024 * 1024, f"{path}: {size:,} exceeds 3 MiB")
    doc = API["glb_info"](path)
    nodes = [node for node in doc["nodes"] if node["name"].startswith("Tripo |")]
    API["need"](len(nodes) == 1 and all("mesh" in node for node in doc["nodes"]), "Unexpected delivery nodes")
    primitives = doc["meshes"][nodes[0]["mesh"]]["primitives"]
    API["need"](all("COLOR_0" in primitive["attributes"] for primitive in primitives), "Tripo color fields missing")
    return {"glbBytes": size, "triangles": sum(doc["accessors"][p["indices"]]["count"] // 3 for p in primitives),
            "meshCount": len(doc["meshes"])}


def build(slug, old, evidence, draft):
    folder = evidence / slug
    source = API["read_json"](folder / "source/source.json")
    base = old / "角色重製" / slug / "base"
    prepare = API["read_json"](base / "prepare.json")
    scene = API["open_blend"](base / "base.blend")
    output = evidence / "publish-ready" / slug
    output.mkdir(parents=True, exist_ok=True)
    folder.mkdir(parents=True, exist_ok=True)
    baseline = folder / "before"
    baseline.mkdir(exist_ok=True)
    if not (baseline / "room.json").exists():
        old_room = old / "final" / slug
        for name in FILES:
            original = old_room / name
            if not original.is_file():
                original = API["room_path"](slug) / name
            shutil.copyfile(original, baseline / name)
    placement = {"source": source, "legacyMeshesRemoved": prepare["removed"]}
    if slug == "cosplayer":
        placement["setEdits"] = prepare_cosplayer(scene, old / "blends" / f"{slug}.blend")
    actor = append_sculpture(slug, folder / "source/sculpture.blend")
    if slug == "2025-36":
        placement["removedSourcePedestalBelowZ"] = remove_pair_base(actor)
    fit = FIT[slug]
    simplify(actor, fit["triangles"])
    placement["meshCleaned"] = actor.data.validate(clean_customdata=True)
    if slug == "cosplayer":
        placement["seatLevelCorrectionSourceZ"] = level_cosplayer_seat(actor)
    paint(slug, actor)
    placement.update(place(slug, actor, fit))
    placement["setMeshesCheckedForIntersections"] = check_set_clearance(scene, actor)
    metadata = API["read_json"](baseline / "room.json")
    set_cameras(scene, slug, metadata)
    scene.camera = scene.objects["view-0"]
    scene.view_settings.view_transform = "AgX"
    stats = export(scene, actor, output / "scene.glb")
    API["write_json"](output / "room.json", metadata)
    API["write_json"](folder / "placement.json", placement)
    API["save_blend"](folder / "room.blend")
    LEGACY["configure_render"](scene, "proof" if draft else "final", False)
    for name in VIEWS:
        size = (398, 620) if name.endswith("-mobile") else (800, 500)
        if not draft:
            size = (720, 1120) if name.endswith("-mobile") else (1440, 900)
        image = folder / f"{name}.png"
        LEGACY["render"](scene, scene.objects[name], image, size)
        if not draft:
            LEGACY["to_webp"](image, output / f"{name}.webp")
    if not draft:
        four = folder / "four-sides"
        four.mkdir(exist_ok=True)
        for obj in scene.objects:
            if obj != actor and obj.type == "MESH":
                obj.hide_render = True
        low, high = API["bounds"]([actor])
        LEGACY["configure_render"](scene, "gray", False)
        scene.display.shading.show_shadows = False
        orthographic_views(scene, four, (low + high) / 2, max(high - low),
                           {name: vector for name, vector in DIRECTIONS.items() if name != "top"})
    stats["draft"] = draft
    stats["hashes"] = {name: API["digest"](output / name) for name in FILES if (output / name).is_file()}
    API["write_json"](folder / "delivery.json", stats)
    print(f"BUILT {slug}: {stats['glbBytes']:,} bytes, {stats['triangles']:,} Tripo triangles", flush=True)


def install(slug, evidence):
    folder = evidence / slug
    delivery = API["read_json"](folder / "delivery.json")
    checks = API["read_json"](evidence / "webgl/verification.json")
    output = evidence / "publish-ready" / slug
    hashes = {name: API["digest"](output / name) for name in FILES}
    API["need"](not delivery["draft"] and hashes == delivery["hashes"]
                and checks[slug]["hashes"] == hashes and checks[slug]["mobileStations"] == 2,
                f"{slug}: final package and two-station WebGL proof must match")
    start = API["read_json"](folder / "source/source.json")["baselineHashes"]
    current = API["room_hashes"](slug)
    if current == hashes:
        print(f"ALREADY INSTALLED {slug}", flush=True)
        return
    if current != start:
        print(f"CONFLICT {slug}: public bytes changed, keeping only the publish-ready package", flush=True)
        return
    root = API["room_path"](slug)
    originals = {name: (root / name).read_bytes() for name in FILES}
    replaced = []
    try:
        for name in FILES:
            target = root / name
            API["need"](API["digest"](target) == start[name], f"{slug}: concurrent edit of {name}")
            staged = target.with_name(f".{name}.trio.tmp")
            shutil.copyfile(output / name, staged)
            staged.replace(target)
            replaced.append(name)
    except (OSError, ValueError):
        for name in replaced:
            target = root / name
            if API["digest"](target) == hashes[name]:
                target.write_bytes(originals[name])
        raise
    API["need"](API["room_hashes"](slug) == hashes, f"{slug}: installed package changed")
    print(f"INSTALLED {slug}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("phase", choices=("inspect", "draft", "final", "install"))
    parser.add_argument("--evidence", type=Path, default=TRIPO / "2025後三件")
    parser.add_argument("--source-root", type=Path, default=TRIPO / "tripo")
    parser.add_argument("--old", type=Path, default=OLD)
    parser.add_argument("--only", choices=SLUGS, nargs="+", default=SLUGS)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    for slug in args.only:
        if args.phase == "inspect":
            inspect(slug, args.source_root, args.old, args.evidence)
        elif args.phase == "install":
            install(slug, args.evidence)
        else:
            build(slug, args.old, args.evidence, args.phase == "draft")


if __name__ == "__main__":
    main()
