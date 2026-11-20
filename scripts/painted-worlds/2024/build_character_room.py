"""Stage an authored Tripo GLB in one 2024 room without changing shared runtime."""

import argparse
import hashlib
import json
from math import isfinite, radians
from os import getpid
from pathlib import Path
import shutil
import struct
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE.parent)]
import build_2024 as base
from casting import CASTING, clear_seat_space, open_crystal_sightline, remove_stand_ins


OFFLINE = (1280, 800)
MOBILE = (720, 1044)
MAX_BYTES = 2_500_000
FILES = ("scene.glb", "view-0.webp", "view-1.webp", "view-0-mobile.webp",
         "view-1-mobile.webp", "room.json")


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def glb_json(path):
    with path.open("rb") as stream:
        magic, version, size, json_length, kind = struct.unpack("<4sIII4s", stream.read(20))
        if (magic, version, size, kind) != (b"glTF", 2, path.stat().st_size, b"JSON") or json_length > size-20:
            raise ValueError(f"Invalid glTF 2.0 binary file: {path}")
        data = json.loads(stream.read(json_length))
    for entry in (*data.get("buffers", ()), *data.get("images", ())):
        if "uri" in entry and not entry["uri"].startswith("data:"):
            raise ValueError("Use a GLB with embedded mesh data and textures.")
    return data


def views_for(slug, previous, posed):
    if slug != "2024-23":
        return previous
    frame = base.frame
    if posed:
        return [
            frame("月台近望", "近看暖光中的臉、開掌與青灰披肩，右側車窗延伸到深處。", (-.36,-.57,1.44), (-.20,1.31,1.34),42,58),
            frame("掌與披肩斜側", "從車側看掌心到袖口的距離、披肩厚度和鞋底落點。",(1.36,2.24,1.47),(-.52,1.16,.98),54,62),
        ]
    return [
        frame("月台前視", "從左上圓燈和右側車窗之間望進窄月台。", (.18,-2.58,1.58), (.12,1.45,1.18), 45, 56),
        frame("車側斜望", "從後側回望拱棚、車身圓肩和平台的實際寬度。", (.98,4.42,1.77), (.12,.54,1.06), 50, 61),
    ]


def warm_face_23(studio):
    studio.light("Warm return over the face and raised palm", "AREA", (-1.40,-.38,2.41), "#ffd6b5", 42,
                 target=(-.49,1.02,1.54), size=1.24)


def room_definition(slug, posed):
    definition = base.scenes_2024.rooms(base.frame,base.look)[slug]
    if slug == "2024-23" and posed:
        environment_lights = definition["lights"]
        def lights(studio):
            environment_lights(studio)
            warm_face_23(studio)
        definition["lights"] = lights
        definition["look"] = dict(definition["look"], key="#ffd8ad", keyIntensity=2.22,
                                  fillIntensity=1.02, skyIntensity=1.31, ground="#747578")
    if slug == "2024-52" and posed:
        environment = definition["build"]
        lighting = definition["lights"]
        def build(studio):
            environment(studio)
            clear_seat_space(studio)
            open_crystal_sightline(studio)
        def lights(studio):
            lighting(studio)
            studio.light("Soft pale face light for the seated performer", "AREA",(-1.3,-2.7,4.17),"#ffeadb",160,
                         target=(-.68,.59,1.93),size=2.0)
        definition["build"] = build
        definition["lights"] = lights
        definition["look"] = dict(definition["look"], keyIntensity=1.76,fillIntensity=.98,skyIntensity=1.04)
    return definition


def support_below(scene, casting, requested):
    # The grade comes from the scene's real tile or dais, not an invisible platform.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    proposed = Vector(requested)
    hit, point, _, _, obj, _ = scene.ray_cast(
        depsgraph, proposed + Vector((0,0,.055)), Vector((0,0,-1)), distance=.14,
    )
    if not hit or not obj.name.startswith(casting.support):
        name = obj.name if hit else "no surface"
        raise ValueError(f"Anchor must be above {casting.support}, found {name} at {requested}")
    return point, obj.name


def triangle_count(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def simplify(objects, limit):
    counts = [triangle_count(obj) for obj in objects]
    source = sum(counts)
    if limit is not None and source > limit:
        fixed = sum(count for count in counts if count < 100)
        ratio = min(1, max(1, limit-fixed) / max(1,source-fixed))
        for obj,count in zip(objects,counts,strict=True):
            if count < 100:
                continue
            modifier = obj.modifiers.new("Character delivery mesh","DECIMATE")
            modifier.ratio = ratio
            modifier.use_collapse_triangulate = True
            bpy.context.view_layer.update()
            depsgraph = bpy.context.evaluated_depsgraph_get()
            reduced = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph),
                                                      preserve_all_data_layers=True,depsgraph=depsgraph)
            if not reduced.polygons:
                bpy.data.meshes.remove(reduced)
                obj.modifiers.remove(modifier)
                continue
            old = obj.data
            obj.modifiers.remove(modifier)
            obj.data = reduced
            bpy.data.meshes.remove(old)
        bpy.context.view_layer.update()
    return source,sum(triangle_count(obj) for obj in objects)


