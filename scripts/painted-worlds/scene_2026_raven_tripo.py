"""Prepare the author-supplied Tripo sculpture without a substitute figure."""

import hashlib
import json

import bmesh
import bpy
import numpy as np
from mathutils import Matrix

from painted_worlds_2026 import color, material


def mesh_points(obj):
    coordinates = np.empty(len(obj.data.vertices)*3, dtype=np.float32)
    obj.data.vertices.foreach_get('co', coordinates)
    return coordinates.reshape(-1, 3)


def triangle_count(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def smooth(low, high, value):
    t = np.clip((value-low)/(high-low), 0, 1)
    return t*t*(3-2*t)


def pigment(data, points):
    """Color the inspected existing hair, hands, neck and diagonal blade in source space."""
    x, y, z = points.T

    def ellipsoid(center, radii):
        relative = (points-np.array(center))/radii
        return 1-smooth(.80, 1.06, np.linalg.norm(relative, axis=1))

    rgba = np.tile((*color('#212735'), 1), (len(points), 1)).astype(np.float32)

    def tint(hex_color, amount):
        rgba[:,:3] += (np.array(color(hex_color)) - rgba[:,:3])*amount[:,None]

    outside = smooth(.116, .180, abs(x+.077))
    rear_fold = smooth(-.035, .087, y)
    ribbon = outside*smooth(-.157, -.046, y)*smooth(.151, .242, z)
    ribbon = np.maximum(ribbon, rear_fold*outside*smooth(.18,.25,z))
    tint('#304c80', ribbon)
    crown = smooth(.851, .885, z)*smooth(-.159,-.132,x)*(1-smooth(-.016,.008,x))
    tint('#233b63', crown)
    face = ellipsoid((-.063,-.092,.908), (.044,.059,.058))
    face *= (1-smooth(.932,.949,z))*smooth(-.080,-.107,y)
    neck = ellipsoid((-.065,-.058,.858), (.039,.049,.036))*smooth(.836,.850,z)
    raised = np.maximum(ellipsoid((-.181,-.135,.906), (.054,.063,.050)),
                        ellipsoid((-.200,-.150,.882), (.036,.030,.029)))
    grip = ellipsoid((.198,-.172,.796), (.041,.044,.039))
    tint('#c9b8a9', np.maximum.reduce((face, neck, raised, grip)))
    tint('#71839c', 1-smooth(.112, .147, z))
    badge = ellipsoid((-.092,-.115,.805), (.021,.025,.023))
    tint('#889daf', badge)

    bronze = material('Raven tinted dark alloy', '#263c67', .57, .17, .083)
    attr = data.color_attributes.new(name='Sculpture pigment', type='BYTE_COLOR', domain='POINT')
    attr.data.foreach_set('color', rgba.reshape(-1))
    data.color_attributes.active_color = attr
    shader = bronze.node_tree.nodes.get('Principled BSDF')
    painted = bronze.node_tree.nodes.new('ShaderNodeVertexColor')
    painted.layer_name = attr.name
    bronze.node_tree.links.new(painted.outputs['Color'], shader.inputs['Base Color'])
    blade = material('Calibrated cyan blade', '#1eb0d9', .33, .17, 1.78)
    bevel = material('White cyan facet', '#65dfff', .30, .12, 2.55)
    data.materials.clear()
    for surface in (bronze, blade, bevel):
        data.materials.append(surface)
    a = np.array((-.351, -.227, .264))
    b = np.array((.367, -.161, .979))
    lead = b-a
    for polygon in data.polygons:
        p = points[list(polygon.vertices)].mean(axis=0)
        t = float(np.dot(p-a, lead)/np.dot(lead, lead))
        distance = np.linalg.norm((p-a)-t*lead)
        threshold = .0095 if .72 < t < .82 else .0135
        polygon.material_index = (1 if abs(polygon.normal.y) > .49 else 2) if -.029 < t < 1.029 and distance < threshold else 0


def place(path, report_file, base_height):
    if path.suffix.lower() != '.glb' or not path.is_file():
        raise ValueError(f'Expected the author-supplied Raven GLB: {path}')
    scene = bpy.context.scene
    previous = set(scene.objects)
    existing_images = set(bpy.data.images)
    bpy.ops.import_scene.gltf(filepath=str(path))
    imported = set(scene.objects) - previous
    meshes = sorted([obj for obj in imported if obj.type == 'MESH' and obj.data.polygons], key=lambda obj: obj.name)
    if not meshes:
        raise RuntimeError('The supplied Raven GLB has no mesh geometry')
    transforms = {obj: obj.matrix_world.copy() for obj in meshes}
    for obj in meshes:
        obj.data = obj.data.copy() if obj.data.users > 1 else obj.data
        obj.parent = None
        obj.matrix_world = Matrix.Identity(4)
        obj.data.transform(transforms[obj])
    for obj in imported.difference(meshes):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.context.view_layer.update()

    counts = {obj: triangle_count(obj) for obj in meshes}
    original_total = sum(counts.values())
    for obj in meshes:
        target = 39_000*counts[obj]/original_total
        if counts[obj] > max(target, 140):
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            reduce = obj.modifiers.new('Keep the source pose and surface', 'DECIMATE')
            reduce.decimate_type = 'COLLAPSE'
            reduce.use_collapse_triangulate = True
            reduce.ratio = max(target, 140)/counts[obj]
            bpy.ops.object.modifier_apply(modifier=reduce.name)

    coords = {obj: mesh_points(obj) for obj in meshes}
    all_points = np.concatenate(list(coords.values()))
    lower, upper = all_points.min(axis=0), all_points.max(axis=0)
    height = float(upper[2]-lower[2])
    if not np.isfinite(all_points).all() or height < 1e-5:
        raise RuntimeError('Raven source has invalid bounds')
    foot = all_points[all_points[:,2] < lower[2] + .027*height]
    contact_xy = np.median(foot[:,:2], axis=0)
    scale = 3.11/height
    origin = np.array([*contact_xy, lower[2]], dtype=np.float32)
    offset = np.array([0, 0, base_height-.0018], dtype=np.float32)
    images = sorted(set(bpy.data.images)-existing_images, key=lambda img: img.name)
    textures = [img for img in images if img.size[0] > 0 and img.size[1] > 0]
    for img in textures:
        width, height = img.size[:]
        factor = 1024/max(width, height)
        if factor < 1:
            img.scale(max(1, round(width*factor)), max(1, round(height*factor)))
        img.pack()

    topology = []
    for index, obj in enumerate(meshes):
        obj.name = f'Raven Tripo sculpture / source part {index+1}'
        shifted = (coords[obj]-origin)*scale+offset
        if not textures:
            pigment(obj.data, coords[obj])
        obj.data.vertices.foreach_set('co', shifted.reshape(-1))
        for face in obj.data.polygons:
            face.use_smooth = True
        obj.data.update()
        surface = bmesh.new()
        surface.from_mesh(obj.data)
        topology.append(dict(triangles=triangle_count(obj), boundary=sum(edge.is_boundary for edge in surface.edges),
                             colorVertices=0 if textures else len(obj.data.color_attributes[0].data),
                             branched=sum(len(edge.link_faces)>2 for edge in surface.edges)))
        surface.free()

    transformed = (all_points-origin)*scale+offset
    report = dict(source=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest(), bytes=path.stat().st_size,
                  originalTriangles=original_total, triangles=sum(item['triangles'] for item in topology), parts=topology,
                  bounds=[transformed.min(axis=0).tolist(), transformed.max(axis=0).tolist()],
                  textures=[dict(name=img.name, size=list(img.size)) for img in textures],
                  pedestalTop=base_height, contactZ=float(transformed[:,2].min()), scale=scale)
    report_file.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False), flush=True)
    return bool(textures)
