"""Refine the original Tripo meshes for solitude and mirror."""

import argparse
import json
import math
import runpy
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

HERE = Path(__file__).resolve().parent
API = runpy.run_path(str(HERE / "tripo_actors.py"))
LEGACY = API["LEGACY"]
SLUGS = ("solitude", "mirror")
VIEWS = ("view-0", "view-1", "view-0-mobile", "view-1-mobile")
INSTALL_FILES = ("scene.glb", "room.json", *(name + ".webp" for name in VIEWS))
CLOSEUP_FILES = ("view-0.webp", "view-0-mobile.webp", "room.json")


def process_raw(slug, source, output):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new("Gray review")
    original = API["import_meshes"](source)
    objects = []
    for name, mesh, matrix in original:
        obj = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(obj)
        obj.matrix_world = matrix
        objects.append(obj)
    lower, upper = API["bounds"](objects)
    raw_triangles = sum(len(obj.data.polygons) for obj in objects)
    # Keep a detailed, editable working mesh and derive a separate delivery mesh.
    for obj in objects:
        simplify(obj, min(.21, 155_000 / raw_triangles))
    lower, upper = API["bounds"](objects)
    output.mkdir(parents=True, exist_ok=True)
    for obj in objects:
        obj["raw_glb_sha256"] = API["digest"](source)
    API["save_blend"](output / "actor-review.blend")
    LEGACY["configure_render"](scene, "gray", False)
    scene.display.shading.show_cavity = False
    scene.display.shading.show_specular_highlight = False
    center = (lower + upper) / 2
    extent = max(upper - lower)
    for name, direction in {
        "front": (0, -1, .09), "side": (1, 0, .09), "back": (0, 1, .09),
        "other-side": (-1, 0, .09), "top": (0, -.005, 1),
        "three-quarter": (.64, -1, .28),
    }.items():
        cam = ortho(name, center, direction, extent * 1.18)
        LEGACY["render"](scene, cam, output / f"{name}.png", (650, 650))
    API["write_json"](output / "raw.json", {
        "slug": slug, "triangles": raw_triangles, "boundsZUp": [list(lower), list(upper)],
        "center": list(center), "sha256": API["digest"](source),
        "reviewTriangles": sum(len(obj.data.polygons) for obj in objects),
    })


def simplify(obj, ratio):
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new("Preserve Tripo surface", "DECIMATE")
    mod.ratio = ratio
    mod.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=mod.name)


def ortho(name, point, direction, width):
    cam = LEGACY["camera"](name, Vector(point) + Vector(direction).normalized() * width * 2.5, point, 45)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = width
    return cam


def append_actor(path):
    with bpy.data.libraries.load(str(path), link=False) as (source, destination):
        destination.objects = source.objects
    collection = bpy.data.collections.new("Tripo source sculpture")
    bpy.context.scene.collection.children.link(collection)
    objects = []
    for obj in destination.objects:
        if obj and obj.type == "MESH":
            collection.objects.link(obj)
            obj.name = "Tripo | " + obj.name
            objects.append(obj)
    API["need"](len(objects) == 1, "This source revision expects one body mesh")
    return objects[0]


def raw_points(obj):
    return [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]


def lowest(points, select):
    subset = [p for p in points if select(p)]
    floor = min(p.z for p in subset)
    at_floor = [p for p in subset if p.z < floor + .003]
    center = sum(at_floor, Vector((0, 0, 0))) / len(at_floor)
    center.z = floor
    return center


def closest(points, coords):
    target = Vector(coords)
    return min(points, key=lambda p: (p - target).length_squared)


