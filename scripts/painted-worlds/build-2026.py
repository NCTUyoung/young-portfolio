"""Blender 5.3 entry point. Run with -- --slug porsche-356|raven --phase gray|preview|final."""

import argparse
import importlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
DEFAULT_EVIDENCE = REPO.parent / 'young-portfolio-設計提案' / '畫界-2024-2026'
sys.path.insert(0, str(HERE))


def color(hex_color):
    hex_color = hex_color.removeprefix('#')
    channels = (int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels)


def material(name, hue, rough=.65, metal=0, glow=0, alpha=1):
    mat = bpy.data.materials.new(name)
    rgba = (*color(hue), alpha)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = rgba
    node.inputs['Roughness'].default_value = rough
    node.inputs['Metallic'].default_value = metal
    node.inputs['Emission Color'].default_value = rgba
    node.inputs['Emission Strength'].default_value = glow
    node.inputs['Alpha'].default_value = alpha
    return mat


def mesh(name, points, faces, mat, smooth=False, indices=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata(points, [], faces, shade_flat=not smooth)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    for slot in mat if isinstance(mat, (list, tuple)) else [mat]:
        data.materials.append(slot)
    if indices is not None:
        for poly, index in zip(data.polygons, indices, strict=True):
            poly.material_index = index
    return obj


def active(name, mat):
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def apply_scale(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def box(name, loc, dimensions, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = active(name, mat)
    obj.scale = dimensions
    if bevel:
        apply_scale(obj)
        modifier = obj.modifiers.new('Rounded edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
        modifier.harden_normals = True
    return obj


def ellipsoid(name, loc, scales, mat, segments=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    obj = active(name, mat)
    obj.scale = scales
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def cylinder(name, start, end, radius, mat, sides=24, top=None):
    a, b = Vector(start), Vector(end)
    bpy.ops.mesh.primitive_cone_add(vertices=sides, radius1=radius, radius2=radius if top is None else top,
                                   depth=(b-a).length, location=(a+b)*.5)
    obj = active(name, mat)
    obj.rotation_euler = (b-a).to_track_quat('Z', 'Y').to_euler()
    for polygon in obj.data.polygons:
        polygon.use_smooth = len(polygon.vertices) == 4
    return obj


def tube(name, points, mat, radius=.012, sides=6, closed=False):
    """Sheathed polyline with a stable cross-section frame and closed tips."""
    path = [Vector(p) for p in points]
    verts, faces = [], []
    previous = None
    for i, center in enumerate(path):
        a = path[i-1] if i or closed else center
        b = path[(i+1) % len(path)] if i < len(path)-1 or closed else center
        forward = (b-a).normalized()
        axis = previous or Vector((0, 0, 1))
        cross = axis - forward * axis.dot(forward)
        if cross.length < .01:
            axis = min((Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))), key=lambda v: abs(v.dot(forward)))
            cross = axis - forward * axis.dot(forward)
        cross.normalize()
        previous = cross
        up = forward.cross(cross)
        r = radius[i] if isinstance(radius, (tuple, list)) else radius
        verts.extend(center + r * (cross*math.cos(t) + up*math.sin(t))
                     for t in (math.tau*j/sides for j in range(sides)))
    for i in range(len(path) if closed else len(path)-1):
        a, b = i*sides, (i+1) % len(path)*sides
        faces.extend((a+j, a+(j+1)%sides, b+(j+1)%sides, b+j) for j in range(sides))
    if not closed:
        faces.extend((tuple(reversed(range(sides))), tuple(range(len(verts)-sides, len(verts)))))
    return mesh(name, verts, faces, mat, True)


def spline(points, steps=6):
    """Interpolating Catmull–Rom path through authored silhouette points."""
    p = [Vector(a) for a in points]
    result = []
    for i in range(len(p)-1):
        a, b, c, d = p[max(i-1, 0)], p[i], p[i+1], p[min(i+2, len(p)-1)]
        for j in range(steps):
            t = j/steps
            result.append(.5 * (2*b + (-a+c)*t + (2*a-5*b+4*c-d)*t*t + (-a+3*b-3*c+d)*t*t*t))
    return result + [p[-1]]


def area(name, position, target, power, hue, size):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.color = color(hue)
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def backdrop(hue, strength, camera_hue=None, reflection_hue=None):
    scene = bpy.context.scene
    world = bpy.data.worlds.new('Room sky')
    world.use_nodes = True
    tree = world.node_tree
    bg = tree.nodes.get('Background')
    bg.inputs[0].default_value = (*color(hue), 1)
    bg.inputs[1].default_value = strength
    if camera_hue:
        rays = tree.nodes.new('ShaderNodeLightPath')
        mix = tree.nodes.new('ShaderNodeMixShader')
        camera_bg = tree.nodes.new('ShaderNodeBackground')
        camera_bg.inputs[0].default_value = (*color(camera_hue), 1)
        tree.links.new(rays.outputs['Is Camera Ray'], mix.inputs[0])
        lighting = bg.outputs[0]
        if reflection_hue:
            dark = tree.nodes.new('ShaderNodeBackground')
            dark.inputs[0].default_value = (*color(reflection_hue), 1)
            glossy = tree.nodes.new('ShaderNodeMixShader')
            tree.links.new(rays.outputs['Is Glossy Ray'], glossy.inputs[0])
            tree.links.new(lighting, glossy.inputs[1])
            tree.links.new(dark.outputs[0], glossy.inputs[2])
            lighting = glossy.outputs[0]
        tree.links.new(lighting, mix.inputs[1])
        tree.links.new(camera_bg.outputs[0], mix.inputs[2])
        tree.links.new(mix.outputs[0], tree.nodes.get('World Output').inputs['Surface'])
    scene.world = world


def bloom():
    tree = bpy.data.node_groups.new('Optical bloom', 'CompositorNodeTree')
    bpy.context.scene.compositing_node_group = tree
    tree.interface.new_socket(name='Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    layers = tree.nodes.new('CompositorNodeRLayers')
    glare = tree.nodes.new('CompositorNodeGlare')
    glare.inputs['Type'].default_value = 'Fog Glow'
    glare.inputs['Threshold'].default_value = 1.15
    glare.inputs['Strength'].default_value = .52
    glare.inputs['Size'].default_value = .31
    output = tree.nodes.new('NodeGroupOutput')
    tree.links.new(layers.outputs['Image'], glare.inputs['Image'])
    tree.links.new(glare.outputs['Image'], output.inputs['Image'])


def camera(name, position, target, fov):
    data = bpy.data.cameras.new(name)
    data.sensor_fit = 'VERTICAL'
    data.sensor_height = 24
    data.lens = data.sensor_height / (2*math.tan(math.radians(fov)/2))
    data.clip_end = 150
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj


def render(scene, cam, path, size):
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def configure(phase):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 8
    scene.cycles.samples = {'gray': 10, 'preview': 16, 'final': 48}[phase]
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 5
    preferences = bpy.context.preferences.addons['cycles'].preferences
    for device_type in ('OPTIX', 'CUDA'):
        try:
            preferences.compute_device_type = device_type
            preferences.refresh_devices()
            matching = [d for d in preferences.devices if d.type == device_type]
            if matching:
                for device in preferences.devices:
                    device.use = device in matching
                scene.cycles.device = 'GPU'
                break
        except (RuntimeError, TypeError):
            continue
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.quality = 88 if phase == 'final' else 81
    return scene


def export(path):
    """Batch authored pieces by scene layer. Preserve individual pieces in the .blend."""
    groups = {}
    for obj in list(bpy.context.scene.objects):
        if obj.type == 'MESH' and obj.data.polygons and not obj.hide_render:
            groups.setdefault(obj.name.split(' / ')[0], []).append(obj)
    batches = []
    for name, members in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in members:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = members[0]
        bpy.ops.object.convert(target='MESH')
        active_mesh = bpy.context.view_layer.objects.active
        if len(members) > 1:
            bpy.ops.object.join()
        active_mesh.name = name
        # Surface orientation is authored per piece or resolved when the batch is built.
        batches.append(active_mesh)
    bpy.ops.object.select_all(action='DESELECT')
    for batch in batches:
        batch.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True, export_yup=True,
                             export_animations=False, export_lights=False, export_cameras=False,
                             export_texcoords=False, export_meshopt_compression_enable=False)


def y_up(vector):
    x, y, z = vector
    return [x, z, -y]


def metadata(slug, source, views, look):
    base = f'./rooms/{slug}'
    return {
        'id': slug, 'year': source['year'], 'workId': source['workId'], 'title': source['title'],
        'model': f'{base}/scene.glb',
        'stills': [f'{base}/view-{i}.webp' for i in range(2)],
        'mobileStills': [f'{base}/view-{i}-mobile.webp' for i in range(2)],
        'views': [{**view, 'position': y_up(view['position']), 'target': y_up(view['target'])} for view in views],
        'look': look,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--slug', required=True, choices=('porsche-356', 'raven'))
    parser.add_argument('--phase', choices=('gray', 'preview', 'final', 'reader-check'), default='final')
    parser.add_argument('--porsche-reader', type=Path, help='Opt in to the supplied original Porsche companion GLB')
    parser.add_argument('--evidence-root', type=Path, default=DEFAULT_EVIDENCE, help='Directory containing inventory.json')
    args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    slug, phase = args.slug, args.phase
    if args.porsche_reader and slug != 'porsche-356':
        parser.error('--porsche-reader applies to porsche-356 only')
    if phase == 'reader-check' and not args.porsche_reader:
        parser.error('reader-check requires --porsche-reader')
    evidence = args.evidence_root / '2026-scene-evidence' / slug
    evidence.mkdir(parents=True, exist_ok=True)
    source = next(entry for entry in json.loads((args.evidence_root / 'inventory.json').read_text(encoding='utf-8-sig'))
                  if entry['slug'] == slug)
    assert (REPO / 'public' / 'images' / source['filename']).is_file(), source['filename']
    if phase == 'reader-check':
        importlib.import_module('scene_2026_porsche_reader').inspect(args.porsche_reader, evidence / 'reader-source')
        return
    room = REPO / 'public' / 'painted-worlds' / 'rooms' / slug
    module = importlib.import_module('scene_2026_' + slug.replace('-', '_'))
    scene = configure(phase)
    stage = evidence / ('reader-' + phase if args.porsche_reader else phase)
    stage.mkdir(exist_ok=True)
    if args.porsche_reader:
        reader = importlib.import_module('scene_2026_porsche_reader')
        module.build(with_reader=True)
        reader.place(args.porsche_reader, evidence / 'reader-geometry.json')
        views, checks = module.READER_VIEWS, module.READER_CHECKS
    else:
        module.build()
        views, checks = module.VIEWS, module.CHECKS
    cameras = []
    for i, view in enumerate(views):
        for mobile in (False, True):
            name = f'view-{i}' + ('-mobile' if mobile else '')
            cameras.append((name, camera(name, view['position'], view['target'], view['mobileFov' if mobile else 'fov']), mobile))
    for i, (position, target, fov) in enumerate(checks):
        name = f'depth-{i}'
        cameras.append((name, camera(name, position, target, fov), False))
    if phase == 'gray':
        scene.compositing_node_group = None
        scene.view_layers[0].material_override = material('Neutral clay', '#a8aaa9')
        backdrop('#c7ccd4', .48, '#696f78')
        area('Clay check', (-4, -5, 7), (0, 0, 1), 1100, '#fff8ee', 6)
    scale = {'gray': ((736, 414), (381, 610)), 'preview': ((960, 540), (450, 720)), 'final': ((1440, 810), (750, 1200))}[phase]
    try:
        for name, cam, mobile in cameras:
            print(f'RENDER {slug} {phase} {name}', flush=True)
            render(scene, cam, stage / (name + '.webp'), scale[int(mobile)])
    finally:
        scene.camera = cameras[0][1]
        scene.render.resolution_x, scene.render.resolution_y = scale[0]
    if phase == 'final':
        bpy.context.preferences.filepaths.save_version = 0
        scene.render.filepath = '//render.webp'
        bpy.ops.wm.save_as_mainfile(filepath=str(evidence / (slug + '.blend')), compress=True)
        export(stage / 'scene.glb')
        size = (stage / 'scene.glb').stat().st_size
        budget = 3_000_000 if args.porsche_reader else 2_500_000
        if size > budget:
            raise RuntimeError(f'{slug} GLB exceeds budget: {size:,} bytes')
        room.mkdir(parents=True, exist_ok=True)
        for file in ['scene.glb', *[name + '.webp' for name, _, _ in cameras[:4]]]:
            (room / file).write_bytes((stage / file).read_bytes())
        (room / 'room.json').write_text(json.dumps(metadata(slug, source, views, module.LOOK), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'DELIVERED {slug} mesh {size:,} bytes', flush=True)


if __name__ == '__main__':
    # A module identity keeps scene helpers usable from the command line and as imports.
    sys.modules['painted_worlds_2026'] = sys.modules[__name__]
    main()