def stage_asset(path, anchor, height, yaw, source_contact, decimate_to=None):
    glb_json(path)
    existing = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    originals = [obj for obj in bpy.context.scene.objects if obj not in existing]
    depsgraph = bpy.context.evaluated_depsgraph_get()
    rotation = Matrix.Rotation(radians(yaw), 4, "Z")
    meshes = []
    low = Vector((float("inf"),)*3)
    high = -low
    for obj in originals:
        if obj.type != "MESH":
            continue
        # Apply the imported hierarchy and its current pose while retaining UVs and PBR materials.
        evaluated = obj.evaluated_get(depsgraph)
        mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
        if not mesh.polygons:
            bpy.data.meshes.remove(mesh)
            continue
        mesh.transform(rotation @ evaluated.matrix_world)
        for vertex in mesh.vertices:
            for axis, coordinate in enumerate(vertex.co):
                low[axis] = min(low[axis], coordinate)
                high[axis] = max(high[axis], coordinate)
        meshes.append((obj.name, mesh))
    if not meshes or not all(isfinite(c) for c in [*low, *high]) or high.z-low.z < .0001:
        raise ValueError("The Tripo GLB does not contain a usable posed, Z-up mesh after import.")
    guess = Vector(((low.x+high.x)/2, (low.y+high.y)/2, low.z))
    origin = rotation @ Vector(source_contact) if source_contact is not None else guess
    if not low.z-.01 <= origin.z < high.z-.0001:
        raise ValueError(f"Source contact Z {origin.z} is outside the imported mesh bounds.")
    scale = height/(high.z-origin.z)
    placement = Matrix.Translation(anchor) @ Matrix.Scale(scale,4) @ Matrix.Translation(-origin)
    for obj in originals:
        bpy.data.objects.remove(obj, do_unlink=True)
    collection = bpy.data.collections.new("Tripo character - placed mesh")
    bpy.context.scene.collection.children.link(collection)
    objects = []
    for name, mesh in meshes:
        mesh.transform(placement)
        mesh.update()
        obj = bpy.data.objects.new(f"Tripo | {name}",mesh)
        collection.objects.link(obj)
        objects.append(obj)
    bpy.context.view_layer.update()
    triangles_before,triangles_after = simplify(objects,decimate_to)
    world_min,world_max = base.measure_bounds(objects)
    return objects, {
        "input": str(path), "sha256": digest(path), "sourceBytes": path.stat().st_size,
        "meshParts": len(objects), "sourceBoundsAfterYaw": [list(low), list(high)],
        "worldBoundsZUp": [list(world_min),list(world_max)], "sourceContactAfterYaw": list(origin),
        "contactDelta": world_min[2]-anchor.z, "height": height, "yaw": yaw,
        "sourceTriangles": triangles_before, "deliveryTriangles": triangles_after,
    }


def points_in_camera(studio, views, points):
    frames = []
    for i, view in enumerate(views):
        for mobile, (width, height) in ((False, OFFLINE),(True,MOBILE)):
            base.set_camera(studio,view,mobile)
            scene = studio.scene
            scene.render.resolution_x, scene.render.resolution_y = width,height
            bpy.context.view_layer.update()
            camera = scene.camera
            depsgraph = bpy.context.evaluated_depsgraph_get()
            landmarks = {}
            for name,(expected,point) in points.items():
                coord = world_to_camera_view(scene,camera,point)
                ray = point-camera.location
                hit, _, _, _, obj, _ = scene.ray_cast(
                    depsgraph,camera.location,ray.normalized(),distance=max(0,ray.length-.015))
                target_hit = hit and expected and obj.name.startswith(expected)
                landmarks[name] = dict(frame=[round(coord.x,4),round(coord.y,4)],
                                       inFrame=bool(coord.z>0 and 0<coord.x<1 and 0<coord.y<1),
                                       foreground=obj.name if hit and not target_hit else None)
            frames.append(dict(station=i,mobile=mobile,landmarks=landmarks))
    return frames