def position_actor(slug, actor, raw_bounds):
    points = raw_points(actor)
    initial = actor.matrix_world.copy()
    if slug == "solitude":
        seat = lowest(points, lambda p: -.30 < p.x < -.045 and p.y > -.025)
        shoe = lowest(points, lambda p: p.x > .34)
        palm = lowest(points, lambda p: p.x < -.405)
        markers = {"seat": seat, "extendedShoe": shoe, "supportPalm": palm,
                   "face": closest(points, (-.034, -.154, .623)),
                   "chinHand": closest(points, (.005, -.162, .536))}
        scale, yaw = 1.98, 6.0
        rotation = Matrix.Rotation(math.radians(yaw), 4, "Z")
        base = rotation @ Matrix.Scale(scale, 4)
        shift = Vector((-.26, -.91, .141)) - Vector(((base @ seat).x, (base @ seat).y, (base @ shoe).z))
        world = Matrix.Translation(shift) @ base
        shape_rain_seat({name: world @ p for name, p in markers.items()})
        LEGACY["light"]("Rain bounce on face", "#eff1ef", 62, (1.63, -3.41, 2.26), (.02, -1.02, 1.37), 1.8)
    else:
        shoe_left = lowest(points, lambda p: p.x < 0)
        shoe_right = lowest(points, lambda p: p.x > 0)
        foot = (shoe_left + shoe_right) / 2
        foot.z = min(shoe_left.z, shoe_right.z)
        scale, yaw = 2.59, 158.0
        base = Matrix.Rotation(math.radians(yaw), 4, "Z") @ Matrix.Scale(scale, 4)
        forward_edge = max((base @ p).y for p in points)
        pivot = base @ foot
        shift = Vector((.685 - pivot.x, .242 - forward_edge, .003 - pivot.z))
        world = Matrix.Translation(shift) @ base
        fingers = [p for p in points if p.x > .080 and .80 < p.z < .895]
        fingertip = max(fingers, key=lambda p: (world @ p).y)
        markers = {"leftSole": shoe_left, "rightSole": shoe_right, "mirrorFingertip": fingertip,
                   "face": closest(points, (.025, -.091, .875)),
                   "lowerHand": closest(points, (-.114, .028, .430))}
        move_vanity()
    actor.matrix_world = world @ initial
    actor["source_to_room"] = [float(n) for row in world for n in row]
    placed = {name: list(world @ co) for name, co in markers.items()}
    for name, co in placed.items():
        API["locator"](f"Tripo checked | {name}", co, yaw, .095)
    return {name: list(co) for name, co in markers.items()}, placed


def shape_rain_seat(markers):
    model = LEGACY["Model"](202511)
    model.material("rain-dark stone", "#7b8285", .31, .08)
    model.material("slate seat edge", "#626c70", .38)
    seat, palm, shoe = [markers[name] for name in ("seat", "supportPalm", "extendedShoe")]
    left = min(palm.x, seat.x - .35) - .13
    right = min(shoe.x - .20, seat.x + .54)
    y_min, y_max = min(seat.y - .32, palm.y - .12), max(seat.y + .31, palm.y + .13)
    top = max(.158, seat.z + .003)
    bottom = .128
    model.round_box("Low wet waiting ledge", "rain-dark stone", ((left + right) / 2, (y_min + y_max) / 2, (bottom + top) / 2),
                    (right - left, y_max - y_min, top - bottom), .007)
    model.box("Ledge straight seam", "slate seat edge", ((left + right) / 2, y_min - .001, .147),
              (right - left - .04, .006, .009))
    model.emit()
    for obj in bpy.context.scene.objects:
        if obj.name.startswith("waiting bag "):
            obj.location += Vector((.311, -1.01, -.466))


def move_vanity():
    parts = ("Solid vanity ledges", "Vanity cabinet", "Glazed vanity doors", "Long cabinet handles",
             "Basin ", "Faucet ", "Folded metal faucet")
    bottles = ("Vanity toiletry", "Paper bottle labels", "Toiletry cap", "Soap pump")
    flowers = ("Dark green flower vase", "Vase mouth", "Lily ", "White lily petals")
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(parts):
            for vertex in obj.data.vertices:
                x = vertex.co.x - .73
                vertex.co.x = x if x < .04 else .04 + (x - .04) * .27
            obj.data.update()
        elif obj.name.startswith(bottles):
            obj.location.x -= 1.21
        elif obj.name.startswith(flowers):
            obj.location.x -= .38
    window = bpy.data.materials["mirror smoke"]
    bsdf = window.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Alpha"].default_value = .08
    bsdf.inputs["Emission Strength"].default_value = .15


