"""Author and render the five 2025 rooms with Blender 5.3.

blender --background --factory-startup --python-exit-code 1 --python build_2025.py -- --source PATH --phase gray
For the color review use --phase proof. Use --phase final after reviewing both.
--only accepts one or more room slugs. PATH is the directory containing inventory.json.
"""

import argparse
import json
import math
import random
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
TAU = math.tau
UP = Vector((0, 0, 1))
SPECS = {
    "solitude": {
        "look": ("#8d999d", "#e1ebef", "#b9c9da", "#646e70", 1.7, .62, .85, 5, 24),
        "views": [
            ("窗前等雨", "隔著斜落的小雨和玻璃水珠，看候車長椅、坐姿人物與濕街盡頭的銀光。", (1.80, -3.83, 1.76), (.10, .10, 1.36)),
            ("沿雨棚看街", "沿長椅斜看街角，提袋、玻璃框、路面積水和電線分布在不同深度。", (-3.24, -1.36, 1.96), (.01, .14, 1.27)),
        ],
        "inspect": (4.7, 3.55, 2.9),
    },
    "2025-36": {
        "look": ("#160711", "#ffd3ab", "#769eff", "#331019", 1.9, .81, .56, 8, 24),
        "views": [
            ("紅黑雙環", "漆紅黑格前，兩頂冷藍帽與手銬構成交錯的雙人輪廓。", (.59, -4.31, 2.47), (.0, .11, 2.13)),
            ("藍側鏈列", "從藍光側移讀出兩人的肩臂、扣環與後方懸吊紅環的距離。", (-4.02, -2.68, 2.67), (-.08, .16, 1.93)),
        ],
        "inspect": (4.43, .40, 3.53),
    },
    "mirror": {
        "look": ("#1d343f", "#d8efff", "#a6baff", "#34485a", 1.75, .72, .82, 8, 25),
        "views": [
            ("靠近拱鏡", "在白花與水龍頭上方，兩張冷藍側臉隔著拱鏡相望。", (-2.19, -3.55, 2.59), (-.04, -.02, 2.07)),
            ("妝台側切", "從妝台另一端看瓶罐、雙面拱框和鏡內退深的磁磚格。", (-4.02, -1.81, 2.74), (-.16, -.04, 2.02)),
        ],
        "inspect": (-2.86, 2.58, 3.85),
        "inspectTarget": (-.06, .48, 2.00),
    },
    "diamond": {
        "look": ("#090817", "#edf5ff", "#a191ff", "#231a43", 2.1, .96, .57, 9, 26),
        "views": [
            ("星芒與晶冠", "冷白結冠、細劍和月盤在近黑裡疊出主角，紫尖光落於劍身。", (1.50, -4.41, 2.30), (.02, .10, 1.96)),
            ("晶瓣側面", "繞向另一側可讀出晶瓣的厚度、劍尖落點與月盤之間的空間。", (-4.05, -3.65, 2.67), (-.05, .12, 1.99)),
        ],
        "inspect": (4.58, 3.8, 2.85),
    },
    "cosplayer": {
        "look": ("#e9bbb8", "#fff3e2", "#e1c6e8", "#b79196", 1.65, .68, .95, 8, 27),
        "views": [
            ("穿過取景人群", "從手機與攝影者之間看紙白舞台上的斜展長耳與圓框眼鏡。", (.38, -5.42, 2.46), (.0, .01, 1.77)),
            ("棚燈一側", "從側面看人物、地上石墨線、相機和後排攝影者拉開的深度。", (4.08, -3.78, 2.72), (.05, .08, 1.73)),
        ],
        "inspect": (-4.65, 3.62, 3.05),
    },
}