def intersecting_props(scene, objects, prefix):
    def tree(obj):
        evaluated = obj.evaluated_get(depsgraph)
        return BVHTree.FromPolygons([obj.matrix_world @ v.co for v in evaluated.data.vertices],
                                    [tuple(face.vertices) for face in evaluated.data.polygons])
    depsgraph = bpy.context.evaluated_depsgraph_get()
    character = [tree(obj) for obj in objects]
    hits = []
    for obj in scene.objects:
        if obj.type == "MESH" and obj.name.startswith(prefix):
            prop = tree(obj)
            if any(mesh.overlap(prop) for mesh in character):
                hits.append(obj.name)
    return hits


def install_room(out, slug, expected):
    size = (out/"scene.glb").stat().st_size
    if size > MAX_BYTES:
        raise ValueError(f"Candidate is {size:,} bytes. Supply a lighter mesh to stay within {MAX_BYTES:,}; preview retained.")
    destination = base.ROOMS/slug
    if expected != {name:digest(destination/name) for name in FILES}:
        raise ValueError("The target room changed during staging; preserved the other revision.")
    transfers = []
    for name in FILES:
        path = destination/name
        staged = path.with_name(f".{path.name}.{getpid()}.character.new")
        with (out/name).open("rb") as incoming, staged.open("xb") as outgoing:
            shutil.copyfileobj(incoming,outgoing)
        transfers.append((staged,path))
    for staged,path in transfers:
        staged.replace(path)
    print(f"UPDATED {destination}",flush=True)