def make_reflection(actor, landmarks):
    plane = .288
    transform = Matrix.Translation((0, 2 * plane, 0)) @ Matrix.Diagonal((1, -1, 1, 1))
    reflected = bpy.data.objects.new("Tripo | Linked reflection", actor.data)
    bpy.context.scene.collection.objects.link(reflected)
    reflected.matrix_world = transform @ actor.matrix_world
    toe, top = API["bounds"]([actor])
    API["need"](top.y < .26, f"Body reaches mirror pane: {top.y:.4f}")
    finger = Vector(landmarks["mirrorFingertip"])
    x = abs(finger.x + .32)
    API["need"](x < 1.115 and 1.18 < finger.z < 2.6 + math.sqrt(1.13**2 - x**2),
                f"Extended fingers miss the arch: {finger}")
    return {"planeY": plane, "sameMesh": reflected.data is actor.data,
            "fingerGapMeters": round(plane - finger.y, 5), "minBodyZ": toe.z,
            "surfaceClearanceMeters": round(.275 - top.y, 5)}


STATIONS = {
    "solitude": [
        ("靜坐雨街", "從雨棚開口看斜坐的人、一手撐住的濕座沿，以及街口電線。", (.87, -4.02, 1.43), (.00, -.82, .93), 44, 52),
        ("座沿旁", "斜看托腮手、收折腿與跨到人行道的鞋，玻璃水珠與淺包分在不同深度。", (2.69, -2.97, 1.44), (.0, -.80, .93), 46, 53),
    ],
    "mirror": [
        ("鏡前半身", "近看鏡內外的側臉與相對的指尖，拱框和白花掠過畫面邊緣。", (-2.38, -.62, 2.50), (.55, .26, 2.03), 25, 34),
        ("指尖與台面", "從鏡側讀指尖到玻璃的距離，白花、龍頭與妝台輪廓形成前後層次。", (-3.40, -1.86, 2.66), (.02, .13, 2.15), 44, 52),
    ],
}


def author_station(metadata, index, station):
    label, description, pos, target, fov, mobile_fov = station
    metadata["views"][index] = {"label": label, "description": description,
                                "position": LEGACY["y_up"](pos), "target": LEGACY["y_up"](target),
                                "fov": fov, "mobileFov": mobile_fov}
    orient_camera(bpy.data.objects[f"view-{index}"], pos, target, fov)
    orient_camera(bpy.data.objects[f"view-{index}-mobile"], pos, target, mobile_fov)


def author_views(slug, metadata):
    for i, station in enumerate(STATIONS[slug]):
        author_station(metadata, i, station)
    if slug == "solitude":
        orient_camera(bpy.data.objects["side-inspection"], (-2.60, -2.34, 1.54), (-.16, -.81, .91), 52)
    else:
        orient_camera(bpy.data.objects["side-inspection"], (-2.81, 2.55, 3.51), (.49, .42, 2.06), 50)


def detail_review(scene, slug, output, landmarks):
    groups = (["seat", "supportPalm", "extendedShoe"], ["face", "chinHand"]) if slug == "solitude" else (
        ["leftSole", "rightSole"], ["face", "mirrorFingertip"], ["lowerHand"])
    for i, group in enumerate(groups):
        p = sum((Vector(landmarks[name]) for name in group), Vector((0, 0, 0))) / len(group)
        offset = Vector((-.8, -1.3, .5)) if slug == "solitude" else (
            Vector((.79, -.55, .34)) if i == 0 else Vector((-.82, -.56, .13)))
        cam = LEGACY["camera"](f"QA {i}", p + offset, p, 45 if i == 0 else 35)
        LEGACY["render"](scene, cam, output / f"detail-{i}.png", (760, 620))


def fade(value, a, b):
    f = max(0.0, min(1.0, (value - a) / (b - a)))
    return f * f * (3 - 2 * f)


def inside(value, low, high, soft=.012):
    return fade(value, low - soft, low + soft) * (1 - fade(value, high - soft, high + soft))


def oval_mask(x, z, cx, cz, rx, rz, softness=.16):
    distance = math.hypot((x - cx) / rx, (z - cz) / rz)
    return 1 - fade(distance, 1 - softness, 1 + softness)


