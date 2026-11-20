"""Inspect and prepare the opt-in seated companion for the Porsche room."""

import hashlib
import json
import math

import bpy
import bmesh
from mathutils import Matrix, Vector

from painted_worlds_2026 import area, backdrop, camera, configure, material, render


def import_source(path):
    if path.suffix.lower() != '.glb' or not path.is_file():
        raise ValueError(f'Expected a supplied GLB: {path}')
    previous = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(path), import_pack_images=False)
    imported = set(bpy.context.scene.objects) - previous
    meshes = [obj for obj in imported if obj.type == 'MESH' and obj.data.polygons]
    if len(meshes) != 1:
        raise RuntimeError(f'Expected the supplied single-surface grey model, got {len(meshes)} objects')
    obj = meshes[0]
    transform = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = Matrix.Identity(4)
    obj.data.transform(transform)
    for extra in imported - {obj}:
        bpy.data.objects.remove(extra, do_unlink=True)
    return obj


def bounds(obj):
    corners = [Vector(corner) for corner in obj.bound_box]
    return tuple(tuple(round(f(p[i] for p in corners), 6) for i in range(3)) for f in (min, max))


def inspect(path, output):
    scene = configure('preview')
    output.mkdir(parents=True, exist_ok=True)
    model = import_source(path)
    model.data.calc_loop_triangles()
    lo, hi = map(Vector, bounds(model))
    target = (lo+hi)*.5
    model.data.materials.clear()
    model.data.materials.append(material('Inspection clay', '#b6aba0', .80))
    backdrop('#a5a5aa', .62, '#74747b')
    area('Clay soft key', (-3, -4, 6), target, 800, '#fffcf5', 4)
    area('Clay separation', (3, 2, 2.5), target, 220, '#eaf2ff', 3)
    for name, yaw, height in [('front', 0, .22), ('quarter', -35, .29), ('profile', -90, .22),
                              ('back', 180, .25), ('opposite', 43, .35)]:
        a = math.radians(yaw)
        position = target+Vector((3*math.sin(a), -3*math.cos(a), height))
        cam = camera('Source '+name, position, target, 22)
        render(scene, cam, output / f'{name}.webp', (900, 800))
    report = dict(source=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest(), bytes=path.stat().st_size,
                  vertices=len(model.data.vertices), triangles=len(model.data.loop_triangles), bounds=[list(lo),list(hi)])
    (output / 'inspection.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False), flush=True)


def place(path, report_file, position):
    """Preserve the folds and weave with a shallow silhouette and no texture payload."""
    obj = import_source(path)
    obj.data.calc_loop_triangles()
    original_triangles = len(obj.data.loop_triangles)
    target = 17_200
    if original_triangles > target:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        reduce = obj.modifiers.new('Coastal scene triangle budget', 'DECIMATE')
        reduce.decimate_type = 'COLLAPSE'
        reduce.ratio = target/original_triangles
        reduce.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=reduce.name)

    # Rebuild the low-resolution normals after collapse, in source coordinates.
    surface = bmesh.new()
    surface.from_mesh(obj.data)
    bmesh.ops.remove_doubles(surface, verts=list(surface.verts), dist=.000001)
    bmesh.ops.recalc_face_normals(surface, faces=list(surface.faces))
    boundary = sum(edge.is_boundary for edge in surface.edges)
    branched = sum(len(edge.link_faces) > 2 for edge in surface.edges)
    if boundary or branched:
        print(f'Seated reader topology has {boundary} boundary and {branched} branched edges', flush=True)
    clean = bpy.data.meshes.new('Reduced seated reader')
    surface.to_mesh(clean)
    surface.free()
    old = obj.data
    obj.data = clean
    bpy.data.meshes.remove(old)
    obj.name = 'Coastal reader / seated paper sculpture'

    mats = (
        material('Reader cream rag paper', '#c9c0b0', .79),
        material('Reader toasted paper weave', '#ad9f88', .83),
        material('Reader soft graphite hair', '#9c9386', .79),
        material('Reader porcelain paper', '#d9cebb', .79),
    )
    for slot in mats:
        clean.materials.append(slot)
    for face in clean.polygons:
        x, y, z = face.center
        tilted = z-.26*(x-.20)-.16*y
        hat = tilted > .797
        basket = .115 < x < .318 and y < -.133 and z < .157
        hair = .626 < tilted < .797 and (y > -.047 or x < .138 or x > .335)
        face.material_index = 1 if hat or basket else 2 if hair else 3 if tilted > .665 else 0
        face.use_smooth = True

    # The source seat and soles have slightly different heights. Lean them onto
    # the same cloth and keep the basket resting against the near trouser leg.
    turn = Matrix.Rotation(math.radians(-30), 3, 'Z') @ Matrix.Rotation(math.radians(2.35), 3, 'Y')
    scale = 1.3608
    points = [turn @ (v.co*scale) for v in clean.vertices]
    floor = .015-min(p.z for p in points)
    offset = Vector((*position, floor))
    for vertex, point in zip(clean.vertices, points, strict=True):
        vertex.co = point+offset
    clean.update()
    clean.calc_loop_triangles()
    foot = min(vertex.co.z for vertex in clean.vertices if vertex.co.x < position[0]-.24)
    seat = min(vertex.co.z for vertex in clean.vertices if vertex.co.x > position[0]+.30 and vertex.co.y > position[1]-.07)
    world_bounds = [[round(f(vertex.co[i] for vertex in clean.vertices), 6) for i in range(3)] for f in (min, max)]
    geometry = dict(source=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest(), sourceTriangles=original_triangles,
                    triangles=len(clean.loop_triangles), vertices=len(clean.vertices), boundaryEdges=boundary, branchedEdges=branched,
                    worldBounds=world_bounds, placement=list(position), clothFeetZ=round(foot, 5), clothSeatZ=round(seat, 5), scale=scale)
    report_file.write_text(json.dumps(geometry, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(geometry, ensure_ascii=False), flush=True)