def stage_delivery(studio, definition, room, views, out, expected, allow_write):
    base.setup_cycles(studio.scene, definition["look"]["sky"], definition["world"], 40)
    definition["lights"](studio)
    base.set_camera(studio,views[0],False)
    scene = studio.scene
    scene.render.resolution_x,scene.render.resolution_y = OFFLINE
    scene.render.image_settings.file_format = "WEBP"
    scene.render.filepath = "//view-0.webp"
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(out/"room.blend"),compress=True)
    for index,view in enumerate(views):
        base.render(studio,view,out/f"view-{index}.webp",OFFLINE)
        base.render(studio,view,out/f"view-{index}-mobile.webp",MOBILE,True)
    base.export(out/"scene.glb")
    stats = glb_json(out/"scene.glb")
    if any("mesh" not in node for node in stats.get("nodes",())):
        raise ValueError("An empty or rig node escaped the mesh-only export.")
    size = (out/"scene.glb").stat().st_size
    room["views"] = [dict(view,position=base.y_up(view["position"]),target=base.y_up(view["target"])) for view in views]
    room["look"] = definition["look"]
    write_json(out/"room.json",room)
    print(f"STAGED {room['id']} GLB {size:,} bytes",flush=True)
    if allow_write:
        install_room(out,room["id"],expected)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--room",required=True,choices=CASTING)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--asset",type=Path)
    mode.add_argument("--plan",action="store_true",help="Check the camera and prop sightlines without a character")
    mode.add_argument("--clear-placeholder",action="store_true",help="Stage the bare 23 platform")
    parser.add_argument("--out",required=True,type=Path,help="External evidence or candidate directory")
    parser.add_argument("--write-room",action="store_true",help="Update the six files under this room in the worktree")
    parser.add_argument("--inspect-only",action="store_true",help="Import and check placement without renders or export")
    parser.add_argument("--anchor",type=float,nargs=3,metavar=("X","Y","Z"),help="Blender Z-up contact location near the existing floor")
    parser.add_argument("--height",type=float)
    parser.add_argument("--yaw",type=float,help="Yaw from imported front (-Y) in degrees")
    parser.add_argument("--decimate-to",type=int,help="Approximate total triangle target for the posed character meshes")
    parser.add_argument("--palette-23",action="store_true",help="Apply the authored color regions to the supplied 2024-23 sculpt")
    parser.add_argument("--palette-55",action="store_true",help="Color the supplied archivist and retire the duplicate folio stand")
    parser.add_argument("--palette-stage",action="store_true",help="Color the verified 18-4 or 52 sculpt")
    parser.add_argument("--source-contact",type=float,nargs=3,metavar=("X","Y","Z"),
                        help="Feet midpoint or base contact in the imported mesh before yaw or normalization")
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:])
    if args.clear_placeholder and args.room != "2024-23":
        parser.error("--clear-placeholder applies to 2024-23")
    if args.write_room and (args.plan or args.inspect_only):
        parser.error("--write-room requires a completed export")
    slug = args.room
    casting = CASTING[slug]
    height = casting.height if args.height is None else args.height
    yaw = casting.yaw if args.yaw is None else args.yaw
    if height<=0 or not all(isfinite(value) for value in (height,yaw,*(args.anchor or casting.anchor),*(args.source_contact or ()))):
        parser.error("Use a positive height and finite placement values")
    if args.decimate_to is not None and args.decimate_to < 1000:
        parser.error("--decimate-to must be at least 1000")
    if args.palette_23 and (not args.asset or slug!="2024-23" or args.source_contact is not None):
        parser.error("--palette-23 requires the original 23 GLB and its default source contact")
    if args.palette_55 and (not args.asset or slug!="2024-55" or args.source_contact is not None):
        parser.error("--palette-55 requires the original 55 GLB and its default source contact")
    if args.palette_stage and (not args.asset or slug not in ("2024-18-4","2024-52") or args.source_contact is not None):
        parser.error("--palette-stage requires the original 18-4 or 52 GLB and its default source contact")
    out = args.out.resolve()
    if out.is_relative_to(base.ROOMS):
        parser.error("--out must be separate from live room files")
    asset = args.asset.resolve(strict=True) if args.asset else None
    if asset and asset.suffix.lower() != ".glb":
        parser.error("--asset must be a local Tripo GLB")
    destination = base.ROOMS/slug
    expected = {name:digest(destination/name) for name in FILES}
    room = json.loads((destination/"room.json").read_text(encoding="utf-8"))
    definition = room_definition(slug,posed=asset is not None or slug=="2024-52")
    studio = base.Studio(sum((i+1)*ord(c) for i,c in enumerate(slug)))
    definition["build"](studio)
    removed = remove_stand_ins(bpy,slug,held_folio=args.palette_55)
    studio.section("Cameras and offline lighting")
    bpy.context.view_layer.update()
    anchor, support = support_below(studio.scene,casting,args.anchor or casting.anchor)
    views = views_for(slug,definition["views"],posed=asset is not None)
    markers = {name:(None,anchor+Vector(offset)*(height/casting.height))
               for name,offset in casting.landmarks.items()}
    markers.update({name:(prefix,Vector(coords)) for name,(prefix,coords) in casting.keep_visible.items()})
    report = dict(room=slug,anchor=list(anchor),support=support,height=height,yaw=yaw,removedGeometry=removed,
                  plannedSightlines=points_in_camera(studio,views,markers))
    if asset:
        objects, report["asset"] = stage_asset(asset,anchor,height,yaw,args.source_contact,args.decimate_to)
        if args.palette_23:
            from palette_23 import SOURCE_SHA, paint
            if report["asset"]["sha256"] != SOURCE_SHA:
                raise ValueError("The authored palette is matched to the verified 23 Tripo sculpt.")
            report["palette"] = paint(studio,objects,anchor,height,yaw)
        if args.palette_55:
            from palette_55 import SOURCE_SHA, paint
            if report["asset"]["sha256"] != SOURCE_SHA:
                raise ValueError("The folio and authored palette are matched to the verified 55 Tripo sculpt.")
            report["palette"] = paint(studio,objects,anchor,height,yaw)
        if args.palette_stage:
            from palette_stage import SOURCE_SHA, paint
            if report["asset"]["sha256"] != SOURCE_SHA[slug]:
                raise ValueError("Use the model matched to the authored pigment regions.")
            report["palette"] = paint(studio,objects,anchor,height,yaw,slug)
        report["intersectingProps"] = intersecting_props(studio.scene,objects,casting.collision_groups)
        props = {name:(prefix,Vector(coords)) for name,(prefix,coords) in casting.keep_visible.items()}
        report["placedPropSightlines"] = points_in_camera(studio,views,props)
        bounds = {f"bounds{i}-{j}-{k}":(None,Vector((x,y,z)))
                  for i,x in enumerate([b[0] for b in report["asset"]["worldBoundsZUp"]])
                  for j,y in enumerate([b[1] for b in report["asset"]["worldBoundsZUp"]])
                  for k,z in enumerate([b[2] for b in report["asset"]["worldBoundsZUp"]])}
        report["silhouetteFraming"] = points_in_camera(studio,views,bounds)
    out.mkdir(parents=True,exist_ok=True)
    write_json(out/"placement-check.json",report)
    print(f"PLACEMENT {slug} {list(anchor)} on {support}; stripped {len(removed)} objects",flush=True)
    if args.plan or args.inspect_only:
        return
    if args.write_room and asset and (report["intersectingProps"] or abs(report["asset"]["contactDelta"])>.02):
        raise ValueError("Candidate contacts need review. Inspect placement-check.json before updating public assets.")
    stage_delivery(studio,definition,room,views,out,expected,args.write_room)


if __name__ == "__main__":
    main()