PALETTES = {
    "solitude": {"cloth": "#c2c9cb", "skirt": "#aeb9bc", "skin": "#dbc2ba", "hair": "#4a5158",
                 "hat": "#c9cecc", "socks": "#d4d7d3", "shoe": "#8b969d", "sole": "#3f4a51",
                 "lip": "#9d747b", "iris": "#4e6274"},
    "mirror": {"cloth": "#202738", "pants": "#2a3244", "skin": "#e3c6c0", "hair": "#253853",
               "top": "#bac8c7", "frames": "#322932", "metal": "#819f9f", "shoes": "#1b2230",
               "lip": "#a97783", "iris": "#6c89a5"},
}
RGB = {room: {name: tuple(int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)) for name, value in colors.items()}
       for room, colors in PALETTES.items()}


def solitude_color(p, lower, upper):
    x = (p.x - lower.x) / (upper.x - lower.x)
    z = (p.z - lower.z) / (upper.z - lower.z)
    y = p.y
    entries = [
        ("skirt", inside(x, .255, .61, .025) * (1 - fade(z, .215 + .22 * (x - .38), .265 + .22 * (x - .38)))),
        ("skin", inside(x, .482, .840, .028) * inside(z, .140, .447, .024)
         * max(fade(x, .61, .68), 1 - fade(y, -.058, -.006))),
        ("skin", (1 - fade(x, .115, .167)) * (1 - fade(z, .053, .106))),
        ("socks", inside(x, .796, .890, .021) * inside(z, .129, .216, .021)),
        ("socks", inside(x, .53, .65) * inside(z, .064, .160) * fade(y, .044, .110)),
        ("shoe", fade(x, .779, .846) * (1 - fade(z, .121, .149))),
        ("shoe", inside(x, .605, .779, .016) * (1 - fade(z, .112, .137)) * fade(y, .014, .060)),
        ("sole", fade(x, .823, .881) * (1 - fade(z, .021, .043))),
        ("sole", inside(x, .606, .755, .017) * (1 - fade(z, .033, .052)) * fade(y, .046, .079)),
        ("hair", inside(x, .285, .582, .022) * fade(z, .645, .692)),
        ("hat", inside(x, .240, .545, .035) * fade(z, .749 + .64 * (x - .285), .775 + .64 * (x - .285))),
        ("skin", oval_mask(x, z, .462, .778, .072, .084) * (1 - fade(y, -.033, .034))),
        ("skin", oval_mask(x, z, .430, .687, .043, .048) * (1 - fade(y, .01, .064))),
        ("skin", oval_mask(x, z, .497, .675, .046, .048) * (1 - fade(y, -.079, -.038))),
        ("lip", oval_mask(x, z, .484, .748, .017, .007) * (1 - fade(y, -.104, -.070)) * .57),
    ]
    return entries


def mirror_color(p, lower, upper):
    u = .842 * p.x + .539 * p.y
    depth = .539 * p.x - .842 * p.y
    z = (p.z - lower.z) / (upper.z - lower.z)
    face_front = fade(depth, .040, .061)
    entries = [
        ("pants", 1 - fade(z, .515, .561)),
        ("shoes", 1 - fade(z, .039, .058)),
        ("top", inside(u, -.039 + max(0, .78 - z) * .12, .040, .009)
         * inside(z, .598, .828, .013) * fade(depth, .021, .042)),
        ("top", inside(u, -.049, .048, .011) * inside(z, .797, .852, .009) * fade(depth, .006, .039)),
        ("hair", fade(z, .849, .884) * (1 - fade(z, 1.01, 1.03))),
        ("hair", inside(u, -.111, .095, .015) * fade(z, .702, .742) * (1 - fade(depth, -.001, .038))),
        ("hair", inside(z, .765, .931, .020) * fade(abs(u), .043, .067) * (1 - fade(abs(u), .098, .119))),
        ("skin", oval_mask(u, z, -.003, .877, .053, .056, .18) * face_front),
        ("skin", inside(u, .056, .129, .014) * inside(z, .757, .891, .015) * fade(depth, .041, .074)),
        ("skin", inside(u, -.151, -.089, .013) * inside(z, .391, .510, .016)),
        ("frames", inside(z, .922, .953, .007) * inside(u, -.067, .063, .008) * fade(depth, .051, .077)),
        ("metal", oval_mask(u, z, -.057, .856, .014, .019) * fade(depth, .020, .037) * .74),
        ("lip", oval_mask(u, z, -.002, .852, .019, .007) * fade(depth, .065, .083) * .66),
    ]
    return entries