def linear(hex_color):
    rgb = [int(hex_color.lstrip("#")[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)


def vector(p):
    return Vector(p)


class Model:
    """Batch related faces by part and material for a compact GLB."""

    def __init__(self, seed):
        self.batches = {}
        self.materials = {}
        self.random = random.Random(seed)

    def material(self, name, color, rough=.48, metal=0, glow=0, alpha=1):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        rgb = linear(color)
        mat.diffuse_color = (*rgb, alpha)
        node = mat.node_tree.nodes.get("Principled BSDF")
        for key, value in {
            "Base Color": (*rgb, 1), "Metallic": metal, "Roughness": rough,
            "Emission Color": (*rgb, 1), "Emission Strength": glow, "Alpha": alpha,
        }.items():
            node.inputs[key].default_value = value
        self.materials[name] = mat
        return name

    def add(self, part, material, vertices, faces, smooth=False):
        verts, polys, shading = self.batches.setdefault((part, material), ([], [], []))
        first = len(verts)
        verts.extend(vertices)
        polys.extend(tuple(first + i for i in face) for face in faces)
        shading.extend([smooth] * len(faces))

    def box(self, part, mat, center, size, yaw=0):
        self.round_box(part, mat, center, size, 0, yaw)

    def round_box(self, part, mat, center, size, radius, yaw=0):
        x, y, z = (k / 2 for k in size)
        radius = min(radius, x * .96, y * .96, z * .96)
        if radius:
            points = []
            for sx, sy, a in [(1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)]:
                for j in range(3):
                    theta = math.radians(a + 45 * j)
                    points.append((sx * (x - radius) + radius * math.cos(theta),
                                   sy * (y - radius) + radius * math.sin(theta)))
            levels = [(-z, .7), (-z + radius, 1), (z - radius, 1), (z, .7)]
        else:
            points = [(x, y), (-x, y), (-x, -y), (x, -y)]
            levels = [(-z, 1), (z, 1)]
        spin = Matrix.Rotation(yaw, 3, "Z")
        rings = [tuple(vector(center) + spin @ vector((px * k, py * k, h)))
                 for h, k in levels for px, py in points]
        self.rings(part, mat, rings, len(points))

    def rings(self, part, mat, verts, sides, smooth=False, cap=True):
        faces = []
        for base in range(0, len(verts) - sides, sides):
            for j in range(sides):
                j2 = (j + 1) % sides
                faces.append((base + j, base + j2, base + j2 + sides, base + j + sides))
        if cap:
            faces += [tuple(reversed(range(sides))), tuple(range(len(verts) - sides, len(verts)))]
        self.add(part, mat, verts, faces, smooth)

    def loft(self, part, mat, profiles, sides=14, yaw=0, smooth=True):
        """Horizontal rings of (x, y, z, width radius, depth radius)."""
        spin = Matrix.Rotation(yaw, 3, "Z")
        verts = [tuple(vector((x, y, z)) + spin @ vector((a * math.cos(TAU * j / sides),
                 b * math.sin(TAU * j / sides), 0)))
                 for x, y, z, a, b in profiles for j in range(sides)]
        self.rings(part, mat, verts, sides, smooth)

    def oval(self, part, mat, center, radii, angles=(0, 0, 0), sides=14, levels=9, smooth=True):
        spin = Euler(angles).to_matrix()
        verts = []
        for i in range(1, levels):
            angle = math.pi * (i / levels - .5)
            for j in range(sides):
                theta = j * TAU / sides
                offset = (radii[0] * math.cos(angle) * math.cos(theta),
                          radii[1] * math.cos(angle) * math.sin(theta),
                          radii[2] * math.sin(angle))
                verts.append(tuple(vector(center) + spin @ vector(offset)))
        self.rings(part, mat, verts, sides, smooth)

    def tube(self, part, mat, points, radius, sides=8, closed=False, smooth=True):
        coords = [vector(p) for p in points]
        radii = [radius] * len(points) if isinstance(radius, (float, int)) else radius
        verts = []
        for i, p in enumerate(coords):
            before = coords[(i - 1) % len(coords)] if closed or i else p
            after = coords[(i + 1) % len(coords)] if closed or i + 1 < len(coords) else p
            tangent = (after - before).normalized()
            u = tangent.cross(UP if abs(tangent.z) < .90 else vector((0, 1, 0))).normalized()
            if i:
                u = (last_u - last_u.dot(tangent) * tangent).normalized() if abs(last_u.dot(tangent)) < .95 else u
            last_u = u
            v = tangent.cross(u)
            for j in range(sides):
                theta = j * TAU / sides
                verts.append(tuple(p + radii[i] * (math.cos(theta) * u + math.sin(theta) * v)))
        if closed:
            verts.extend(verts[:sides])
        self.rings(part, mat, verts, sides, smooth, not closed)

    def rod(self, part, mat, a, b, ra, rb=None, sides=9, smooth=True):
        self.tube(part, mat, [a, b], [ra, ra if rb is None else rb], sides, smooth=smooth)

    def loop(self, part, mat, center, ax, bx, radius, steps=24, sides=6):
        c, a, b = map(vector, (center, ax, bx))
        pts = [c + math.cos(TAU * i / steps) * a + math.sin(TAU * i / steps) * b for i in range(steps)]
        self.tube(part, mat, pts, radius, sides, closed=True)

    def panel(self, part, mat, front, depth):
        front = [vector(p) for p in front]
        back = [p + vector(depth) for p in front]
        verts = front + back
        n = len(front)
        faces = [tuple(range(n)), tuple(reversed(range(n, 2 * n)))]
        faces += [(j, j + n, (j + 1) % n + n, (j + 1) % n) for j in range(n)]
        # Back-face culling and lighting need consistent outward normals.
        normal = (front[1] - front[0]).cross(front[2] - front[0])
        if normal.dot(vector(depth)) > 0:
            faces = [f[::-1] for f in faces]
        self.add(part, mat, verts, faces)

    def gem(self, part, mats, a, b, width, depth, twist=0):
        """Folded six-sided crystal. End rings and ridge form separate cuts."""
        a, b = map(vector, (a, b))
        t = (b - a).normalized()
        u = t.cross(vector((0, 1, 0))).normalized()
        if u.length < .01:
            u = t.cross(UP).normalized()
        u = Matrix.Rotation(twist, 3, t) @ u
        v = t.cross(u)
        ring = [a.lerp(b, .54) + width * math.cos(i * TAU / 6) * u +
                depth * math.sin(i * TAU / 6) * v for i in range(6)]
        for i in range(6):
            j = (i + 1) % 6
            self.add(part, mats[i % len(mats)], [a, ring[j], ring[i]], [(0, 1, 2)])
            self.add(part, mats[(i + 1) % len(mats)], [ring[i], ring[j], b], [(0, 1, 2)])

    def leaf(self, part, mats, base, tip, width, lift=(0, -.11, .08), axis=None):
        a, b, lift = map(vector, (base, tip, lift))
        d = (b - a).normalized()
        axis = vector(axis).normalized() if axis else d.cross(vector((0, 1, 0))).normalized()
        if axis.length < .01:
            axis = vector((1, 0, 0))
        left, right, spine = [], [], []
        for fraction, shape in [(0, .02), (.21, .68), (.52, 1), (.77, .65), (1, .015)]:
            c = a.lerp(b, fraction)
            spine.append(c + lift * shape)
            left.append(c + width * shape * axis)
            right.append(c - width * shape * axis)
        for j in range(len(spine) - 1):
            for side, edge in enumerate((left, right)):
                verts = [spine[j], edge[j], edge[j + 1], spine[j + 1]]
                if side:
                    verts.reverse()
                self.panel(part, mats[side % len(mats)], verts, tuple(-lift.normalized() * .012))
        return spine

    def emit(self):
        for (part, mat), (verts, faces, shading) in self.batches.items():
            mesh = bpy.data.meshes.new(part)
            mesh.from_pydata(verts, [], faces)
            mesh.update()
            obj = bpy.data.objects.new(f"{part} / {mat}", mesh)
            bpy.context.collection.objects.link(obj)
            mesh.materials.append(self.materials[mat])
            for poly, smooth in zip(mesh.polygons, shading):
                poly.use_smooth = smooth


class Figure:
    """Local body and head coordinates. Faces look down local -Y."""

    def __init__(self, model, group, origin, scale=1, yaw=0):
        self.m, self.group = model, group
        self.origin, self.scale, self.yaw = vector(origin), scale, yaw
        self.spin = Matrix.Rotation(yaw, 3, "Z")

    def point(self, p):
        return self.origin + self.spin @ (self.scale * vector(p))

    def oval(self, label, mat, center, size, angles=(0, 0, 0), smooth=True):
        self.m.oval(f"{self.group} {label}", mat, self.point(center), [s * self.scale for s in size],
                    (*angles[:2], angles[2] + self.yaw), smooth=smooth)

    def tube(self, label, mat, points, radius, sides=8):
        scaled = radius * self.scale if isinstance(radius, (float, int)) else [r * self.scale for r in radius]
        self.m.tube(f"{self.group} {label}", mat, [self.point(p) for p in points], scaled, sides)

    def ring(self, label, mat, center, ax, bx, radius, steps=24):
        self.m.loop(f"{self.group} {label}", mat, self.point(center),
                    self.spin @ (self.scale * vector(ax)), self.spin @ (self.scale * vector(bx)),
                    radius * self.scale, steps)

    def loft(self, label, mat, profiles, sides=16):
        rings = [(*self.point(p[:3]), p[3] * self.scale, p[4] * self.scale) for p in profiles]
        self.m.loft(f"{self.group} {label}", mat, rings, sides, self.yaw)

    def leaf(self, label, mats, base, tip, width, lift=(0, -.1, .05)):
        return self.m.leaf(f"{self.group} {label}", mats, self.point(base), self.point(tip),
                           width * self.scale, self.spin @ (vector(lift) * self.scale),
                           self.spin @ vector((tip[2] - base[2], 0, base[0] - tip[0])))


def head(f, skin, hair, strand, ink, lips, eye, *, long=False, eyes=True):
    # Jaw, cheek and forehead are individually shaped rings.
    f.loft("face", skin, [(0, -.027, -.28, .052, .057), (0, -.045, -.252, .121, .104),
           (0, -.034, -.197, .169, .127), (0, -.008, -.101, .195, .156),
           (0, .007, -.015, .207, .166), (0, .016, .093, .208, .171),
           (0, .02, .174, .181, .155), (0, .023, .232, .113, .107), (0, .023, .251, .028, .031)], 22)
    f.oval("nose", skin, (0, -.164, -.092), (.029, .036, .049), (-.3, 0, 0))
    f.tube("mouth", lips, [(-.044, -.153, -.168), (-.016, -.169, -.172),
           (.012, -.17, -.169), (.042, -.152, -.167)], [.004, .007, .007, .004], 5)
    f.oval("crown hair", hair, (0, .057, .103), (.226, .187, .213))
    f.oval("nape", hair, (0, .104, -.071), (.201, .12, .182))
    for sign in (-1, 1):
        f.oval("ear", skin, (.20 * sign, .001, -.060), (.037, .04, .072), (0, .13 * sign, 0))
        f.tube("temple locks", hair, [(.139 * sign, -.085, .222), (.202 * sign, -.09, .103),
               (.21 * sign, -.056, -.004), (.206 * sign, .022, -.176), (.178 * sign, .051, -.205)],
               [.067, .059, .044, .035, .012])
        if eyes:
            f.oval("eye whites", "ivory", (.089 * sign, -.145, -.036), (.061, .021, .031), (0, -.09 * sign, .22 * sign))
            f.oval("irises", eye, (.083 * sign, -.165, -.035), (.027, .012, .028))
            f.oval("pupils", ink, (.084 * sign, -.175, -.035), (.013, .006, .019))
            f.oval("eye glint", "ivory", (.073 * sign, -.18, -.027), (.007, .004, .008))
            f.tube("lashes", ink, [(.034 * sign, -.151, -.032), (.066 * sign, -.167, -.012),
                   (.106 * sign, -.157, -.009), (.149 * sign, -.124, -.025)], [.004, .007, .008, .004], 5)
            f.tube("brows", hair, [(.038 * sign, -.154, .027), (.087 * sign, -.153, .042),
                   (.143 * sign, -.128, .034)], [.005, .008, .004], 5)
        if long:
            for i in range(4):
                sx = sign * (.142 + i * .025)
                f.tube("long locks", hair if i % 2 else strand,
                       [(sx * .72, .14, .163), (sx, .194 + i * .016, -.102),
                        (sx * 1.05, .170, -.322), (sx * 1.24, .105 - i * .019, -.502 - i * .019),
                        (sx * 1.35, .082 - i * .020, -.64 + i * .041)],
                       [.049, .053, .051, .04, .006], 7)
    for i in range(6):
        s = (i - 2.5) / 2.5
        f.tube("swept fringe", strand if i in (1, 4) else hair,
               [(s * .099 - .039, -.072, .251), (s * .121 - .034, -.149, .177),
                (s * .137 - .019, -.174 + abs(s) * .025, .107),
                (s * .163 + .014, -.162 + abs(s) * .035, .041 + .035 * s)],
               [.038, .044, .035, .006], 7)


def limb(f, name, cloth, skin, shoulder, elbow, wrist, finger, width=.087, cuff=.31):
    a, b, c, d = (vector(p) for p in (shoulder, elbow, wrist, finger))
    edge = b.lerp(c, cuff)
    f.tube(name + " sleeve", cloth, [a, a.lerp(b, .52), b, edge], [width * 1.26, width, width * .88, width * .75])
    f.tube(name + " hand", skin, [edge, edge.lerp(c, .53), c, c.lerp(d, .58), d],
           [width * .67, width * .60, width * .49, width * .44, width * .19])
    axis = (d - c).normalized()
    offset = axis.cross(vector((0, 1, 0))).normalized() * width * .41
    f.tube(name + " thumb", skin, [c.lerp(d, .30), c.lerp(d, .50) + offset, c.lerp(d, .78) + offset * 1.25],
           [width * .31, width * .23, width * .12], 6)


def floor(m, mat, size=27):
    m.box("ground floor", mat, (0, 0, -.065), (size, size, .13))


def light(name, color, power, position, target, size, kind="AREA"):
    data = bpy.data.lights.new(name, kind)
    data.energy = power
    data.color = linear(color)
    if kind == "AREA":
        data.shape = "DISK"
        data.size = size
    else:
        data.shadow_soft_size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def lights(spec, strength, fixtures):
    world = bpy.context.scene.world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    incoming = nodes.new("ShaderNodeLightPath")
    mix = nodes.new("ShaderNodeMixShader")
    bg = nodes.get("Background")
    ambience = nodes.new("ShaderNodeBackground")
    sky = linear(spec["look"][0])
    bg.inputs[0].default_value = (*sky, 1)
    bg.inputs[1].default_value = 1
    ambience.inputs[0].default_value = (.78, .81, 1, 1)
    ambience.inputs[1].default_value = strength
    links = world.node_tree.links
    links.new(incoming.outputs["Is Camera Ray"], mix.inputs[0])
    links.new(ambience.outputs[0], mix.inputs[1])
    links.new(bg.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], nodes.get("World Output").inputs[0])
    for fixture in fixtures:
        light(*fixture)


def palette(m, entries):
    for name, args in entries.items():
        m.material(name, *args)


def seated_shoe(f, cloth, sole, ankle, toe):
    a, t = map(vector, (ankle, toe))
    mid = a.lerp(t, .54)
    f.oval("shoe upper", cloth, mid, (.101, (t - a).length * .70, .085))
    f.oval("shoe sole", sole, mid - vector((0, 0, .052)), (.105, (t - a).length * .73, .036))


def solitude(m):
    palette(m, {
        "asphalt": ("#424d52", .23, .22), "wet sheen": ("#6c8088", .17, .31),
        "street reflection": ("#9fb5bb", .35, 0, .13), "concrete": ("#656e70", .48),
        "paving joints": ("#434d51", .57), "weathered zinc": ("#616f75", .29, .61),
        "awning": ("#a5b1b5", .36, .24), "bench silver": ("#9aa4a7", .29, .43),
        "rain glass": ("#bccbd1", .14, .04, .14, .12), "glass edge": ("#a2bdc5", .21, .22, .14, .37),
        "droplets": ("#bccfd5", .13, .23, .25, .52), "droplet glints": ("#f3f3e9", .23, .07, .85, .65),
        "road paint": ("#bfc2b3", .45, 0, .09), "wire": ("#37484e", .54),
        "silver building": ("#68777c", .53), "back building": ("#879296", .53, 0, .10),
        "shadow building": ("#43565f", .51), "far light": ("#f5efe0", .33, 0, 2.7),
        "arcade glass": ("#a4b2b3", .31, .12, .44),
        "ivory": ("#f8f0e7", .48), "skin": ("#e4c5b9", .52), "lip": ("#906a70", .62),
        "coat": ("#d4d8d9", .48), "coat seam": ("#a0aab1", .64), "soot": ("#323b43", .49),
        "hair": ("#394146", .44), "strand": ("#697076", .42), "iris": ("#708c9f", .34),
        "skirt": ("#c3c7c7", .7), "bag": ("#d2ccbf", .51), "bag seam": ("#827f79", .66),
    })
    floor(m, "asphalt", 40)
    m.box("sidewalk", "concrete", (-.14, 2.5, .07), (4.3, 28, .14))
    m.box("curb lip", "bench silver", (2.0, 2.5, .055), (.15, 28, .10))
    for x in (-1.6, -.81, -.01, .79, 1.59):
        m.box("sidewalk joints", "paving joints", (x, 2.5, .141), (.014, 28, .002))
    for y in range(-8, 16):
        m.box("sidewalk joints", "paving joints", (-.14, y * .94, .142), (4.23, .014, .002))
        m.box("wet lane marking", "road paint", (3.85, y * 1.18, .011), (.084, .66, .007))
    for i in range(60):
        x = m.random.uniform(2.2, 7) if i % 3 else m.random.uniform(-1.7, 1.8)
        y = m.random.uniform(-5.5, 15)
        z = .007 if x > 2.2 else .148
        m.oval("standing water", "wet sheen", (x, y, z),
               (m.random.uniform(.09, .38), m.random.uniform(.16, .58), .003), sides=10, levels=4)
        if i % 4 == 0:
            m.oval("sky broken in puddles", "street reflection", (x, y, z + .004),
                   (.033, .18 + m.random.random() * .24, .002), sides=9, levels=3)
    for j, side in enumerate((-1, 1)):
        for i in range(6):
            y = 2.15 + i * 3.0
            x = -4.3 - .16 * (i % 2) if side < 0 else 7.2 + .18 * (i % 2)
            h = 3.8 + m.random.random() * 2.5
            m.box("receding street facades", ["shadow building", "silver building", "back building"][min(i, 2)],
                  (x, y, h / 2), (2.3, 2.83, h))
            face = x - side * 1.17
            for row, z in enumerate((.85, 1.65, 2.72, 3.35)):
                for k in range(3):
                    panel_y = y + (k - 1) * .83
                    h_window = .29 if z > 2.5 else .45
                    span = .42 + .045 * ((row + i) % 3)
                    m.box("Window jambs", "weathered zinc", (face, panel_y, z), (.057, span + .046, h_window + .046))
                    m.box("window bays", "arcade glass" if (k + 2 * i + j + row) % 5 else "far light",
                          (face - side * .031, panel_y, z), (.015, span, h_window))
                    if (k + row) % 2:
                        m.box("Window mullions", "weathered zinc", (face - side * .044, panel_y, z), (.015, .019, h_window))
            for z in (.33, 2.24, h - .17):
                m.box("facade lintels", "weathered zinc", (face, y, z), (.12, 2.88, .061))
    for idx, y in enumerate((2.3, 6.1, 10.6, 15.15)):
        x = 2.33
        m.rod("street lamp poles", "wire", (x, y, 0), (x, y, 3.64), .052, .033)
        m.tube("goosenecks", "wire", [(x, y, 3.49), (x + .22, y, 3.65),
               (x + .52, y, 3.68), (x + .65, y, 3.59)], .027)
        m.oval("milky street lamps", "far light", (x + .64, y, 3.53), (.145, .10, .083))
        m.rod("left telephone poles", "wire", (-2.18, y + .6, .14), (-2.12, y + .6, 4.38), .050, .030)
        for j in range(2):
            m.rod("telephone crossbars", "wire", (-2.57, y + .60, 4.12 + j * .21),
                  (-1.65, y + .6, 4.12 + j * .21), .02)
            if idx < 3:
                m.tube("catenary wires", "wire", [(-2.0 + j * .13, y + .6, 4.23 - j * .15),
                       (-2.0 + j * .13, y + 2.40, 3.96 - j * .15),
                       (-2.0 + j * .13, (6.1, 10.6, 15.15)[idx] + .60, 4.23 - j * .15)], .009, 5)
    m.box("vanishing light across street", "back building", (2.3, 20.2, 2.8), (9, .22, 5.6))
    m.box("distant doorway", "far light", (2.6, 20.05, 1.77), (1.4, .03, 2.8))
    for x in (-1.46, 1.46):
        for y in (.69, -1.23):
            m.round_box("shelter uprights", "weathered zinc", (x, y, 1.66), (.105, .105, 3.03), .018)
            m.box("anchor plates", "weathered zinc", (x, y, .177), (.25, .25, .065))
        m.box("shelter side sill", "weathered zinc", (x, -.265, .69), (.07, 1.92, .06))
        m.box("shelter side glazing", "rain glass", (x, -.265, 1.84), (.017, 1.91, 2.3))
    for z in (.69, 2.99):
        m.box("shelter rear sill", "weathered zinc", (0, .69, z), (2.93, .072, .058))
    m.box("shelter rear glazing", "rain glass", (0, .694, 1.84), (2.91, .017, 2.3))
    m.box("folded shelter canopy", "awning", (0, -.27, 3.19), (3.03, 2.03, .062))
    m.box("awning drip edge", "weathered zinc", (0, -1.29, 3.158), (3.1, .061, .097))
    for j in range(6):
        m.box("bench seat slats", "bench silver", (0, -.32 + j * .067, .60), (2.34, .061, .056))
    for j in range(4):
        m.box("bench back slats", "bench silver", (0, .113, .735 + j * .069), (2.34, .068, .054))
    for x in (-.97, .97):
        m.tube("bench support bends", "weathered zinc", [(x, -.36, .148), (x, -.36, .55),
               (x, .12, .55), (x, .12, .993)], .035)
    for i in range(102):
        x, y, z = m.random.uniform(-1.39, 1.39), .677, m.random.uniform(.76, 2.94)
        if i % 3 == 0:
            x = (-1 if i % 2 else 1) * 1.442
            y = m.random.uniform(-1.16, .6)
        r = m.random.uniform(.010, .037)
        m.oval("pinned silver droplets", "droplets", (x, y, z), (r, r * .65, r * 1.23),
               angles=(0, m.random.uniform(-.4, .4), 0), sides=8, levels=5)
        if i % 3 == 1:
            m.oval("droplet specular edge", "droplet glints", (x - r * .28, y - r * .48, z + r * .50),
                   (r * .24, r * .14, r * .18), sides=5, levels=3)
    for i in range(69):
        x = m.random.uniform(-3.2, 4.5)
        y = m.random.uniform(-3.1, 7.2)
        z = m.random.uniform(.32, 4.5)
        if abs(x) < 1.5 and y > -1.3 and y < .7 and z < 3.2:
            continue
        m.rod("rain at separate depths", "glass edge", (x, y, z), (x - .035, y + .017, z - m.random.uniform(.07, .19)), .0023, .0008, 5)
    for y in (-1.76, -.86, 1.17):
        x = 1.77 if y < 0 else -1.68
        m.loop("rain impact rings", "glass edge", (x, y, .151), (.14, 0, 0), (0, .09, 0), .003, 20)
        m.loop("rain impact rings", "glass edge", (x, y, .152), (.21, 0, 0), (0, .135, 0), .002, 20)
    # Seated wool coat, headphones, turned-up face and pearl gray cap.
    f = Figure(m, "Waiting on the bench", (-.3, -.07, .615), 1.38, math.radians(19))
    f.loft("coat", "coat", [(-.04, 0, .01, .24, .19), (-.06, .018, .10, .233, .176),
           (-.07, .029, .25, .178, .124), (-.075, .04, .44, .172, .112),
           (-.09, .059, .57, .215, .123), (-.10, .058, .63, .143, .109), (-.1, .063, .67, .086, .07)])
    f.tube("coat closure", "coat seam", [(.02, -.171, .043), (-.007, -.123, .26),
           (-.032, -.092, .47), (-.076, -.051, .614)], .008, 5)
    for z in (.15, .24, .33, .42, .51):
        f.oval("coat buttons", "soot", (-.01, -.125 + (.09 * z), z), (.010, .007, .010))
    f.tube("neck", "skin", [(-.104, .048, .57), (-.106, .056, .792)], [.086, .073])
    limb(f, "supporting", "coat", "skin", (-.253, .065, .565), (-.364, -.035, .30),
         (-.480, -.041, .060), (-.523, -.132, .022), .092, .91)
    limb(f, "chinward", "coat", "skin", (.098, .051, .54), (.237, -.101, .282),
         (.183, -.255, .625), (.117, -.252, .716), .086, .74)
    f.loft("pleated skirt", "skirt", [(0, -.063, -.012, .271, .183), (0, -.056, .08, .257, .195),
           (-.031, -.01, .186, .204, .153)])
    for j in range(9):
        x = (j - 4) * .047
        f.tube("skirt pleats", "coat seam", [(x * .58, -.124, .17), (x, -.218, .10),
               (x * 1.12, -.230, .019)], .006, 5)
    for knee, ankle, toe in [
        ((.223, -.436, .118), (.44, -.67, -.268), (.49, -.84, -.279)),
        ((.148, -.380, .246), (.222, -.704, -.222), (.233, -.874, -.247)),
    ]:
        sock_top = vector(knee).lerp(vector(ankle), .70)
        f.tube("knees and calves", "skin", [(.041, -.03, .073), (.10, -.21, .095), knee,
               vector(knee).lerp(vector(ankle), .45), sock_top], [.139, .12, .11, .084, .064], 12)
        f.tube("ribbed socks", "ivory", [sock_top, vector(knee).lerp(vector(ankle), .84), ankle], [.067, .060, .057], 12)
        seated_shoe(f, "coat", "soot", ankle, toe)
    h = Figure(m, "Girl in silver cap", f.point((-.08, .031, .886)), .98, math.radians(31))
    head(h, "skin", "hair", "strand", "soot", "lip", "iris", long=True)
    h.loft("cap crown", "coat", [(0, .040, .158, .234, .210), (0, .041, .224, .245, .220),
           (.012, .052, .297, .211, .190), (.014, .054, .340, .147, .136),
           (.015, .055, .348, .075, .069)], 22)
    h.oval("silver cap visor", "coat seam", (.016, -.129, .169), (.231, .184, .036), (-.11, -.10, 0))
    h.ring("headphone neck arch", "soot", (0, .020, -.35), (.123, 0, 0), (0, .10, 0), .014)
    for x in (-.113, .113):
        h.oval("headphone cups", "soot", (x, -.057, -.352), (.044, .061, .054))
    m.round_box("waiting bag body", "bag", (.83, -.070, .794), (.418, .239, .382), .053, -.14)
    m.round_box("waiting bag cover", "bag", (.825, -.196, .858), (.377, .049, .173), .022, -.14)
    m.tube("waiting bag handle", "bag seam", [(.705, -.074, .955), (.735, -.092, 1.101),
           (.827, -.099, 1.137), (.916, -.082, 1.08), (.958, -.06, .95)], .017)
    m.tube("waiting bag strap", "bag seam", [(.976, -.072, .927), (1.12, -.124, .65),
           (.992, -.262, .642), (.665, -.235, .868)], .014)
    m.loop("waiting bag loop", "bench silver", (.9, -.228, .814), (.028, 0, 0), (0, 0, .028), .008, 16)
    m.rod("waiting bag charm clasp", "bag seam", (.914, -.228, .811), (.94, -.26, .744), .005)
    m.oval("waiting bag charm", "ivory", (.94, -.262, .722), (.027, .009, .035))
    for x in (.924, .957):
        m.oval("waiting bag charm ears", "ivory", (x, -.262, .753), (.013, .008, .018))
    lights(SPECS["solitude"], .27, [
        ("Clouded daylight", "#e5f1fb", 1500, (-1, 1.5, 7), (0, 0, .8), 6.4),
        ("Street opening", "#e8f2ff", 1200, (3.5, 8, 3.6), (0, -.7, .7), 5),
        ("Reflected shopfront", "#faf0e1", 280, (-3, -3, 2.32), (0, 0, 1.2), 3),
    ])


def checker_disc(m, center, radius, rim, offset):
    x, y, z = center
    n = 10
    step = 2 * radius / n
    for i in range(n):
        for j in range(n):
            u, v = (i - n / 2) * step, (j - n / 2) * step
            square = [(u, v), (u + step, v), (u + step, v + step), (u, v + step)]
            for k in range(64):
                a = vector((radius * math.cos(TAU * k / 64), radius * math.sin(TAU * k / 64)))
                b = vector((radius * math.cos(TAU * (k + 1) / 64), radius * math.sin(TAU * (k + 1) / 64)))
                normal = vector((a.y - b.y, b.x - a.x))
                clipped = []
                for p, q in zip(square, square[1:] + square[:1]):
                    p, q = vector(p), vector(q)
                    dp, dq = normal.dot(p - a), normal.dot(q - a)
                    if dp >= -.00001:
                        clipped.append(p)
                    if (dp >= 0) != (dq >= 0):
                        clipped.append(p.lerp(q, dp / (dp - dq)))
                square = clipped
                if len(square) < 3:
                    break
            if len(square) >= 3:
                m.panel("Circular checker marquetry", ["lacquer red", "pitch lacquer"][(i + j + offset) % 2],
                        [(x + u, y, z + v) for u, v in square], (0, .04, 0))
    for layer, r, w in [("shade ring", radius + .02, .063), (rim, radius + .022, .028),
                        ("pitch lacquer", radius + .116, .018)]:
        m.loop("Suspended disk rim", layer, (x, y - (0.048 if layer == rim else 0), z), (r, 0, 0), (0, 0, r), w, 68)


def chain(m, start, end, material, count, sag, size):
    a, b = vector(start), vector(end)
    t = (b - a).normalized()
    transverse = t.cross(vector((0, 1, 0))).normalized()
    perpendicular = t.cross(transverse).normalized()
    for i in range(count):
        fraction = i / (count - 1)
        c = a.lerp(b, fraction) - UP * (sag * math.sin(math.pi * fraction))
        cross = transverse * math.cos(i * math.pi / 2 + .21) + perpendicular * math.sin(i * math.pi / 2 + .21)
        # Two straight rails plus semicircular end caps make open, interlocking links.
        points = []
        for sign, angle in [(1, 0), (-1, math.pi)]:
            for j in range(7):
                theta = angle + j * math.pi / 6
                points.append(c + t * (sign * size * .53 + math.sin(theta) * size * .48)
                              + cross * (math.cos(theta) * size * .48))
        m.tube("Interlocking chain links", material, points, .121 * size, 7, closed=True)
    for c in (a, b):
        m.oval("Chain anchors", material, c, (.102, .072, .102), sides=10, levels=6)


def uniform_pair(m):
    for i, (x, y, z, yaw) in enumerate([(-.48, -.13, .179, .27), (.47, .20, .194, -.34)]):
        f = Figure(m, ("Blue figure with braided bun", "Blue figure with long braid")[i],
                   (x, y, z), 1.41 if not i else 1.57, yaw)
        f.loft("trousers", "black wool", [(0, .0, .27, .208, .154), (0, -.008, .52, .235, .183),
               (-.02, .01, .69, .206, .147)])
        for sign in (-1, 1):
            foot_x = sign * .177 + (.036 if i else -.025)
            f.tube("trouser leg", "black wool", [(sign * .12, .003, .46), (sign * .18, -.083, .25),
                   (foot_x, -.022, .03)], [.113, .093, .081], 10)
            f.oval("ankle boot", "pitch lacquer", (foot_x, -.075, .058), (.093, .175, .069))
            f.oval("boot sole", "shade ring", (foot_x, -.075, .027), (.097, .177, .029))
        f.loft("blue uniform", "cobalt", [(-.015, .001, .56, .205, .15), (-.018, .018, .67, .194, .138),
               (-.012, .035, .83, .188, .12), (.012, .045, 1.0, .231, .14),
               (.029, .047, 1.087, .222, .13), (.03, .051, 1.144, .083, .068)])
        f.loft("belt", "pale belt", [(-.012, .006, .563, .210, .154),
               (-.015, .009, .623, .202, .149)], 18)
        f.oval("belt bronze buckle", "brass", (-.06, -.149, .595), (.047, .014, .049))
        f.loft("neck", "skin", [(.028, .043, 1.078, .077, .070),
               (.034, .040, 1.25, .071, .066)])
        for sign in (-1, 1):
            f.leaf("folded lapels", ["lapel navy", "lapel navy"], (.031 + sign * .07, -.041, 1.13),
                   (.026 + sign * .045, -.111, .957), .059, (0, -.033, 0))
        f.tube("narrow tie", "pitch lacquer", [(.029, -.107, 1.068), (.019, -.112, .943),
               (.007, -.108, .815), (-.007, -.109, .735)], [.033, .023, .034, .012], 6)
        for shoulder, elbow, wrist, fingers in [
            ((-.182, .036, 1.047), (-.331, -.095, .774), (.301 if not i else -.285, -.268, .875 if not i else 1.045),
             (.352 if not i else -.31, -.238, .981 if not i else 1.119)),
            ((.233, .044, 1.046), (.306, -.130, .791), (.03 if not i else -.405, -.277, 1.045 if not i else .900),
             (-.01 if not i else -.492, -.244, 1.121 if not i else .959)),
        ]:
            limb(f, "Interleaved", "lapel navy", "skin", shoulder, elbow, wrist, fingers, .087, .09)
            w = vector(wrist)
            axis = (w - vector(elbow)).normalized()
            u = axis.cross(vector((0, 1, 0))).normalized()
            v = axis.cross(u)
            f.ring("gold wrist cuff", "brass", w - axis * .029, u * .056, v * .057, .009, 16)
        h = Figure(m, f.group, f.point((.033, .042, 1.38)), .91, yaw + (.14 if not i else -.1))
        head(h, "skin", "pearl braid", "taupe braid", "pitch lacquer", "lip", "amber")
        if i:
            for j in range(12):
                h.oval("braided ponytail", "pearl braid" if j % 2 else "taupe braid",
                       (.15 + j * .037, .14 + .007 * j, -.04 - .011 * j + .035 * math.sin(j * .5)),
                       (.074 - j * .003, .053 - j * .002, .045 - j * .002), (0, .48 * (-1) ** j, -.20))
        else:
            for sign in (-1, 1):
                for j in range(5):
                    h.oval("rolled braid bun", "pearl braid" if j % 2 else "taupe braid",
                           (sign * (.19 + j * .013), .086 + j * .013, .01 - j * .023), (.068, .062, .070),
                           (0, sign * .4, .45))
        h.loft("blue peaked hat", "cobalt", [(0, .021, .194, .243, .209),
               (0, .026, .249, .247, .216), (0, .032, .357, .293, .233),
               (0, .034, .384, .267, .217)], 24)
        h.loft("hat band", "pitch lacquer", [(0, .020, .174, .244, .205), (0, .022, .238, .251, .219)], 24)
        h.oval("gloss visor", "pitch lacquer", (0, -.154, .149), (.246, .193, .034), (-.12, 0, 0))
        h.ring("cap bronze insignia", "brass", (0, -.199, .210), (.026, 0, 0), (0, 0, .027), .005, 18)
        h.oval("costume eye patch", "pitch lacquer", (-.089, -.169, -.034), (.064, .014, .041), (0, .5, 0))
        h.tube("metal eye patch cord", "brass", [(-.147, -.146, -.002), (-.114, -.179, -.071),
               (-.084, -.184, -.041), (-.051, -.161, .019)], .005, 6)


def thirty_six(m):
    palette(m, {
        "lacquer red": ("#b51820", .32, .17, .12), "pitch lacquer": ("#12101c", .29, .3, .035),
        "shade ring": ("#37101d", .42, .25), "cyclorama": ("#430b17", .42, .08, .14),
        "red tube": ("#ff2327", .37, .06, 4.8), "blue tube": ("#53b9ff", .35, .06, 3.4),
        "hot chain": ("#c58a48", .27, .56), "cold chain": ("#3276a4", .29, .74),
        "cobalt": ("#2458b4", .39, .15), "lapel navy": ("#142d60", .47, .06),
        "black wool": ("#182133", .61, .02), "brass": ("#e6aa57", .31, .55),
        "skin": ("#ead0c4", .53), "pale belt": ("#e6d7c9", .49), "ivory": ("#fff0d7", .49),
        "pearl braid": ("#c4a8a5", .56), "taupe braid": ("#99797a", .55),
        "amber": ("#c9993b", .43), "lip": ("#ac7680", .56),
    })
    floor(m, "pitch lacquer")
    m.box("Oxblood rear wall", "cyclorama", (0, 3.65, 3.20), (15, .2, 6.4))
    for i in range(-4, 5):
        m.box("Oxblood wall reveals", "shade ring", (i * 1.19, 3.54, 3.19), (.026, .04, 6.4))
    for z in (.048, .137):
        m.loft("Lacquer stage platform", "shade ring" if z < .1 else "pitch lacquer",
               [(0, .14, z - .046, 1.52, .95), (0, .14, z + .043, 1.50, .94)], 56)
    m.loop("Low rim on stage", "red tube", (0, .14, .105), (1.505, 0, 0), (0, .937, 0), .012, 60)
    checker_disc(m, (-1.52, 1.28, 1.80), 1.48, "blue tube", 0)
    checker_disc(m, (1.52, 2.43, 3.02), 1.50, "red tube", 1)
    for x, y in [(-3.61, -.44), (3.31, -.31), (-2.88, .92), (3.31, 2.21)]:
        m.box("Rig uprights", "shade ring", (x, y + .096, 2.51), (.132, .13, 5.02))
        m.box("Rig floor sockets", "pitch lacquer", (x, y + .07, .061), (.30, .36, .122))
    for x, y, z, mat in [(-1.52, 1.33, 1.8, "cold chain"), (1.52, 2.49, 3.02, "hot chain")]:
        m.rod("Disk overhead suspension", mat, (x, y, z + 1.48), (x, y, 5.28), .019)
    m.box("Backstage upper rail", "shade ring", (0, 1.91, 5.30), (7.71, 1.30, .20))
    for start, end, material, count, sag, size in [
        ((-2.88, .92, 4.86), (-.92, .65, .48), "cold chain", 15, .46, .22),
        ((3.31, 2.21, 4.93), (.58, 1.11, .36), "hot chain", 17, .48, .23),
        ((-3.61, -.44, 2.32), (-1.18, -.57, .18), "cold chain", 11, .24, .19),
        ((3.31, -.31, 2.38), (1.32, -.59, .14), "hot chain", 11, .21, .18),
    ]:
        chain(m, start, end, material, count, sag, size)
    # Slotted costume cuffs with a short hanging tether on the dais.
    for c, yaw in [((-.87, -.43, .58), -.24), ((1.11, -.25, .73), .32)]:
        m.loop("Open stage cuff", "brass", c, (.177 * math.cos(yaw), .177 * math.sin(yaw), 0),
               (0, 0, .177), .024, 32, 9)
        m.round_box("Cuff hinge", "hot chain", (c[0], c[1], c[2] + .188), (.115, .06, .062), .016)
        chain(m, (c[0], c[1], c[2] - .18), (c[0] * 1.13, c[1] + .053, .18),
              "hot chain", 4, .015, .054)
    m.rod("Cold chain floor coupling", "cold chain", (-.92, .65, .18), (-.92, .65, .48), .028)
    m.rod("Warm chain floor coupling", "hot chain", (.58, 1.11, .08), (.58, 1.11, .36), .027)
    uniform_pair(m)
    lights(SPECS["2025-36"], .16, [
        ("Warm skin on both figures", "#fff3df", 430, (.2, -4.10, 5.3), (0, .2, 1.8), 3.1),
        ("Cold blue edge", "#95c8ff", 620, (-4.2, -.5, 3.9), (.05, .35, 1.9), 2.3),
        ("Red edge", "#ff4b33", 730, (3.2, 2.7, 4.4), (0, .1, 1.9), 2.8),
        ("Red wall wash", "#ff271d", 430, (0, 2.6, 3.4), (0, 3.6, 2.7), 3.5),
    ])


def porcelain_arch(m, x, y, bottom, shoulders, radius, width, material):
    points = [(x + radius, y, bottom), (x + radius, y, shoulders)]
    points += [(x + radius * math.cos(math.pi * i / 32), y, shoulders + radius * math.sin(math.pi * i / 32))
               for i in range(1, 33)]
    points.append((x - radius, y, bottom))
    m.tube("Thick arch frame", material, points, width, 10)
    m.rod("Arch sill", material, (x - radius, y, bottom), (x + radius, y, bottom), width, sides=10)
    return points


def mirror_person(m):
    f = Figure(m, "Visitor at glass", (.33, -.855, .12), 1.64, math.radians(193))
    f.loft("long navy jacket", "navy fabric", [(0, .01, .19, .245, .176), (0, .002, .50, .235, .171),
           (0, .012, .72, .197, .135), (-.014, .035, .91, .221, .142),
           (-.022, .047, 1.074, .25, .149), (-.014, .035, 1.14, .151, .117)])
    f.loft("ribbed turtleneck", "sage knit", [(0, -.091, .68, .108, .080), (-.014, -.065, .97, .139, .089),
           (-.012, -.033, 1.118, .097, .092), (-.009, .021, 1.226, .076, .080)])
    for i in range(-4, 5):
        x = i * .022
        f.tube("knit ribs", "knit thread", [(x * .88, -.17, .70), (x, -.154, .90),
               (x * .91, -.134, 1.052), (x * .70, -.069, 1.213)], .0037, 5)
    for sign in (-1, 1):
        f.leaf("charcoal lapels", ["lapel", "navy fabric"], (.005 + sign * .114, -.056, 1.13),
               (sign * .089, -.147, .748), .072, (0, -.029, .005))
        f.tube("tapered trouser legs", "navy fabric", [(sign * .111, .013, .37),
               (sign * .111, .004, .175), (sign * .122, .015, -.03)], [.097, .089, .068])
        f.oval("dark shoe", "lapel", (sign * .14, -.042, -.047), (.079, .154, .052))
    limb(f, "counter supporting", "navy fabric", "skin", (.23, .035, 1.054),
         (.31, -.027, .76), (.237, -.267, .68), (.195, -.339, .676), .093, .76)
    limb(f, "hand to reflection", "navy fabric", "skin", (-.219, .033, 1.055),
         (-.235, -.227, .897), (-.161, -.484, 1.177), (-.116, -.568, 1.317), .077, .19)
    for i in range(3):
        x = -.131 + i * .014
        f.tube("polished fingertips", "skin",
               [(x, -.527, 1.235), (x - .002, -.565 - i * .012, 1.275),
                (x + .009, -.604 + abs(i - 1) * .01, 1.307 - i * .012)],
               [.014, .011, .008], 6)
        f.oval("green nail enamel", "bottle green", (x + .011, -.603 + abs(i - 1) * .01, 1.307 - i * .012),
               (.008, .006, .011))
    f.tube("neck", "skin", [(-.015, .021, 1.131), (-.024, .005, 1.311)], [.072, .070])
    h = Figure(m, f.group, f.point((-.018, -.022, 1.411)), 1.01, math.radians(180))
    head(h, "skin", "indigo hair", "indigo streak", "lapel", "lip", "blue iris", long=True)
    for sign in (-1, 1):
        h.ring("green earring", "bottle green", (.214 * sign, -.022, -.164), (.034, 0, 0), (0, 0, .047), .011, 19)
        h.oval("headband sunglasses lenses", "lens", (sign * .096, -.150, .165), (.082, .018, .049), (-.4, .09 * sign, 0))
        h.ring("headband sunglasses rims", "brushed nickel", (sign * .096, -.166, .166), (.082, 0, 0), (0, -.016, .05), .005, 18)
        h.tube("glasses temples", "lapel", [(sign * .169, -.141, .16), (sign * .214, -.038, .179),
               (sign * .205, .084, .123)], .007, 6)
    h.oval("glass bridge", "brushed nickel", (0, -.167, .178), (.027, .010, .007))


def mirror_room(m):
    palette(m, {
        "joint grout": ("#425a60", .68), "deep teal": ("#213b3e", .33, .17),
        "pale tile": ("#9dbec9", .24, .08), "blue tile": ("#729caf", .25, .09),
        "green tile": ("#619297", .31, .05), "pearl tile": ("#b7c9d6", .25, .10),
        "mirror smoke": ("#abc9f5", .19, .05, .24, .12), "arched ink": ("#101c27", .32, .40),
        "brushed nickel": ("#adbec5", .25, .72), "basin": ("#294c53", .26, .16),
        "soap glaze": ("#d7c6b9", .31), "pink paper": ("#945b77", .52),
        "lens": ("#251926", .16, .41), "bottle green": ("#32706a", .29, .14),
        "leaf": ("#275f55", .56), "leaf vein": ("#448275", .57), "stem": ("#427762", .57),
        "petal lit": ("#f0f6fc", .61), "petal shadow": ("#cadbe4", .67), "anther": ("#cab17c", .55),
        "navy fabric": ("#172432", .56), "lapel": ("#20283d", .52),
        "sage knit": ("#c3c9be", .71), "knit thread": ("#a1b2a9", .72),
        "skin": ("#e8bdb8", .53), "ivory": ("#f0eee7", .45), "lip": ("#a9617c", .57),
        "indigo hair": ("#263b66", .37), "indigo streak": ("#445987", .39),
        "blue iris": ("#7c9ccc", .45),
    })
    floor(m, "deep teal", 23)
    # True open arch. Its twin figure and tiled return sit in a separate 3D bay.
    arch_x, face_y, arch_bottom, arch_shoulder, r = -.32, .27, 1.18, 2.60, 1.13
    tiles = ["pale tile", "blue tile", "green tile", "pearl tile"]
    for i in range(-11, 12):
        x = i * .31
        for j in range(14):
            z = j * .31 + .155
            if abs(x - arch_x) < r + .16 and z >= arch_bottom - .16:
                top = arch_shoulder + math.sqrt(max(0, r * r - (x - arch_x) ** 2))
                if z < top + .146:
                    continue
            mat = tiles[(i * 5 + j * 3) % 4] if (i + j * 2) % 6 == 0 else "pale tile"
            m.box("Separate square wall tiles", mat, (x, face_y + .035, z), (.303, .125, .303))
            m.box("Grout under wall rows", "joint grout", (x, face_y + .074, z), (.314, .042, .314))
    path = porcelain_arch(m, arch_x, face_y - .062, arch_bottom, arch_shoulder, r, .047, "arched ink")
    porcelain_arch(m, arch_x, face_y + .073, arch_bottom, arch_shoulder, r, .055, "arched ink")
    m.panel("Blue silvered glass", "mirror smoke", [(x, face_y + .005, z) for x, _, z in path], (0, .009, 0))
    for i in range(32):
        a = math.pi * i / 32
        b = math.pi * (i + 1) / 32
        arch = [(arch_x + k * math.cos(t), face_y - .009, arch_shoulder + k * math.sin(t))
                for k, t in ((r, a), (r + .34, a), (r + .34, b), (r, b))]
        # The ceramic spandrel closes wedge gaps left by regular wall tiles.
        m.panel("Cut ceramic arch returns", "blue tile" if i % 5 == 0 else "pale tile", arch, (0, .14, 0))
    for side in (-1, 1):
        m.box("Arch jamb return", "blue tile", (arch_x + side * (r + .165), face_y + .044, 1.883), (.321, .129, 1.417))
    for x in range(-7, 8):
        for j in range(12):
            m.box("Reflected square tiling", "blue tile" if (x - j) % 9 == 0 else "pale tile",
                  (x * .33, 3.0, .165 + j * .33), (.319, .09, .319))
    m.box("Rear grout", "joint grout", (0, 3.075, 2.0), (5.0, .1, 4.0))
    for side in (-1, 1):
        return_y = 1.86 if side == -1 else .77
        span = 2.7 if side == -1 else 5.22
        m.box("Tile side return", "joint grout", (side * 3.56, return_y, 1.98), (.12, span, 3.96))
    for i in range(-5, 10):
        for j in range(13):
            m.box("Cold right return tiles", "blue tile" if (i + 3 * j) % 8 == 0 else "pale tile",
                  (3.477, i * .31, .155 + j * .31), (.075, .303, .303))
    for i in range(32):
        a, b = math.pi * i / 32, math.pi * (i + 1) / 32
        x0, x1 = arch_x + r * math.cos(a), arch_x + r * math.cos(b)
        z0, z1 = arch_shoulder + r * math.sin(a), arch_shoulder + r * math.sin(b)
        m.panel("Solid arch spandrel backing", "joint grout", [(x0, face_y + .13, z0),
                (x1, face_y + .13, z1), (x1, face_y + .13, 4.34), (x0, face_y + .13, 4.34)], (0, .032, 0))
    # The basin is assembled around a recessed, lined water well.
    before_vanity = set(m.batches)
    counter_y = -.29
    for x in (-1.265, 1.265):
        m.round_box("Solid vanity ledges", "deep teal", (x, counter_y, 1.145), (1.25, 1.16, .106), .027)
    for y in (-.768, .188):
        m.round_box("Solid vanity ledges", "deep teal", (0, y, 1.145), (1.32, .207, .106), .023)
    m.box("Vanity cabinet", "joint grout", (0, -.28, .58), (3.72, 1.04, .925))
    for x in (-1.25, 0, 1.25):
        m.round_box("Glazed vanity doors", "green tile", (x, -.818, .54), (1.21, .054, .80), .024)
        m.rod("Long cabinet handles", "brushed nickel", (x - .15, -.861, .803), (x + .15, -.861, .803), .015)
    m.round_box("Basin bottom ceramic", "basin", (0, -.284, 1.048), (1.27, .77, .055), .018)
    for x in (-.634, .634):
        m.box("Basin cavity lining", "basin", (x, -.285, 1.121), (.046, .78, .152))
    for y in (-.665, .085):
        m.box("Basin cavity lining", "basin", (0, y, 1.121), (1.25, .051, .15))
    m.oval("Basin drain", "brushed nickel", (0, -.33, 1.08), (.058, .058, .009), sides=16, levels=5)
    m.oval("Faucet plinth", "brushed nickel", (.015, .205, 1.207), (.104, .090, .022), sides=16, levels=5)
    m.tube("Folded metal faucet", "brushed nickel", [(.015, .208, 1.206), (.015, .208, 1.475),
           (.015, .176, 1.506), (.015, -.097, 1.475), (.015, -.136, 1.438)], [.048, .047, .044, .037, .033], 6, smooth=False)
    m.rod("Faucet lever", "brushed nickel", (.10, .217, 1.259), (.263, .188, 1.306), .021, sides=7)
    for x, y, h, mat in [(1.25, -.49, .391, "soap glaze"), (.99, -.087, .306, "soap glaze"),
                          (.73, .141, .266, "bottle green")]:
        m.round_box("Vanity toiletry", mat, (x, y, 1.195 + h / 2), (.181, .146, h), .034)
        m.box("Paper bottle labels", "pink paper", (x, y - .074, 1.15 + .60 * h), (.11, .004, .135))
        m.rod("Toiletry cap", "brushed nickel", (x, y, 1.194 + h), (x, y, 1.24 + h), .047)
    m.rod("Soap pump", "brushed nickel", (1.25, -.48, 1.63), (1.37, -.48, 1.63), .018)
    vase = (-1.18, -.545, 1.196)
    x, y, z = vase
    m.loft("Dark green flower vase", "bottle green", [(x, y, z, .16, .13),
           (x, y, z + .12, .20, .16), (x, y, z + .32, .126, .102), (x, y, z + .38, .124, .10)], 18)
    m.loop("Vase mouth", "deep teal", (x, y, z + .385), (.126, 0, 0), (0, .10, 0), .015, 30)
    for i, bloom in enumerate([(-1.53, -.63, 1.98), (-1.09, -.74, 1.88), (-1.32, -.34, 2.18),
                               (-.89, -.40, 1.99), (-1.63, -.42, 1.79)]):
        center = vector(bloom)
        start = vector((x, y, z + .29))
        m.tube("Lily curved stems", "stem", [start, start.lerp(center, .62) + vector((.05, .02, 0)), center], .011)
        for j in range(6):
            phi = TAU * j / 6 + i * .22
            axis = vector((math.cos(phi), 0, math.sin(phi)))
            tip = center + axis * (.166 + .025 * math.sin(j * 1.23)) + vector((0, -.11, .014))
            m.leaf("White lily petals", ["petal lit", "petal shadow"], center, tip, .067, (0, -.049, .025))
            m.rod("Lily stamens", "anther", center, center + axis * .037 + vector((0, -.085, 0)), .004, sides=5)
        for sign in (-1, 1):
            a = start.lerp(center, .36 + .14 * (sign + 1) / 2)
            m.leaf("Lily deep leaves", ["leaf", "leaf vein"], a, a + vector((sign * .28, -.15, .18)), .073)
    for part, mat in set(m.batches) - before_vanity:
        verts, faces, shading = m.batches[part, mat]
        m.batches[part, mat] = ([(x, y * .72 + .06, z) for x, y, z in verts], faces, shading)
    before = set(m.batches)
    mirror_person(m)
    for part, mat in sorted(set(m.batches) - before):
        verts, faces, shading = m.batches[part, mat]
        twin_verts = [(x, 2 * (face_y + .018) - y, z) for x, y, z in verts]
        m.batches[part.replace("Visitor at glass", "Virtual mirror figure"), mat] = (
            twin_verts, [f[::-1] for f in faces], shading[:])
    lights(SPECS["mirror"], .24, [
        ("Above right cold pane", "#cdeaff", 520, (2.0, -.76, 4.79), (-.44, .36, 1.85), 2.6),
        ("Mirror bay cool key", "#a6c4ff", 420, (1.44, 2.27, 3.5), (-.15, 1.7, 2.09), 2.0),
        ("Soft warm room bounce", "#ffd3bf", 95, (-2.5, -3.4, 2.3), (0, 0, 1.8), 1.8),
    ])


def sparkle(m, center, span, mat):
    c = vector(center)
    for angle, length in [(.49, span), (.49 + math.pi / 2, span * .52), (math.pi, span * .19)]:
        a = vector((math.cos(angle), 0, math.sin(angle)))
        for sign in (-1, 1):
            m.gem("Tapered refraction glints", [mat], c, c + a * sign * length, .011, .005)
    m.oval("Refraction core", "spark core", c, (.023, .016, .026), sides=9, levels=5)


def bow_lobe(m, knot, tip, width, materials, twist):
    axis = (tip - knot).normalized()
    u = Matrix.Rotation(twist, 3, axis) @ axis.cross(vector((0, 1, 0))).normalized()
    v = axis.cross(u)
    sides = 8
    profiles = [(0, .025, .026), (.27, width * .54, .073),
                (.72, width * .95, .126), (.96, width, .082), (1, width * .67, .051)]
    rings = [[knot.lerp(tip, t) + math.cos(TAU * j / sides) * w * u + math.sin(TAU * j / sides) * d * v
              for j in range(sides)] for t, w, d in profiles]
    for a, b in zip(rings, rings[1:]):
        for j in range(sides):
            k = (j + 1) % sides
            m.add("Folded white bow lobes", materials[j % len(materials)], [a[j], a[k], b[k], b[j]], [(0, 1, 2, 3)])
    m.add("Folded white bow lobes", materials[0], rings[0], [tuple(reversed(range(sides)))])
    m.add("Folded white bow lobes", materials[0], rings[-1], [tuple(range(sides))])


def diamond(m):
    palette(m, {
        "night": ("#06050e", .65, .015), "stage night": ("#120f23", .27, .18),
        "disc dark": ("#242239", .58, .16), "disc facets": ("#4a5376", .50, .25),
        "etched silver": ("#a1b9de", .37, .38, .22), "white rim": ("#d8e9ff", .29, .23, 1.65),
        "ivory": ("#f7f0f8", .49), "skin": ("#e5c4d6", .56), "lip": ("#9a5c93", .56),
        "night ink": ("#17142c", .53), "purple eye": ("#76649c", .44),
        "sapphire": ("#465eac", .34, .28), "ice blue": ("#9ac6e9", .29, .30),
        "ice white": ("#e4efff", .29, .17, .17), "lavender cut": ("#a1a9e6", .29, .31),
        "facet black": ("#2e2851", .40, .19), "white silk": ("#d9d9f0", .39, .16),
        "shadow silk": ("#716cac", .47, .13), "sword bright": ("#c3d4eb", .22, .65, .10),
        "sword blue": ("#6473a9", .35, .58), "spark violet": ("#d28bff", .40, .07, 2.9),
        "spark blue": ("#779dff", .41, .1, 1.38), "spark core": ("#f4dcff", .42, .04, 4.7),
        "star floor": ("#6343a6", .39, .18, .44),
    })
    floor(m, "night", 30)
    m.loft("Obsidian plinth", "stage night", [(0, .13, .005, 1.78, 1.21),
           (0, .13, .081, 1.78, 1.21), (0, .13, .138, 1.70, 1.16)], 56)
    m.loop("Plinth incised outline", "facet black", (0, .13, .086), (1.765, 0, 0), (0, 1.195, 0), .012, 60)
    for i in range(12):
        t = TAU * i / 12
        d = vector((math.cos(t), math.sin(t), 0))
        a = vector((0, .13, .008)) + d * (1.70 - abs(d.y) * .53)
        m.gem("Spectral floor rays", ["star floor", "sapphire"], a, a + d * (1.1 + .35 * math.sin(3 * t)), .009, .075)
    c = vector((-.60, 1.31, 2.66))
    r = 1.31
    m.rod("Dark circular relief", "disc dark", c - vector((0, .025, 0)), c + vector((0, .091, 0)), r, sides=88, smooth=False)
    m.loop("Circular relief silver edge", "white rim", c - vector((0, .055, 0)),
           (r, 0, 0), (0, 0, r), .015, 88)
    m.rod("Circular relief rear mount", "facet black", (-.6, 1.39, .14), (-.6, 1.39, 2.74), .052)
    m.box("Relief support plate", "stage night", (-.6, 1.39, .078), (.68, .53, .153))
    for x, z, radius in [(.28, .56, .205), (-.59, .37, .187), (-.56, -.37, .32),
                          (.52, -.23, .30), (-.17, .76, .106), (-.32, .08, .14), (.46, .82, .084),
                          (.76, .25, .123), (-.18, -.77, .112)]:
        center = c + vector((x, -.066, z))
        m.rod("Shallow crater cuts", "disc facets", center, center - vector((0, .012, 0)), radius, radius * .92, sides=16)
        m.loop("Irregular crater engraving", "etched silver", center - vector((0, .017, 0)),
               (radius, 0, 0), (radius * .2, 0, radius * .71), .007, 22, 5)
    for i in range(-29, 30):
        k = i * .042
        span = math.sqrt(r * r - k * k) * .965
        for j in range(5):
            a = -span + 2 * span * j / 5 + .033 + m.random.random() * .06
            b = min(span, a + m.random.uniform(.14, .37))
            if b > a:
                m.rod("Circular relief etched hatches", "etched silver",
                      c + vector((a * .70 - k * .714, -.088, a * .714 + k * .70)),
                      c + vector((b * .70 - k * .714, -.088, b * .714 + k * .70)), .0028, sides=5)
    f = Figure(m, "Crystal costume", (.25, .04, .16), 1.51, -.27)
    f.loft("Tailored icy bodice", "white silk", [(0, .03, .60, .185, .143), (.016, .03, .75, .165, .122),
           (.03, .033, .89, .127, .106), (.033, .051, 1.05, .173, .121), (.035, .062, 1.184, .188, .121),
           (.025, .061, 1.228, .106, .093)])
    f.loft("Waist clasp", "night ink", [(.016, .038, .748, .169, .131), (.026, .043, .819, .153, .128)])
    f.tube("neck", "skin", [(.03, .069, 1.165), (.016, .071, 1.386)], [.079, .071])
    for i, (knee, ankle, toe) in enumerate([
        ((-.20, -.395, .389), (-.33, -.242, .053), (-.41, -.437, .053)),
        ((.432, -.182, .457), (.44, .158, .048), (.47, -.048, .048)),
    ]):
        hip = ((i * 2 - 1) * .093, .025, .65)
        boot_top = vector(knee).lerp(vector(ankle), .29)
        f.tube("Crouched knees", "skin", [hip, vector(hip).lerp(vector(knee), .52), knee, boot_top],
               [.131, .124, .100, .079], 12)
        f.tube("Silk boots", "white silk", [boot_top, vector(knee).lerp(vector(ankle), .66), ankle],
               [.083, .071, .055], 12)
        seated_shoe(f, "ice white", "shadow silk", ankle, toe)
    blades = [
        ((-.12, -.01, .782), (-.66, -.12, .372), .125), ((-.11, -.029, .771), (-.73, -.12, .645), .135),
        ((-.03, -.094, .78), (-.31, -.26, .123), .116), ((.10, -.103, .789), (.27, -.297, .073), .127),
        ((.14, -.016, .799), (.81, -.21, .438), .181), ((.139, .039, .81), (.923, .033, .719), .176),
        ((.121, .11, .809), (.858, .260, .993), .166), ((.091, .121, .816), (.62, .37, 1.34), .158),
        ((-.06, .132, .81), (-.38, .596, .779), .137),
    ]
    for i, (base, tip, width) in enumerate(blades):
        mats = ["white silk", "shadow silk"] if i % 2 else ["ice white", "lavender cut"]
        f.leaf("Separate sculpted skirt petals", mats, base, tip, width, (0, -.078, .099))
        f.tube("Petal midrib", "facet black", [base, vector(base).lerp(vector(tip), .55) + vector((0, -.091, .102)), tip], .005)
    # Sword goes through the outward hand and toward the stage at lower left.
    hilt = vector((-.51, -.322, 1.31))
    limb(f, "Sword arm", "white silk", "skin", (-.149, .04, 1.166), (-.434, -.203, .998),
         (-.49, -.32, 1.25), hilt + vector((-.032, -.012, .068)), .079, .10)
    limb(f, "Back bracing arm", "white silk", "skin", (.19, .049, 1.151), (.268, .263, .963),
         (.441, .247, .813), (.492, .208, .767), .077, .28)
    blade_low = f.point((-.89, -.55, .024))
    blade_high = f.point(hilt - vector((.035, .006, .120)))
    m.gem("Long sword blade", ["sword bright", "sword blue", "white rim"], blade_low, blade_high, .049, .027, .14)
    m.rod("Blade ridge silver", "sword bright", blade_low, blade_high, .008, .018, 6)
    m.rod("Indigo sword handle", "night ink", f.point(hilt - vector((.035, .012, .13))),
          f.point(hilt + vector((.039, .012, .191))), .031, .03, 10)
    for j in range(5):
        p = f.point(hilt + vector((j * .009, -.004, j * .038 - .045)))
        m.loop("Sword grip wraps", "lavender cut", p, (.042, 0, 0), (0, .042, 0), .005, 15)
    m.gem("Cut pommel", ["ice blue", "ice white", "sapphire"],
          f.point(hilt + vector((.015, 0, .158))), f.point(hilt + vector((.065, 0, .309))), .089, .071)
    m.gem("Sword cross guard", ["sword bright", "lavender cut", "ice white"],
          f.point(hilt + vector((-.22, .0, -.142))), f.point(hilt + vector((.155, .00, -.100))), .053, .032)
    h = Figure(m, f.group, f.point((.012, .046, 1.466)), 1.08, -.27)
    head(h, "skin", "sapphire", "ice blue", "night ink", "lip", "purple eye")
    for j in range(8):
        p = (j - 3.5) / 3.5
        m.gem("Crystal hair cuts", ["ice blue", "lavender cut", "sapphire", "ice white"],
              h.point((p * .073, -.067, .254)), h.point((p * .212, -.140 + abs(p) * .036, .028 - abs(p) * .156)),
              .036, .035, p)
    knot = h.point((0, .08, .254))
    m.oval("Pearl bow knot", "ice white", knot, (.150, .092, .100), (0, -.35, 0), sides=12, levels=6, smooth=False)
    for sign in (-1, 1):
        # Each lobe is a padded folded shell, with a deeper backshell visible from the side.
        tip = h.point((sign * (.59 if sign == 1 else .49), .13, .53 if sign == -1 else .414))
        bow_lobe(m, knot, tip, .24, ["ice white", "white silk", "lavender cut", "ice white"], .19 * sign)
        m.gem("Layered rear bow fold", ["shadow silk", "white silk", "lavender cut"],
              knot + vector((0, .074, -.032)), tip + vector((-.02 * sign, .143, -.12)), .202, .109)
        for j in range(4):
            p = knot.lerp(tip, .34 + j * .15) + vector((0, -.119 + .024 * j, .096 - .014 * j))
            m.oval("Small bow pearls", "ice white", p, (.019, .018, .018), sides=8, levels=5)
    sparkle(m, blade_low.lerp(blade_high, .26) + vector((0, -.024, .0)), .52, "spark violet")
    sparkle(m, knot + vector((-.27, -.21, .130)), .52, "spark blue")
    sparkle(m, (-1.56, .37, 1.89), .28, "spark violet")
    for j in range(40):
        theta = m.random.uniform(0, TAU)
        radius = m.random.uniform(.80, 2.40)
        p = (math.cos(theta) * radius, m.random.uniform(.56, 2.5), 1.93 + math.sin(theta) * radius * .80)
        m.oval("Sparse spectral motes", "spark blue" if j % 3 else "spark violet", p, (.008, .007, .009), sides=5, levels=4)
    lights(SPECS["diamond"], .122, [
        ("Tight upper left cold white", "#edf6ff", 480, (-2.2, -.81, 4.8), (.06, .15, 2.15), .73),
        ("Crystal rim cobalt", "#86a3ff", 220, (1.5, 1.62, 3.1), (.36, .05, 1.55), 1.12),
        ("Violet sword bounce", "#d0a3ff", 61, (-2.1, -1.9, 1.5), (-.1, -.4, 1.75), 1.80),
    ])


def photographer(m, origin, scale, yaw, coat, with_hat, pose):
    f = Figure(m, "Photographer " + pose, origin, scale, yaw)
    f.loft("paper coat", coat, [(0, .01, .56, .217, .149), (0, .025, .72, .224, .145),
           (-.018, .034, .94, .242, .158), (-.039, .041, 1.14, .265, .145),
           (-.04, .037, 1.21, .115, .103)])
    f.loft("ink keel", "audience edge", [(-.012, .007, .57, .220, .151), (-.012, .02, .595, .223, .155)])
    f.tube("neck", coat, [(-.041, .048, 1.153), (-.047, .037, 1.315)], [.076, .079])
    f.oval("faceless paper profile", coat, (-.046, .025, 1.396), (.174, .142, .209))
    f.tube("cheek outline", "audience edge", [(-.157, -.071, 1.463), (-.188, -.032, 1.378),
           (-.149, -.072, 1.29), (-.061, -.083, 1.203)], .007, 6)
    f.oval("hair mass or cap", "audience hair", (-.049, .047, 1.5), (.18, .147, .133))
    if with_hat:
        f.oval("cap brim", "audience edge", (-.049, -.005, 1.531), (.232, .198, .023))
        f.oval("rounded cap top", coat, (-.048, .034, 1.575), (.171, .13, .094))
    for side in (-1, 1):
        foot = (.163 * side, -.086 if side < 0 else .03, .048)
        f.tube("stance legs", coat, [(.123 * side, .0, .613), (.154 * side, -.04, .31), foot],
               [.133, .104, .079], 10)
        f.oval("shoe", "audience edge", (foot[0], foot[1] - .045, .048), (.096, .149, .052))
        limb(f, "Camera raising", coat, "audience hand", (.19 * side, .036, 1.14),
             (.315 * side, -.102, .902 + .023 * side), (.145 * side, -.274, 1.295),
             (.11 * side, -.303, 1.349), .083, .75)
    def prop_box(label, mat, pos, size, radius):
        m.round_box("Sculpted camera " + label, mat, f.point(pos), [scale * d for d in size], radius * scale, yaw)

    prop_box("body", "audience edge", (0, -.307, 1.353), (.289, .113, .177), .016)
    prop_box("shoe", "audience lens", (-.06, -.305, 1.451), (.094, .07, .027), .010)
    prop_box("shutter", "audience hand", (.086, -.295, 1.447), (.041, .045, .020), .006)
    for y, length, r, mat in [(-.359, .065, .076, "audience lens"), (-.416, .074, .067, "audience edge"),
                                (-.489, .020, .057, "camera reflection")]:
        m.rod("Sculpted camera lens barrels", mat, f.point((.01, y, 1.343)), f.point((.01, y - length, 1.343)),
              r * scale, r * .978 * scale, 12)
    f.tube("Camera neck strap", "audience edge", [(-.13, -.274, 1.353), (-.211, -.175, 1.08),
           (0, -.173, .902), (.195, -.16, 1.102), (.127, -.26, 1.35)], .010, 6)


def cosplayer(m):
    palette(m, {
        "blue paper": ("#b7c8ce", .75), "rose backing": ("#d59b9e", .72, 0, .08),
        "pale rose": ("#e1b1b0", .77), "rose felt": ("#c9909b", .74), "rose charcoal": ("#99717e", .73),
        "blue gray": ("#aab3c4", .73), "audience edge": ("#7d6b80", .65),
        "audience hair": ("#9e7b86", .61), "audience hand": ("#e0b6b6", .67),
        "audience lens": ("#a08292", .55), "camera reflection": ("#c2a9b7", .28, .11),
        "graphite": ("#3e3a4d", .69), "pale graphite": ("#727080", .69),
        "ivory": ("#fcf1e4", .68), "skin": ("#ead4c5", .64), "lip": ("#a06677", .67),
        "paper hair": ("#ddd2c8", .69), "paper hair edge": ("#9b858a", .70),
        "ink costume": ("#292439", .54), "ink highlight": ("#4b4055", .54),
        "ear lining": ("#a4828b", .63), "soft iris": ("#90768d", .39),
        "phone edge": ("#494758", .50), "phone glass": ("#8d96af", .22, .22, .11),
        "lens light": ("#c9d0e7", .26, .14, .50), "figure dais": ("#dce4df", .72),
        "seam gray": ("#99a3b0", .73), "diffuser": ("#e9d4d4", .62, 0, .72),
    })
    floor(m, "blue paper", 24)
    for i in range(-10, 11):
        m.box("Pencil floor rulings", "seam gray", (i * .5, 1.0, .005), (.012, 15, .003))
        m.box("Pencil floor rulings", "seam gray", (0, i * .5, .006), (12, .012, .003))
    for i in range(14):
        x = -.25 - i * .05
        m.rod("Sparse crossed pencil hatching", "pale graphite", (x, -.21 - i * .083, .008),
              (x - .46, -.61 - i * .078, .008), .0030, sides=5)
    # A curved studio sweep joins the grey-blue foreground to a dusty rose rear field.
    xspan = 8.0
    rear = [(5.03, .00), (5.34, .033), (5.59, .119), (5.79, .273), (5.92, .49),
            (5.99, .77), (6.02, 1.1), (6.02, 7.5)]
    for i in range(len(rear) - 1):
        y, z = rear[i]
        yy, zz = rear[i + 1]
        m.panel("Curved rose paper sweep", "rose backing", [(-xspan, y, z), (xspan, y, z),
                (xspan, yy, zz), (-xspan, yy, zz)], (0, .021, -.018))
    for index, (x, y, scale, yaw, mat) in enumerate([
        (-2.62, .29, 1.04, .87, "rose felt"), (-2.22, 1.88, 1.28, .53, "pale rose"),
        (-1.13, 2.58, 1.31, .20, "rose felt"), (.16, 3.32, 1.42, -.05, "pale rose"),
        (1.38, 2.69, 1.29, -.34, "rose felt"), (2.47, 1.65, 1.18, -.48, "blue gray"),
        (2.75, 3.86, 1.33, -.32, "pale rose"), (-2.93, 3.83, 1.36, .34, "rose felt"),
    ]):
        # The ring of photographers aims in, so each body and lens has a side view.
        photographer(m, (x, y, 0), scale, yaw, mat, index % 3 == 0, str(index + 1))
    m.loft("Paper posing step", "figure dais", [(0, .0, .006, .97, .76),
           (0, .0, .073, .97, .76), (0, .0, .086, .94, .735)], 48)
    m.loop("Fine ink edge on posing step", "seam gray", (0, 0, .077), (.956, 0, 0), (0, .746, 0), .004, 48)
    m.round_box("Simple graphite posing stool", "ink costume", (0, .132, .75), (.65, .44, .146), .05)
    for sx, sy in ((-1, -1), (-1, 1), (1, -1), (1, 1)):
        m.rod("Stool feet", "graphite", (sx * .276, .132 + sy * .19, .087), (sx * .208, .132 + sy * .143, .72), .024)
    f = Figure(m, "Long eared sitter", (0, .082, .09), 1.53, -.16)
    f.loft("Dark satin costume", "ink costume", [(0, .012, .44, .211, .169),
           (0, .018, .56, .187, .151), (.002, .022, .68, .145, .113),
           (.008, .045, .87, .164, .115), (.028, .062, 1.018, .200, .124), (.034, .069, 1.047, .177, .096)])
    f.loft("Paper shoulders", "skin", [(.028, .057, 1.018, .188, .111), (.024, .059, 1.096, .207, .108),
           (.025, .057, 1.149, .150, .091), (.026, .051, 1.180, .079, .077), (.026, .04, 1.309, .067, .063)])
    f.loft("Paper costume collar", "ivory", [(.026, .05, 1.177, .085, .077), (.026, .044, 1.224, .075, .072)])
    for side in (-1, 1):
        f.tube("Folded costume waist seams", "ink highlight",
               [(side * .139, -.100, .526), (side * .097, -.101, .69),
                (side * .104, -.099, .851), (side * .164, -.057, 1.022)], .007, 6)
        f.leaf("Small black neck bow", ["graphite", "ink costume"], (.022, -.042, 1.199),
               (.022 + side * .093, -.071, 1.230), .039, (0, -.026, 0))
    limb(f, "Hand at chin", "skin", "skin", (-.173, .048, 1.10), (-.302, -.093, .823),
         (-.199, -.266, 1.107), (-.087, -.268, 1.169), .069, .13)
    limb(f, "Hand at seat", "skin", "skin", (.203, .043, 1.085), (.307, -.049, .823),
         (.394, -.23, .547), (.391, -.26, .446), .072, .19)
    f.tube("White wrist cuff", "ivory", [(.385, -.211, .582), (.395, -.239, .536)], [.058, .057])
    for i, (hip, knee, ankle, toe) in enumerate([
        ((-.103, .019, .51), (-.229, -.393, .357), (-.214, -.475, .037), (-.235, -.629, .045)),
        ((.110, .023, .50), (.251, -.329, .403), (.313, -.356, .052), (.345, -.500, .053)),
    ]):
        f.tube("Hosiery volume", "paper hair", [hip, vector(hip).lerp(vector(knee), .49), knee,
               vector(knee).lerp(vector(ankle), .52), ankle], [.138, .123, .099, .073, .055], 14)
        seated_shoe(f, "ink costume", "graphite", ankle, toe)
        # Two loose ink directions wrap the stockings over their actual volumes.
        for a, b, ra, rb in [(hip, knee, .139, .101), (knee, ankle, .100, .056)]:
            a, b = vector(a), vector(b)
            t = (b - a).normalized()
            u = t.cross(vector((0, 1, 0))).normalized()
            v = t.cross(u)
            for side in (-1, 1):
                for stripe in range(6):
                    pts = []
                    for j in range(14):
                        k = j / 13
                        phi = TAU * (stripe / 6 + side * .57 * k)
                        pts.append(a.lerp(b, k) + (u * math.cos(phi) + v * math.sin(phi)) * (ra * (1 - k) + rb * k))
                    f.tube("Hosiery ink crosslines", "graphite", pts, .0034, 5)
    h = Figure(m, f.group, f.point((.026, .027, 1.377)), 1.0, -.05)
    head(h, "skin", "paper hair", "paper hair edge", "graphite", "lip", "soft iris")
    for side in (-1, 1):
        h.ring("Dark circular eyewear", "graphite", (side * .086, -.185, -.025), (.074, 0, 0),
               (0, .005, .074), .008, 28)
        h.tube("Eye glass temple arms", "graphite", [(side * .159, -.176, -.013), (side * .207, -.109, .009),
               (side * .213, .028, -.031)], .0065, 6)
        for j in range(7):
            h.tube("Twin tail graphite strand", "paper hair edge" if j % 3 == 0 else "paper hair", [
                (.176 * side, .105, -.105), ((.20 + .009 * j) * side, .108, -.259),
                ((.32 + .009 * j) * side, .109, -.317 + j * .004),
                ((.41 + .013 * j) * side, .058, -.407 + j * .004),
                ((.31 + .012 * j) * side, .019, -.493 + j * .014)],
                [.030, .031, .033, .028, .004], 7)
        h.leaf("Black hair ribbon", ["graphite", "ink costume"], (.194 * side, .074, -.197),
               (.319 * side, .100, -.265), .045, (0, -.028, .031))
    h.tube("Eyeglass bridge", "graphite", [(-.018, -.19, -.023), (0, -.198, -.014), (.019, -.189, -.023)], .005, 6)
    h.ring("Dark ear band", "ink costume", (0, .048, .115), (.217, 0, 0), (0, -.018, .156), .021, 32)
    for base, tip, width in [((-.116, .061, .223), (-.56, .11, .838), .107),
                              ((.109, .061, .230), (.723, .16, .602), .125)]:
        spine = h.leaf("Asymmetric long ears", ["graphite", "ink costume"], base, tip, width, (0, -.129, .06))
        eased = vector(base).lerp(vector(tip), .13)
        h.leaf("Warm graphite ear inset", ["ear lining", "ink highlight"], tuple(eased),
               tuple(vector(base).lerp(vector(tip), .90)), width * .65, (0, -.149, .059))
        m.tube("Ear stitched spine", "pale graphite", spine, .005, 6)
    # The closest person holds a separate physical phone, with a blank small reflection.
    before_phone = set(m.batches)
    m.round_box("Vertical foreground phone case", "phone edge", (1.21, -2.39, 1.37), (.377, .077, .648), .029, .19)
    m.round_box("Inset blank phone glass", "phone glass", (1.215, -2.431, 1.37), (.335, .013, .594), .005, .19)
    m.panel("Phone glass angled reflection", "lens light", [(1.07, -2.47, 1.569), (1.20, -2.443, 1.655),
            (1.36, -2.413, 1.569), (1.10, -2.463, 1.435)], (0, .004, 0))
    m.oval("Phone rear lens", "lens light", (1.11, -2.38, 1.59), (.027, .010, .029))
    phone_holder = Figure(m, "Near kneeling photographer", (1.19, -2.92, 0), 1, math.pi)
    phone_holder.loft("paper back", "blue gray", [(0, .018, .11, .28, .19), (0, .005, .41, .26, .17),
                      (0, -.018, .66, .33, .17), (0, -.05, .80, .22, .139)])
    phone_holder.oval("hood at shoulder", "blue gray", (0, -.032, .76), (.22, .17, .138))
    phone_holder.oval("low head", "audience hair", (0, -.06, .93), (.130, .118, .149))
    for side in (-1, 1):
        start = (1.19 + side * .25, -2.84, .72)
        a = (1.20 + side * .35, -2.61, .67)
        b = (1.204 + side * .164, -2.39, 1.20)
        m.tube("Foreground phone paper sleeves", "blue gray", [start, a, (a[0], a[1], .94)],
               [.16, .130, .091])
        m.tube("Foreground phone holder hands", "audience hand", [(a[0], a[1], .88), b,
               (1.22 + side * .15, -2.38, 1.36)], [.093, .083, .040])
        for k in range(3):
            m.rod("Phone grip fingers", "audience hand", (1.21 + side * .181, -2.415, 1.28 + k * .041),
                  (1.21 + side * .137, -2.43, 1.3 + k * .04), .015, .011, 7)
    for part, mat in set(m.batches) - before_phone:
        verts, faces, shading = m.batches[part, mat]
        m.batches[part, mat] = ([(x - .22, y, z) for x, y, z in verts], faces, shading)
    for x, y in [(-2.77, -.80), (2.89, .74)]:
        m.rod("Studio light stand", "audience edge", (x, y, .03), (x, y, 3.20), .032, .022)
        for j in range(3):
            phi = TAU * j / 3
            m.rod("Spreading stand legs", "audience edge", (x, y, .33),
                  (x + math.cos(phi) * .32, y + math.sin(phi) * .32, .03), .024)
        m.round_box("Square softbox backshell", "graphite", (x, y, 3.20), (.69, .16, .57), .048, .34 if x < 0 else -.34)
        m.box("Paper softbox face", "diffuser", (x, y - .093, 3.20), (.59, .041, .47), .34 if x < 0 else -.34)
    lights(SPECS["cosplayer"], .36, [
        ("Hard key from upper right", "#fff3e5", 900, (3.65, -1.03, 5.10), (0, .05, 1.0), .83),
        ("Pink upper sweep", "#ffc4c8", 820, (-1.7, 3.5, 4.7), (0, 4.5, 2.0), 4.0),
        ("Cool paper bounce", "#d2ddff", 155, (-2.9, -3.6, 2.75), (0, 0, 1.4), 3.0),
    ])


BUILDERS = {"solitude": solitude, "2025-36": thirty_six, "mirror": mirror_room,
            "diamond": diamond, "cosplayer": cosplayer}


def y_up(point):
    x, y, z = point
    return [x, z, -y]


def room_config(item, spec):
    slug = item["slug"]
    path = "./rooms/" + slug
    sky, key, fill, ground, key_power, fill_power, sky_power, near, far = spec["look"]
    return {
        "id": slug, "year": item["year"], "workId": item["workId"], "title": item["title"],
        "model": f"{path}/scene.glb",
        "stills": [f"{path}/view-{i}.webp" for i in range(2)],
        "mobileStills": [f"{path}/view-{i}-mobile.webp" for i in range(2)],
        "views": [{"label": label, "description": description, "position": y_up(pos),
                   "target": y_up(target), "fov": 50, "mobileFov": 55}
                  for label, description, pos, target in spec["views"]],
        "look": {"sky": sky, "fog": {"color": sky, "near": near, "far": far},
                 "key": key, "fill": fill, "ground": ground, "keyIntensity": key_power,
                 "fillIntensity": fill_power, "skyIntensity": sky_power},
    }


def camera(name, position, target, fov):
    data = bpy.data.cameras.new(name)
    data.sensor_fit = "VERTICAL"
    data.sensor_height = 32
    data.lens = data.sensor_height / (2 * math.tan(math.radians(fov) / 2))
    data.clip_start = .035
    data.clip_end = 140
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
    return obj


def gpu(scene):
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = backend
            prefs.refresh_devices()
            active = [d for d in prefs.devices if d.type == backend]
        except (RuntimeError, TypeError):
            continue
        if active:
            for device in prefs.devices:
                device.use = device in active
            scene.cycles.device = "GPU"
            print(f"RENDER_DEVICE {backend} {', '.join(d.name for d in active)}", flush=True)
            return
    scene.cycles.device = "CPU"
    print("RENDER_DEVICE CPU", flush=True)


def configure_render(scene, phase, cpu):
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.compression = 15
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    if phase == "gray":
        scene.render.engine = "BLENDER_WORKBENCH"
        shade = scene.display.shading
        shade.light = "STUDIO"
        shade.color_type = "SINGLE"
        shade.single_color = (.67, .67, .67)
        shade.show_cavity = True
        shade.cavity_type = "BOTH"
        shade.show_shadows = True
        scene.view_settings.view_transform = "Standard"
        # Workbench draws panes opaque, so keep the clear openings while
        # leaving the actual frames, droplets and mirror bay in place.
        for obj in scene.objects:
            if "glazing" in obj.name or "Blue silvered glass" in obj.name:
                obj.hide_render = True
        return
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 32 if phase == "final" else 12
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = .049 if phase == "final" else .095
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 7
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 3
    scene.cycles.transparent_max_bounces = 12
    if not cpu:
        gpu(scene)


def render(scene, cam, path, size):
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    if not path.is_file():
        raise RuntimeError(f"Render output missing: {path}")


def to_webp(png, output):
    # ffmpeg is external because Blender writes PNG, not WebP.
    temp = output.with_name(f".{output.stem}-encoding.webp")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(png),
                    "-c:v", "libwebp", "-quality", "91", str(temp)], check=True)
    temp.replace(output)


