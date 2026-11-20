"""Build the five 2024 Painted Worlds scenes with Blender 5.3.

blender --background --factory-startup --python-exit-code 1 --python build_2024.py -- --evidence PATH --phase clay
Repeat with --phase preview or final. --only accepts one or more room IDs.
"""

import argparse
import json
import math
import random
import struct
import sys
import time
from collections import defaultdict
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
import scenes_2024

ROOT = Path(__file__).resolve().parents[2]
ROOMS = ROOT / "public" / "painted-worlds" / "rooms"
REPEATED_MESHES = {
    "Glazed floor tile", "Damp setts", "Rectangular dark terrazzo floor tile", "Wind-carried flake",
    "Hand-curved corolla petal", "Pollen bead", "Grid inlaid in navy ground", "Dark blue back wall grid",
    "Fluted theatre cyclorama", "Tower bronze mullion / glazing",
}


def color(hex_color):
    rgb = [int(hex_color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    return tuple(c / 12.92 if c < 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb)


class Studio:
    def __init__(self, seed):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.scene = bpy.context.scene
        self.scene.render.threads_mode = "FIXED"
        self.scene.render.threads = 5
        self.scene.view_settings.view_transform = "AgX"
        self.rng = random.Random(seed)
        self.group = None
        self.section("Architecture")

    def section(self, name):
        self.group = bpy.data.collections.new(name)
        self.scene.collection.children.link(self.group)

    def material(self, name, hue, *, rough=.6, metal=0, glow=0, glass=0, coat=0):
        material = bpy.data.materials.new(name)
        tint = (*color(hue), 1)
        material.diffuse_color = tint
        material.use_nodes = True
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = tint
        bsdf.inputs["Roughness"].default_value = rough
        bsdf.inputs["Metallic"].default_value = metal
        bsdf.inputs["Transmission Weight"].default_value = glass
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = .16
        if glow:
            bsdf.inputs["Emission Color"].default_value = tint
            bsdf.inputs["Emission Strength"].default_value = glow
        return material

    def mesh(self, name, vertices, faces, material, *, smooth=False, recalc=False):
        data = bpy.data.meshes.new(name)
        data.from_pydata(vertices, [], faces)
        if recalc:
            self.normals(data)
        data.update()
        obj = bpy.data.objects.new(name, data)
        self.group.objects.link(obj)
        if material:
            data.materials.append(material)
        if smooth:
            data.polygons.foreach_set("use_smooth", [True] * len(data.polygons))
        return obj

    @staticmethod
    def normals(data):
        mesh = bmesh.new()
        mesh.from_mesh(data)
        bmesh.ops.recalc_face_normals(mesh, faces=mesh.faces)
        mesh.to_mesh(data)
        mesh.free()

    @staticmethod
    def bevel(obj, radius, segments=2):
        bevel = obj.modifiers.new("Soft edges", "BEVEL")
        bevel.width = radius
        bevel.segments = segments
        bevel.harden_normals = True
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")

    def box(self, name, loc, dim, material, *, radius=0, rotation=(0, 0, 0)):
        x, y, z = (dimension / 2 for dimension in dim)
        vertices = [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),
                    (-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
        faces = [(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
        obj = self.mesh(name, vertices, faces, material)
        obj.location = loc
        obj.rotation_euler = rotation
        if radius:
            self.bevel(obj, radius)
        return obj

    def beam(self, name, start, end, width, material, *, depth=None, radius=0):
        start, end = Vector(start), Vector(end)
        obj = self.box(name, (start + end) * .5, (width, depth or width, (end - start).length),
                       material, radius=radius)
        obj.rotation_euler = (end - start).to_track_quat("Z", "Y").to_euler()
        return obj

    def cylinder(self, name, loc, radius, depth, material, *, segments=32, top=None, bevel=0, rotation=(0, 0, 0)):
        radii = (radius, radius if top is None else top)
        vertices = [(r * math.cos(i * math.tau / segments), r * math.sin(i * math.tau / segments), z)
                    for r, z in zip(radii, (-depth / 2, depth / 2)) for i in range(segments)]
        faces = [(i, (i + 1) % segments, (i + 1) % segments + segments, i + segments) for i in range(segments)]
        faces.extend([tuple(reversed(range(segments))), tuple(range(segments, 2 * segments))])
        obj = self.mesh(name, vertices, faces, material)
        obj.location = loc
        obj.rotation_euler = rotation
        for poly in list(obj.data.polygons)[:segments]:
            poly.use_smooth = True
        if bevel:
            self.bevel(obj, bevel)
        return obj

    def orb(self, name, loc, scale, material, *, segments=24, rings=12, rotation=(0,0,0), facets=False):
        data = bpy.data.meshes.new(name)
        model = bmesh.new()
        if facets:
            bmesh.ops.create_icosphere(model, subdivisions=2, radius=1)
        else:
            bmesh.ops.create_uvsphere(model, u_segments=segments, v_segments=rings, radius=1)
        model.to_mesh(data)
        model.free()
        obj = bpy.data.objects.new(name, data)
        self.group.objects.link(obj)
        obj.location, obj.scale, obj.rotation_euler = loc, scale, rotation
        data.materials.append(material)
        if not facets:
            data.polygons.foreach_set("use_smooth", [True] * len(data.polygons))
        return obj

    def tube(self, name, points, thickness, material, *, sides=6, loop=False):
        points = [Vector(p) for p in points]
        vertices = []
        count = len(points)
        previous = None
        for i, point in enumerate(points):
            tangent = (points[(i + 1) % count if loop else min(i + 1, count - 1)] -
                       points[(i - 1) % count if loop else max(i - 1, 0)]).normalized()
            guide = previous or (Vector((0, 0, 1)) if abs(tangent.z) < .8 else Vector((1, 0, 0)))
            u = (guide - tangent * guide.dot(tangent)).normalized()
            v = tangent.cross(u)
            previous = u
            for j in range(sides):
                a = math.tau * j / sides
                vertices.append(point + thickness * (math.cos(a) * u + math.sin(a) * v))
        faces = [(i*sides+j, i*sides+(j+1)%sides, (i+1)%count*sides+(j+1)%sides, (i+1)%count*sides+j)
                 for i in range(count if loop else count-1) for j in range(sides)]
        if not loop:
            faces += [tuple(reversed(range(sides))), tuple(range((count - 1) * sides, count * sides))]
        return self.mesh(name, vertices, faces, material, smooth=True)

    def ring(self, name, center, radii, thickness, material, *, segments=56, rotation=(0,0,0)):
        matrix = Euler(rotation).to_matrix()
        points = [Vector(center) + matrix @ Vector((radii[0]*math.cos(a), radii[1]*math.sin(a), 0))
                  for a in (i * math.tau / segments for i in range(segments))]
        return self.tube(name, points, thickness, material, loop=True)

    def light(self, name, kind, loc, hue, power, *, target=None, size=1, height=None):
        # Keep fixtures in the interactive asset and use the area lights only for offline renders.
        data = bpy.data.lights.new(name, kind)
        data.color = color(hue)
        data.energy = power
        if kind == "AREA":
            data.shape = "RECTANGLE" if height else "DISK"
            data.size = size
            if height:
                data.size_y = height
        elif kind == "POINT":
            data.shadow_soft_size = size
        obj = bpy.data.objects.new(name, data)
        self.group.objects.link(obj)
        obj.location = loc
        if target is not None:
            obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def look(sky, key, fill, ground, *, near=9, far=30, energy=2, bounce=.65, ambient=.8):
    return dict(sky=sky, fog=dict(color=sky, near=near, far=far), key=key, fill=fill, ground=ground,
                keyIntensity=energy, fillIntensity=bounce, skyIntensity=ambient)


def frame(label, description, position, target, fov=50, mobile=55):
    return dict(label=label, description=description, position=position, target=target, fov=fov, mobileFov=mobile)


def y_up(coords):
    x, y, z = coords
    return [x, z, -y]


def setup_clay(scene):
    scene.render.engine = "BLENDER_WORKBENCH"
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "SINGLE"
    shading.single_color = (.67, .67, .67)
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.show_object_outline = False
    shading.background_type = "WORLD"
    scene.world = bpy.data.worlds.new("Clay background")
    scene.world.color = (.23, .23, .23)


def setup_cycles(scene, sky, strength, samples):
    scene.render.engine = "CYCLES"
    preferences = bpy.context.preferences.addons["cycles"].preferences
    try:
        preferences.compute_device_type = "OPTIX"
        preferences.refresh_devices()
        gpu_devices = [device for device in preferences.devices if device.type == "OPTIX"]
        if gpu_devices:
            for device in preferences.devices:
                device.use = device in gpu_devices
            scene.cycles.device = "GPU"
    except (RuntimeError, TypeError) as error:
        print(f"OptiX unavailable, rendering with CPU: {error}", flush=True)
    scene.cycles.samples = samples
    scene.cycles.adaptive_threshold = .055
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.transmission_bounces = 6
    scene.cycles.sample_clamp_indirect = 3.0
    world = bpy.data.worlds.new("Room atmosphere")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (*color(sky), 1)
    background.inputs["Strength"].default_value = strength
    scene.world = world


def set_camera(studio, view, mobile):
    scene = studio.scene
    if scene.camera is None:
        camera = bpy.data.objects.new("Exhibit camera", bpy.data.cameras.new("Exhibit camera"))
        studio.group.objects.link(camera)
        scene.camera = camera
    camera = scene.camera
    camera.location = view["position"]
    camera.rotation_euler = (Vector(view["target"]) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.sensor_fit = "VERTICAL"
    fov = view["mobileFov" if mobile else "fov"]
    camera.data.lens = camera.data.sensor_height / (2 * math.tan(math.radians(fov) / 2))
    camera.data.clip_start = .035
    camera.data.clip_end = 140


def render(studio, view, filename, dimensions, mobile=False):
    set_camera(studio, view, mobile)
    scene = studio.scene
    scene.render.resolution_x, scene.render.resolution_y = dimensions
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.quality = 89
    scene.render.filepath = str(filename)
    bpy.ops.render.render(write_still=True)


def export(path):
    scene = bpy.context.scene
    batches = defaultdict(list)
    for obj in scene.objects:
        if obj.type != "MESH" or len(obj.data.materials) != 1:
            continue
        stem, _, suffix = obj.name.rpartition(".")
        name = stem if suffix.isdigit() else obj.name
        if name in REPEATED_MESHES:
            batches[name, obj.data.materials[0]].append(obj)
    # Keep the editable source objects separate. Consolidate repeated opaque meshes
    # only in the export scene, reducing the number of mobile draw calls.
    for objects in batches.values():
        if len(objects) < 2:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if any(obj.modifiers for obj in objects):
            bpy.ops.object.convert(target="MESH")
        bpy.ops.object.join()
    for obj in scene.objects:
        obj.select_set(obj.type == "MESH" and len(obj.data.polygons) > 0)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                              export_cameras=False, export_lights=False, export_yup=True,
                              export_apply=True, export_texcoords=True)


def measure_bounds(objects):
    corners = [obj.matrix_world @ Vector(point) for obj in objects if obj.type == "MESH" for point in obj.bound_box]
    assert corners
    return tuple(tuple(axis(p[i] for p in corners) for i in range(3)) for axis in (min, max))


def inspect_contacts(slug):
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()

    def group(prefix):
        return sorted((obj for obj in scene.objects if obj.name.startswith(prefix)), key=lambda obj: obj.name)

    def tree(obj):
        evaluated = obj.evaluated_get(depsgraph)
        return BVHTree.FromPolygons([obj.matrix_world @ v.co for v in evaluated.data.vertices],
                                    [tuple(face.vertices) for face in evaluated.data.polygons])

    if slug == "2024-55":
        sheets = [tree(obj) for obj in group("Newsprint stack")]
        assert len(sheets) == 24
        assert not any(a.overlap(b) for a,b in zip(sheets,sheets[1:])), "Stacked sheets cross"
        return {"stackedSheets": len(sheets), "crossings": 0}
    if slug in ("2024-18-4", "2024-52"):
        flower = slug == "2024-18-4"
        shells = group("Closed opaline globe" if flower else "Closed polished heart shell")
        wires = group("Suspension wire to theatre grid" if flower else "High tensile filament above glass")
        assert len(shells) == len(wires) == (7 if flower else 5)
        for obj in shells:
            mesh = bmesh.new()
            mesh.from_mesh(obj.data)
            assert all(edge.is_manifold for edge in mesh.edges)
            mesh.free()
        hulls = [tree(obj) for obj in shells]
        assert all(hull.overlap(tree(wire)) for hull,wire in zip(hulls,wires,strict=True)), "Missing suspension contact"
        checks = {"sealedGlassShells": len(shells), "suspensionContacts": len(wires)}
        if flower:
            supports = [tree(obj) for obj in group("Pearl stage surface") + group("Weighted porcelain foot")]
            stems = [tree(obj) for obj in group("Curved stem")]
            assert all(any(stem.overlap(support) for support in supports) for stem in stems), "Ungrounded flower stem"
            checks["groundedFlowerStems"] = len(stems)
            disc_rim = tree(group("Pearl light disc rim")[0])
            disc_wires = group("Opal disc steel suspension")
            assert len(disc_wires) == 2 and all(disc_rim.overlap(tree(wire)) for wire in disc_wires)
            assert not any(disc_rim.overlap(hull) for hull in hulls), "An opaline globe touches the disc rim"
            checks["lightDiscContacts"] = len(disc_wires)
        else:
            elements = [tree(obj) for prefix in ("Sloping orbit-mounted support ribbon", "Shard in depth inside the glass",
                                                "Suspended faceted heart core", "Subsurface gleam along") for obj in group(prefix)]
            assert not any(hull.overlap(element) for hull in hulls for element in elements), "A ribbon or crystal crosses the glass"
        return checks
    return {}


def verify(item, definition, evidence):
    slug = item["slug"]
    stage = evidence / slug
    room = ROOMS / slug
    manifest = json.loads((room / "room.json").read_text(encoding="utf-8"))
    assert (manifest["id"],manifest["year"],manifest["workId"],manifest["title"]) == (
        slug,item["year"],item["workId"],item["title"])
    prefix = f"./rooms/{slug}"
    assert manifest["model"] == f"{prefix}/scene.glb"
    assert manifest["stills"] == [f"{prefix}/view-{i}.webp" for i in range(2)]
    assert manifest["mobileStills"] == [f"{prefix}/view-{i}-mobile.webp" for i in range(2)]
    assert manifest["look"] == definition["look"]
    for actual, expected in zip(manifest["views"], definition["views"], strict=True):
        assert actual == dict(expected,position=y_up(expected["position"]),target=y_up(expected["target"]))
        assert actual["position"][1] > .32
    with (room / "scene.glb").open("rb") as stream:
        magic, version, size, json_length, json_kind = struct.unpack("<4sIII4s", stream.read(20))
        assert (magic,version,json_kind) == (b"glTF",2,b"JSON")
        assert size == (room / "scene.glb").stat().st_size
        container = json.loads(stream.read(json_length))
    assert size <= 2_500_000, f"{slug} exceeds 2.5 MB: {size}"
    assert "cameras" not in container and "KHR_lights_punctual" not in container.get("extensionsUsed", ())
    assert all("mesh" in node for node in container["nodes"]), f"{slug} contains a node without mesh geometry"
    assert all("bufferView" in image and "uri" not in image for image in container.get("images", ()))
    meshes = container["meshes"]
    tris = sum(
        container["accessors"][primitive["indices"]]["count"] // 3
        for node in container["nodes"] for primitive in meshes[node["mesh"]]["primitives"]
    )
    bpy.ops.wm.open_mainfile(filepath=str(stage / f"{slug}.blend"), use_scripts=False)
    source = bpy.context.scene
    assert (source.camera.location - Vector(definition["views"][0]["position"])).length < .0001
    contacts = inspect_contacts(slug)
    source_bounds = measure_bounds(source.objects)
    assert source_bounds[0][2] < .05 and source_bounds[1][2] > 2
    for image in bpy.data.images:
        if image.source in {"FILE", "GENERATED"}:
            assert image.packed_file, f"External image dependency in {slug}: {image.name}"
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(room / "scene.glb"))
    imported = bpy.context.scene.objects
    assert all(obj.type == "MESH" for obj in imported), f"Export inserted non-mesh scene objects in {slug}"
    imported_bounds = measure_bounds(imported)
    # Blender's glTF importer reverses the Y-up conversion. A missing export
    # conversion would rotate the asymmetric world bounds out of these limits.
    for current, baseline in zip(imported_bounds, source_bounds):
        assert (Vector(current) - Vector(baseline)).length < .45, (slug,current,baseline)
    report = dict(glbBytes=size, meshNodes=len(container["nodes"]), triangles=tris,
                  materials=len(container["materials"]), embeddedImages=len(container.get("images", ())),
                  blendBytes=(stage / f"{slug}.blend").stat().st_size,
                  axisBoundsBlender=[[round(c, 3) for c in corner] for corner in imported_bounds],
                  contacts=contacts)
    (stage / "geometry-check.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(f"VERIFIED {slug} {json.dumps(report)}", flush=True)


def build(item, definition, phase, evidence):
    slug = item["slug"]
    started = time.perf_counter()
    print(f"START {slug} {phase}", flush=True)
    studio = Studio(sum((i + 1) * ord(c) for i, c in enumerate(slug)))
    definition["build"](studio)
    studio.section("Cameras and offline lighting")
    stage = evidence / slug
    stage.mkdir(parents=True, exist_ok=True)
    views = definition["views"]
    if phase == "clay":
        setup_clay(studio.scene)
        for index, view in enumerate([*views, definition["inspect"]]):
            render(studio, view, stage / f"clay-{index}.webp", (740, 460))
    else:
        setup_cycles(studio.scene, definition["look"]["sky"], definition["world"], 12 if phase == "preview" else 40)
        definition["lights"](studio)
        if phase == "preview":
            for index, view in enumerate(views):
                for mobile, size in [(False, (640, 400)), (True, (378, 550))]:
                    render(studio, view, stage / f"light-{index}{'-mobile' if mobile else ''}.webp", size, mobile)
        else:
            room = ROOMS / slug
            room.mkdir(parents=True, exist_ok=True)
            set_camera(studio, views[0], False)
            studio.scene.render.resolution_x = 1280
            studio.scene.render.resolution_y = 800
            studio.scene.render.image_settings.file_format = "WEBP"
            studio.scene.render.filepath = "//view-0.webp"
            bpy.context.preferences.filepaths.save_version = 0
            bpy.ops.wm.save_as_mainfile(filepath=str(stage / f"{slug}.blend"), compress=True)
            for index, view in enumerate(views):
                render(studio, view, room / f"view-{index}.webp", (1280, 800))
                render(studio, view, room / f"view-{index}-mobile.webp", (720, 1044), True)
            export(room / "scene.glb")
            prefix = f"./rooms/{slug}"
            data = dict(id=slug, year=item["year"], workId=item["workId"], title=item["title"],
                        model=f"{prefix}/scene.glb", stills=[f"{prefix}/view-{n}.webp" for n in range(2)],
                        mobileStills=[f"{prefix}/view-{n}-mobile.webp" for n in range(2)],
                        views=[dict(view, position=y_up(view["position"]), target=y_up(view["target"])) for view in views],
                        look=definition["look"])
            (room / "room.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"DONE {slug} {phase} seconds={time.perf_counter() - started:.1f}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence", required=True, type=Path, help="External 2024 evidence directory next to inventory.json")
    parser.add_argument("--phase", required=True, choices=("clay", "preview", "final", "export", "verify"))
    parser.add_argument("--only", nargs="+")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    evidence = args.evidence.resolve()
    definitions = scenes_2024.rooms(frame, look)
    inventory = json.loads((evidence.parent / "inventory.json").read_text(encoding="utf-8-sig"))
    items = {item["slug"]: item for item in inventory}
    for slug in args.only or definitions:
        if args.phase == "verify":
            verify(items[slug], definitions[slug], evidence)
        elif args.phase == "export":
            bpy.ops.wm.open_mainfile(filepath=str(evidence / slug / f"{slug}.blend"), use_scripts=False)
            export(ROOMS / slug / "scene.glb")
        else:
            build(items[slug], definitions[slug], args.phase, evidence)


if __name__ == "__main__":
    main()