def eye_projection(slug, mesh, original, raw_bounds):
    # Marks are measured against the raw 650 px three-quarter orthographic renders.
    eye_locations = {"solitude": ((278.5, 187.0), (323.5, 171.3)),
                     "mirror": ((304.0, 115.0), (335.8, 115.6))}
    lower, upper = raw_bounds
    center = (lower + upper) / 2
    width = max(upper - lower) * 1.18
    direction = Vector((.64, -1, .28)).normalized()
    horizontal = Vector((0, 0, 1)).cross(direction).normalized()
    vertical = direction.cross(horizontal)
    geometry = BVHTree.FromPolygons([original @ v.co for v in mesh.vertices],
                                    [tuple(face.vertices) for face in mesh.polygons], all_triangles=True)
    marks = []
    for x, y in eye_locations[slug]:
        start = center + width / 650 * ((x - 325) * horizontal - (y - 325) * vertical)
        eye, _, _, _ = geometry.ray_cast(start + direction * 2, -direction, 4)
        if eye is not None:
            marks.append((x, y, (eye - center).dot(direction)))

    def overlays(point):
        local = point - center
        x = 325 + local.dot(horizontal) / width * 650
        y = 325 - local.dot(vertical) / width * 650
        if not 263 < x < 350 or not (100 < y < 205):
            return []
        depth = local.dot(direction)
        color = []
        for ex, ey, surface in marks:
            close = 1 - fade(abs(depth - surface), .003, .017)
            eyelid = (y - ey) + (.21 * (x - ex) if slug == "solitude" else 0)
            color.extend((
                ((.79, .80, .78), oval_mask(x, eyelid, ex, 0, 8.1, 3.6) * close * .79),
                (RGB[slug]["iris"], oval_mask(x, eyelid, ex + 1.0, -.50, 3.4, 3.8) * close),
                ((.17, .19, .23), oval_mask(x, eyelid, ex + 1.1, -.73, 2.05, 2.6) * close),
                ((.87, .90, .91), oval_mask(x, eyelid, ex + .1, -1.9, 1.11, 1.22, .32) * close * .81),
            ))
        return color

    return overlays


def paint(slug, actor, raw_bounds):
    lower, upper = raw_bounds
    original = Matrix([actor["source_to_room"][i:i + 4] for i in range(0, 16, 4)]).inverted() @ actor.matrix_world
    palette = RGB[slug]
    mask = solitude_color if slug == "solitude" else mirror_color
    eyes = eye_projection(slug, actor.data, original, raw_bounds)
    colors = []
    for vertex in actor.data.vertices:
        p = original @ vertex.co
        color = palette["cloth"]
        for name, coverage in mask(p, lower, upper):
            rgb = palette[name]
            color = tuple(a + (b - a) * coverage for a, b in zip(color, rgb))
        for rgb, coverage in eyes(p):
            color = tuple(a + (b - a) * coverage for a, b in zip(color, rgb))
        grain = (.5 - (math.sin(p.x * 99 + p.y * 81) * math.sin(p.z * 154))) * .018
        colors.extend((min(1, color[0] * (1 + grain)), min(1, color[1] * (1 + grain)),
                       min(1, color[2] * (1 + grain)), 1))
    mesh = actor.data
    attr = mesh.color_attributes.new(name="Original palette", type="BYTE_COLOR", domain="POINT")
    attr.data.foreach_set("color_srgb", colors)
    mesh.color_attributes.active_color = attr
    mat = bpy.data.materials.new("Tripo sculpture / original palette")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = .52 if slug == "mirror" else .65
    color_node = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    color_node.layer_name = attr.name
    mat.node_tree.links.new(color_node.outputs["Color"], bsdf.inputs["Base Color"])
    mesh.materials.clear()
    mesh.materials.append(mat)