def export_meshes(path):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj.data.polygons:
            obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                             export_yup=True, export_texcoords=False, export_cameras=False,
                             export_lights=False, export_animations=False)


def reframe_inspection(slug, evidence, cpu):
    """Update the evidence angle in an existing blend without rebuilding room assets."""
    path = evidence / "blends" / f"{slug}.blend"
    bpy.ops.wm.open_mainfile(filepath=str(path), use_scripts=False)
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene
    spec = SPECS[slug]
    cam = bpy.data.objects["side-inspection"]
    cam.location = spec["inspect"]
    target = spec.get("inspectTarget", spec["views"][0][3])
    cam.rotation_euler = (vector(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.wm.save_as_mainfile(filepath=str(path), compress=True)
    configure_render(scene, "final", cpu)
    render(scene, cam, evidence / "final" / slug / "side-inspection.png", (900, 560))
    configure_render(scene, "gray", cpu)
    render(scene, cam, evidence / "gray" / slug / "side-inspection.png", (680, 420))


def build(item, phase, evidence, cpu):
    slug = item["slug"]
    spec = SPECS[slug]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new(f"{slug} world")
    scene.unit_settings.system = "METRIC"
    model = Model(20251 + list(SPECS).index(slug))
    BUILDERS[slug](model)
    model.emit()
    scene["artwork_id"] = item["workId"]
    scene["reference"] = item["filename"]
    scene["first_view_fov_vertical"] = 50
    cameras = {}
    for i, (_, _, pos, target) in enumerate(spec["views"]):
        cameras[f"view-{i}"] = camera(f"view-{i}", pos, target, 50)
        cameras[f"view-{i}-mobile"] = camera(f"view-{i}-mobile", pos, target, 55)
    cameras["side-inspection"] = camera("side-inspection", spec["inspect"],
                                        spec.get("inspectTarget", spec["views"][0][3]), 51)
    configure_render(scene, phase, cpu)
    stage = evidence / phase / slug
    stage.mkdir(parents=True, exist_ok=True)
    desktop, mobile = {"gray": ((680, 420), (335, 520)), "proof": ((768, 480), (382, 620)),
                       "final": ((1440, 900), (720, 1120))}[phase]
    scene.camera = cameras["view-0"]
    scene.render.resolution_x, scene.render.resolution_y = desktop
    scene.render.filepath = "//"
    final = phase == "final"
    if final:
        path = evidence / "blends"
        path.mkdir(parents=True, exist_ok=True)
        blend = path / f"{slug}.blend"
        bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
        bpy.ops.wm.open_mainfile(filepath=str(blend), use_scripts=False)
        scene = bpy.context.scene
        cameras = {name: bpy.data.objects[name] for name in cameras}
        assert len([obj for obj in scene.objects if obj.type == "MESH"]) == len(model.batches)
        output = ROOT / "public" / "painted-worlds" / "rooms" / slug
        output.mkdir(parents=True, exist_ok=True)
        export_meshes(stage / "scene.glb")
        if (stage / "scene.glb").stat().st_size > 2_500_000:
            raise ValueError(f"{slug}: GLB exceeds 2.5 MB")
    for name, cam in cameras.items():
        if phase == "gray" and name.endswith("-mobile"):
            continue
        size = mobile if name.endswith("-mobile") else desktop
        if final and name == "side-inspection":
            size = (900, 560)
        png = stage / f"{name}.png"
        render(scene, cam, png, size)
        if final and name != "side-inspection":
            to_webp(png, output / f"{name}.webp")
    if final:
        (output / "scene.glb").write_bytes((stage / "scene.glb").read_bytes())
        config = json.dumps(room_config(item, spec), ensure_ascii=False, indent=2)
        (output / "room.json").write_text(config + "\n", encoding="utf-8")
    print(f"ROOM_READY {phase} {slug} {len(model.batches)} mesh batches", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--phase", choices=("gray", "proof", "final"), required=True)
    parser.add_argument("--only", nargs="+", choices=list(SPECS))
    parser.add_argument("--cpu", action="store_true")
    parser.add_argument("--inspection-only", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    source = args.source.resolve()
    evidence = source / "2025-場景證據"
    if args.inspection_only:
        if args.phase != "final" or not args.only:
            parser.error("--inspection-only needs --phase final and the saved blend slug(s) after --only")
        for slug in args.only:
            reframe_inspection(slug, evidence, args.cpu)
        return
    items = {item["slug"]: item for item in json.loads((source / "inventory.json").read_text(encoding="utf-8-sig"))
             if item["year"] == 2025}
    for slug in args.only or SPECS:
        build(items[slug], args.phase, evidence, args.cpu)


if __name__ == "__main__":
    main()