def pose_and_views(slug, evidence, phase):
    paths = evidence / "角色重製" / slug
    output = paths / phase
    output.mkdir(parents=True, exist_ok=True)
    scene = API["open_blend"](paths / "base/base.blend")
    snapshot = API["room_hashes"](slug)
    actor = append_actor(paths / "raw/actor-review.blend")
    raw_bounds = API["bounds"]([actor])
    source_landmarks, placed_landmarks = position_actor(slug, actor, raw_bounds)
    metadata = API["read_json"](API["room_path"](slug) / "room.json")
    author_views(slug, metadata)
    if phase != "fit":
        simplify(actor, min(1.0, 49_500 / len(actor.data.polygons)))
        paint(slug, actor, raw_bounds)
    mirror_fit = make_reflection(actor, placed_landmarks) if slug == "mirror" else None
    supports = ({"seat": "Low wet waiting ledge", "supportPalm": "Low wet waiting ledge",
                 "extendedShoe": "sidewalk /"} if slug == "solitude" else
                {"leftSole": "ground floor /", "rightSole": "ground floor /"})
    contacts = [API["contact_at"](Vector(placed_landmarks[key]), (part,), key) for key, part in supports.items()]
    scene.camera = bpy.data.objects["view-0"]
    if phase == "final":
        API["save_blend"](output / "room.blend")
        scene = API["open_blend"](output / "room.blend")
        deliver(slug, scene, output, metadata)
    else:
        LEGACY["configure_render"](scene, "gray" if phase == "fit" else "proof", False)
        for name in (*VIEWS, "side-inspection"):
            size = (408, 630) if name.endswith("-mobile") else (896, 548)
            LEGACY["render"](scene, bpy.data.objects[name], output / f"{name}.png", size)
        if phase == "fit":
            detail_review(scene, slug, output, placed_landmarks)
    API["write_json"](output / "placement.json", {
        "slug": slug, "source": API["read_json"](paths / "raw/raw.json"),
        "sourceLandmarks": source_landmarks, "placedLandmarks": placed_landmarks,
        "supports": contacts, "mirror": mirror_fit, "baselineHashes": snapshot,
    })


def orient_camera(cam, position, target, fov):
    cam.location = position
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = cam.data.sensor_height / (2 * math.tan(math.radians(fov) / 2))


def deliver(slug, scene, output, metadata):
    fill = scene.view_settings
    fill.view_transform = "AgX"
    bpy.ops.object.select_all(action="DESELECT")
    for obj in scene.objects:
        if obj.type == "MESH":
            obj.select_set(True)
    target = output / "scene.glb"
    bpy.ops.export_scene.gltf(filepath=str(target), export_format="GLB", use_selection=True,
                             export_yup=True, export_cameras=False, export_lights=False,
                             export_animations=False, export_vertex_color="ACTIVE")
    doc = API["glb_info"](target)
    API["need"](target.stat().st_size <= 2_500_000, f"{slug}: export is {target.stat().st_size:,} bytes")
    API["need"](all("mesh" in node for node in doc["nodes"]), "Delivery GLB includes a control object")
    hero_meshes = [node["mesh"] for node in doc["nodes"] if "Tripo |" in node["name"]]
    API["need"](len(hero_meshes) == (2 if slug == "mirror" else 1) and len(set(hero_meshes)) == 1,
                "Expected one authored Tripo body mesh")
    API["need"](all("COLOR_0" in primitive["attributes"]
                    for primitive in doc["meshes"][hero_meshes[0]]["primitives"]), "Body colors did not export")
    LEGACY["configure_render"](scene, "final", False)
    for name in (*VIEWS, "side-inspection"):
        size = (720, 1120) if name.endswith("-mobile") else (1440, 900)
        if name == "side-inspection":
            size = (1056, 660)
        path = output / f"{name}.png"
        LEGACY["render"](scene, bpy.data.objects[name], path, size)
        if name in VIEWS:
            LEGACY["to_webp"](path, output / f"{name}.webp")
    API["write_json"](output / "room.json", metadata)
    stats = {
        "glbBytes": target.stat().st_size, "tripoInstances": len(hero_meshes),
        "tripoTriangles": sum(doc["accessors"][p["indices"]]["count"] // 3
                             for p in doc["meshes"][hero_meshes[0]]["primitives"]),
        "meshes": len(doc["meshes"]), "embeddedColors": True,
        "hashes": {name: API["digest"](output / name) for name in INSTALL_FILES},
    }
    API["write_json"](output / "delivery.json", stats)
    print(f"FINAL {slug} {stats['glbBytes']:,} bytes, {stats['tripoTriangles']:,} Tripo triangles", flush=True)


def update_room_files(slug, output, files, baseline, reviewed):
    API["need"](baseline == API["room_hashes"](slug), "Public assets changed after review")
    root = API["room_path"](slug)
    originals = {name: (root / name).read_bytes() for name in files}
    API["need"](all(API["digest"](output / name) == reviewed[name] for name in files),
                "Candidate output changed after review")
    replaced = []
    try:
        for name in files:
            destination = root / name
            temp = destination.with_name("." + destination.name + ".tripo.tmp")
            temp.write_bytes((output / name).read_bytes())
            temp.replace(destination)
            replaced.append(name)
    except OSError:
        for name in replaced:
            (root / name).write_bytes(originals[name])
        raise
    print(f"INSTALLED {slug}", flush=True)


def install(slug, evidence):
    output = evidence / "角色重製" / slug / "final"
    placement = API["read_json"](output / "placement.json")
    delivery = API["read_json"](output / "delivery.json")
    update_room_files(slug, output, INSTALL_FILES, placement["baselineHashes"], delivery["hashes"])


def mirror_closeup(evidence, install_now):
    root = evidence / "角色重製" / "mirror"
    output = root / "closeup"
    if install_now:
        review = API["read_json"](output / "review.json")
        update_room_files("mirror", output, CLOSEUP_FILES, review["baseline"], review["hashes"])
        return
    baseline = API["room_hashes"]("mirror")
    final = root / "final"
    API["need"](baseline["scene.glb"] == API["digest"](final / "scene.glb"),
                "Mirror GLB has changed since the saved source blend")
    meta = API["read_json"](API["room_path"]("mirror") / "room.json")
    scene = API["open_blend"](final / "room.blend")
    author_station(meta, 0, STATIONS["mirror"][0])
    scene.camera = bpy.data.objects["view-0"]
    output.mkdir(parents=True, exist_ok=True)
    API["save_blend"](output / "room.blend")
    LEGACY["configure_render"](scene, "final", False)
    for name, size in (("view-0", (1440, 900)), ("view-0-mobile", (720, 1120))):
        path = output / f"{name}.png"
        LEGACY["render"](scene, bpy.data.objects[name], path, size)
        LEGACY["to_webp"](path, output / f"{name}.webp")
    API["write_json"](output / "room.json", meta)
    API["write_json"](output / "review.json", {"baseline": baseline,
                      "hashes": {name: API["digest"](output / name) for name in CLOSEUP_FILES}})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("phase", choices=("inspect", "fit", "proof", "final", "install",
                                          "mirror-closeup", "install-mirror-closeup"))
    parser.add_argument("--evidence", required=True, type=Path)
    parser.add_argument("--source-root", type=Path)
    parser.add_argument("--only", nargs="+", choices=SLUGS)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    if args.phase in ("mirror-closeup", "install-mirror-closeup"):
        if args.only and args.only != ["mirror"]:
            parser.error("The close-up operation applies to mirror")
        mirror_closeup(args.evidence, args.phase == "install-mirror-closeup")
        return
    for slug in args.only or SLUGS:
        if args.phase == "inspect":
            if not args.source_root:
                parser.error("inspect requires --source-root")
            process_raw(slug, args.source_root / f"{slug}.glb", args.evidence / "角色重製" / slug / "raw")
        elif args.phase == "install":
            install(slug, args.evidence)
        else:
            pose_and_views(slug, args.evidence, args.phase)


if __name__ == "__main__":
    main()
