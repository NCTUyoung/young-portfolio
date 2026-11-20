"""A graphite coastal plate with a built-in, fully modeled Speedster."""

import math
import random

from mathutils import Vector

from painted_worlds_2026 import area, backdrop, box, cylinder, ellipsoid, material, mesh, spline, tube


VIEWS = [
    dict(label='沿海公路', description='貼近路面從車頭望去，圓頭燈、低車身與掌葉在海平線前交錯。',
         position=(-5.25, -7.4, 2.23), target=(-.16, -.03, .99), fov=36, mobileFov=55),
    dict(label='掌影下停駐', description='從車尾偏向打開的車門，能看進座艙和桶椅。近處是草帽與翻開的書。',
         position=(4.88, -6.8, 3.32), target=(.48, -.55, .83), fov=38, mobileFov=60),
]
CHECKS = [((-.7, 7.3, 3.15), (0, 0, .72), 39), ((7.6, 4.1, 3.1), (0, 0, .73), 41)]
READER_VIEWS = [
    dict(label='沿海公路', description='從左前方沿著墨線公路看過低車身，右側寬簷帽、手籃和坐姿衣褶落在同一幅海景。',
         position=(-5.05, -7.85, 2.25), target=(.86, -.70, .94), fov=35, mobileFov=68),
    dict(label='掌影下停駐', description='往車尾側換站，從打開的門看進座位與儀表，近處可看見寬簷帽、衣褶和手籃。',
         position=(4.57, -7.42, 3.24), target=(1.03, -.93, .77), fov=42, mobileFov=65),
]
READER_CHECKS = [((5.75, -3.46, 1.64), (2.91, -2.66, .61), 33), ((4.7, .73, 1.91), (2.91, -2.66, .64), 32)]
LOOK = dict(sky='#dfded8', fog=dict(color='#dfded8', near=15, far=45), key='#fffcf1', fill='#dde5ed',
            ground='#948c83', keyIntensity=2.6, fillIntensity=.62, skyIntensity=1.14)


def interpolate(knots, x):
    """Interpolate evenly through irregularly spaced cross sections."""
    for i in range(len(knots)-1):
        a, b = knots[i], knots[i+1]
        if a[0] <= x <= b[0] + 1e-6:
            prev, after = knots[max(0, i-1)], knots[min(len(knots)-1, i+2)]
            span = b[0]-a[0]
            t = (x-a[0])/span
            return tuple((2*t**3-3*t*t+1)*p + (t**3-2*t*t+t)*span*(q-r)/(b[0]-prev[0])
                         + (-2*t**3+3*t*t)*q + (t**3-t*t)*span*(s-p)/(after[0]-a[0])
                         for p, q, r, s in zip(a[1:], b[1:], prev[1:], after[1:]))
    raise ValueError(x)


SECTIONS = [(-2.132, .057, .504, .56), (-2.11, .286, .522, .575), (-2.062, .498, .57, .617), (-2.02, .64, .63, .68), (-1.89, .78, .76, .78),
            (-1.65, .89, .89, .83), (-1.3, .925, .99, .88), (-.88, .91, .97, .91),
            (-.58, .865, .95, .95), (0, .84, .94, .94), (.58, .88, .99, .96),
            (.95, .93, 1.01, .95), (1.36, .92, .95, .89), (1.72, .86, .84, .80),
            (1.97, .71, .70, .66), (2.095, .48, .55, .55), (2.12, .22, .44, .47)]
AXLES = (-1.30, 1.30)
WHEEL_Z = .407
COCKPIT = (-.59, .74)
DOOR = (-.55, .59)


def wheel_cut(x):
    d = min(abs(x-a) for a in AXLES)
    if d >= .465:
        return .245
    # The bevel at each opening is modeled into the quarter panel.
    return max(.245, WHEEL_Z + .464*math.sqrt(max(0, 1-(d/.465)**2)) - .16*(d/.465)**12)


def body_profile(x):
    width, shoulder, crown = interpolate(SECTIONS, x)
    lower = min(wheel_cut(x), shoulder-.037)
    # Rocker, bulged side wall, fender shoulder, then the thin lip at the cockpit.
    return [(0, .225), (.48*width, .225), (.70*width, lower-.03), (.946*width, lower),
            (.999*width, lower*.67+shoulder*.33), (width, lower*.29+shoulder*.71),
            (.955*width, shoulder-.045), (.865*width, shoulder), (.775*width, shoulder*.69+crown*.31),
            (.575*width, shoulder*.35+crown*.65), (.31*width, shoulder*.16+crown*.84), (0, crown)]


def body(m):
    first, last = SECTIONS[0][0], SECTIONS[-1][0]
    x_values = {first, last, *COCKPIT, *DOOR, *(s[0] for s in SECTIONS), *(round(first+(last-first)*i/92, 5) for i in range(93))}
    for axle in AXLES:
        x_values.update(axle+.465*math.cos(math.pi*i/24) for i in range(25))
    x_values = sorted(x_values)
    for sign in (-1, 1):
        verts = [(x, sign*y, z) for x in x_values for y, z in body_profile(x)]
        columns = len(body_profile(0))
        faces = []
        for i, (a, b) in enumerate(zip(x_values, x_values[1:])):
            mid = (a+b)/2
            in_cockpit = COCKPIT[0] <= mid <= COCKPIT[1]
            door_opening = sign < 0 and DOOR[0] < mid < DOOR[1]
            for j in range(8 if in_cockpit else columns-1):
                if door_opening and j >= 3:
                    continue
                face = (i*columns+j, (i+1)*columns+j, (i+1)*columns+j+1, i*columns+j+1)
                faces.append(face if sign < 0 else face[::-1])
        for i in (0, len(x_values)-1):
            # Closing fan from the center plane of the rounded nose and tail.
            mid = i*columns
            for j in range(1, columns-1):
                face = (mid, mid+j, mid+j+1)
                faces.append(face if (i == 0) == (sign > 0) else face[::-1])
        mesh('Speedster body / warm paper coachwork', verts, faces, m['paint'], True)
        for axle in AXLES:
            edge = [(x, sign*(body_profile(x)[3][0]+.004), body_profile(x)[3][1]+.006) for x in x_values if abs(x-axle) <= .46501]
            tube('Speedster trim / wheel opening ink', edge, m['ink'], .010, 5)
        door = []
        for x, row in [(-.58, 7), (-.54, 6), (-.53, 5), (-.54, 4), (-.49, 3), (.36, 3), (.48, 4), (.55, 5), (.58, 6), (.62, 7)]:
            y, z = body_profile(x)[row]
            point = (x, sign*(y+.007), z+.007)
            if row == 3:
                point = (x, sign*(body_profile(x)[4][0]+.009), z+.065)
            door.append(point)
        if sign > 0:
            tube('Speedster trim / closed door seam', spline(door, 3), m['ink'], .008, 5)
            tube('Speedster trim / rocker chrome', [(-.74, sign*.855, .32), (-.45, sign*.861, .31), (.47, sign*.896, .31), (.74, sign*.893, .32)], m['rim'], .012, 7)
            tube('Speedster trim / handle', [(.29, sign*.91, .872), (.43, sign*.927, .88), (.51, sign*.924, .878)], m['ink'], .018, 8)
        # Thin construction lines along the upper fenders, as in a pen drawing.
        for anchor in (-1.32, 1.33):
            line = [(x, sign*(body_profile(x)[7][0]-.015), body_profile(x)[7][1]+.008) for x in x_values if abs(x-anchor) < .71]
            tube('Speedster trim / upper shoulder glint', line, m['rim'], .008, 5)
    rim = [(.74, -body_profile(.74)[8][0], body_profile(.74)[8][1]+.005)]
    for x in [.74, .68, .47, .1, -.27, -.52, -.59]:
        y, z = body_profile(x)[8]
        rim.append((x, y, z+.005))
    rim.append((-.59, -body_profile(-.59)[8][0], body_profile(-.59)[8][1]+.005))
    tube('Cabin / curved deck lip', rim, m['ink'], .023, 8)
    box('Cabin / floor pan', (.05, 0, .325), (1.50, 1.37, .09), m['leather'], .07)
    box('Cabin / low open sill', (.025, -.706, .259), (1.16, .210, .10), m['paint'], .033)
    for sign in (-1, 1):
        if sign > 0:
            box('Cabin / deep inside wall', (.06, sign*.672, .65), (1.30, .11, .55), m['leather'], .045)
        box('Cabin / seat pad', (.25, sign*.31, .429), (.67, .50, .16), m['seat'], .07)
        seat = box('Cabin / speedster bucket back', (.57, sign*.31, .65), (.17, .47, .56), m['seat'], .077)
        seat.rotation_euler.y = .22
        for j in (-1, 0, 1):
            y = sign*.31+j*.09
            tube('Cabin / upholstery stitch', [(.456, y, .47), (.468, y, .62), (.508, y, .83)], m['leather'], .008, 5)
    box('Cabin / dashboard', (-.53, 0, .83), (.23, 1.29, .25), m['leather'], .055)
    for y, radius in ((-.35, .064), (-.21, .048), (-.49, .046)):
        cylinder('Cabin / gauge ring', (-.437, y, .88), (-.402, y, .88), radius, m['rim'], 20)
        cylinder('Cabin / gauge dial', (-.403, y, .88), (-.397, y, .88), radius*.78, m['ink'], 20)
    cylinder('Cabin / steering column', (-.53, -.34, .71), (-.245, -.34, .90), .034, m['rim'], 14)
    wheel = [(-.25-.04*math.sin(t), -.34+.16*math.cos(t), .90+.147*math.sin(t)) for t in (math.tau*i/24 for i in range(24))]
    tube('Cabin / steering wheel', wheel, m['ink'], .019, 7, True)
    for i in (0, 8, 16):
        tube('Cabin / steering spokes', [wheel[i], (-.247, -.34, .90)], m['rim'], .014, 6)
    tube('Cabin / gear lever', [(.04, 0, .4), (-.02, 0, .57)], m['rim'], .012, 6)
    ellipsoid('Cabin / shift knob', (-.021, 0, .579), (.028, .025, .025), m['ink'], 12, 8)


def open_door(m):
    a, b = DOOR
    hinge = Vector((a, -.79, .48))
    yaw = -.91

    def swing(p):
        x, y, z = Vector(p)-hinge
        return hinge+Vector((x*math.cos(yaw)-y*math.sin(yaw), x*math.sin(yaw)+y*math.cos(yaw), z))

    xs = [a+(b-a)*i/24 for i in range(25)]
    n = 6
    skin = [[(x, -y, z) for y, z in body_profile(x)[3:9]] for x in xs]
    vertices = [swing(p) for row in skin for p in row]
    vertices += [swing((x, y+.075, z-.012)) for row in skin for x, y, z in row]
    surface = [(i*n+j, (i+1)*n+j, (i+1)*n+j+1, i*n+j+1) for i in range(len(xs)-1) for j in range(n-1)]
    half = len(vertices)//2
    perimeter = [*range(n), *[i*n+n-1 for i in range(1, len(xs))], *range(half-2, half-n-1, -1), *[i*n for i in range(len(xs)-2, 0, -1)]]
    rim_faces = [(i, j, half+j, half+i) for i, j in zip(perimeter, perimeter[1:]+perimeter[:1])]
    faces = surface+[tuple(half+k for k in reversed(face)) for face in surface]+rim_faces
    mesh('Open door / coachwork with upholstered reverse', vertices, faces, (m['paint'], m['seat'], m['leather']), True,
         [0]*len(surface)+[1]*len(surface)+[2]*len(rim_faces))
    tube('Open door / edge seam', [vertices[i] for i in perimeter], m['ink'], .010, 6, True)
    for x in (a, b):
        p = [(x, -y, z) for y,z in body_profile(x)[3:9]]
        for side, slot in ((0, m['paint']), (.075,m['leather'])):
            tube('Cabin / finished door jamb', [(a0,y+side,z) for a0,y,z in p], slot, .023, 7)
    for z in (.43,.72):
        cylinder('Open door / pinned hinges', (a, -.804, z), (a, -.804, z+.073), .033, m['rim'], 12)
    tube('Open door / outer handle', [swing((x, -.925, z)) for x,z in ((.26,.832),(.39,.844),(.47,.839))], m['ink'], .018, 8)
    tube('Open door / inner pull', [swing((x, -.79, z)) for x,z in ((.15,.61),(.30,.65),(.44,.65))], m['ink'], .019, 8)


def fittings(m):
    silhouette = [(-.65, -.69, 1.00), (-.49, -.63, 1.39), (-.40, -.50, 1.49), (-.37, 0, 1.51),
                  (-.40, .50, 1.49), (-.49, .63, 1.39), (-.65, .69, 1.00), (-.71, 0, .987)]
    tube('Windshield / rolled silver frame', silhouette, m['rim'], .020, 8, True)
    # Open cockpit remains readable over the glass; reflection strokes mark the pane.
    mesh('Windshield / curved glass', [(-.53, 0, 1.22), *silhouette], [(0, i+1, (i+1)%len(silhouette)+1) for i in range(len(silhouette))], m['glass'])
    for sign in (-1, 1):
        tube('Windshield / reflection strokes', [(-.52, sign*.47, 1.23), (-.42, sign*.34, 1.44)], m['rim'], .007, 5)
        tube('Speedster trim / mirror stalk', [(-.67, sign*.73, 1.002), (-.70, sign*.92, 1.12)], m['rim'], .017, 8)
        ellipsoid('Speedster trim / tear-shaped mirror', (-.70, sign*.94, 1.13), (.05, .085, .043), m['rim'], 18, 10)
        lamp = (-1.788, sign*.643, .846)
        out = Vector((-.80, sign*.14, .58)).normalized()
        p = Vector(lamp)
        ellipsoid('Speedster body / round fender lamp seat', (-1.711, sign*.642, .808), (.213, .156, .126), m['paint'], 24, 14)
        cylinder('Speedster trim / lamp gasket', p-out*.007, p+out*.019, .137, m['ink'], 28)
        cylinder('Speedster trim / lamp chrome bezel', p+out*.017, p+out*.038, .130, m['rim'], 28)
        cylinder('Speedster trim / lamp glass', p+out*.038, p+out*.050, .110, m['lamp'], 28)
        for offset in (-.056, -.028, 0, .028, .056):
            bottom = p+out*.051+Vector((-.029, offset, -.042))
            tube('Speedster trim / lamp fluting', [bottom, bottom+Vector((.058, 0, .084))], m['rim'], .004, 5)
        ellipsoid('Speedster trim / tail lens', (1.905, sign*.60, .615), (.08, .107, .043), m['ink'], 16, 10)
        ellipsoid('Speedster trim / tail lens highlight', (1.959, sign*.60, .624), (.031, .063, .021), m['rim'], 16, 8)
        cylinder('Speedster trim / exhaust tail pipe', (1.66, sign*.45, .305), (2.16, sign*.45, .292), .033, m['rim'], 15)
    for front in (-1, 1):
        bumper = spline([(front*1.93, -.82, .38), (front*2.10, -.57, .36), (front*2.18, 0, .36),
                          (front*2.10, .57, .36), (front*1.93, .82, .38)], 6)
        tube('Speedster trim / chrome bumpers', bumper, m['rim'], .039, 10)
        tube('Speedster trim / bumper ink', [(x+front*.012, y, z-.032) for x, y, z in bumper], m['ink'], .016, 6)
        for y in (-.41, .41):
            box('Speedster trim / bumper guards', (front*2.10, y, .405), (.14, .075, .17), m['rim'], .028)
    # Deck-lid vents and seam; the rear-quarter view exposes both banks.
    for j in range(12):
        x = 1.04+j*.052
        for y in (-.235, .235):
            z = interpolate(SECTIONS, x)[2]+.004
            tube('Speedster trim / louver slots', [(x, y-.129, z), (x, y+.129, z)], m['ink'], .009, 5)
    for x in (-1.90, -1.65, -1.4, -1.15, -.88, -.73):
        z = interpolate(SECTIONS, x)[2]+.009
        tube('Speedster trim / bonnet center crease', [(x-.02, 0, z-.005), (x+.025, 0, z+.004)], m['rim'], .009, 5)


def wheels(m):
    for x in AXLES:
        for sign in (-1, 1):
            z = WHEEL_Z
            shell = [(sign*y, radius) for y, radius in [(.686, .31), (.695, .369), (.73, .397),
                     (.79, .408), (.868, .401), (.909, .385), (.925, .345), (.921, .286), (.882, .259)]]
            verts = [(x+r*math.cos(t), y, z+r*math.sin(t)) for y, r in shell for t in (math.tau*i/32 for i in range(32))]
            faces = []
            for i in range(len(shell)):
                for j in range(32):
                    a, b, k = i*32, (i+1)%len(shell)*32, (j+1)%32
                    face = (a+j, a+k, b+k, b+j)
                    faces.append(face if sign < 0 else face[::-1])
            mesh('Wheels / bevelled rubber', verts, faces, m['rubber'], True)
            cylinder('Wheels / dark wheel well', (x, sign*.65, z), (x, sign*.891, z), .282, m['ink'], 28)
            for radius, offset, mat in [(.286, .924, m['rim']), (.35, .926, m['rubberline']), (.304, .928, m['rubberline'])]:
                path = [(x+radius*math.cos(t), sign*offset, z+radius*math.sin(t)) for t in (math.tau*i/36 for i in range(36))]
                tube('Wheels / rings and sidewall', path, mat, .012 if radius < .30 else .004, 6, True)
            cylinder('Wheels / turned aluminum hub', (x, sign*.901, z), (x, sign*.945, z), .107, m['rim'], 24)
            cylinder('Wheels / hub inset', (x, sign*.947, z), (x, sign*.954, z), .051, m['ink'], 20)
            for j in range(5):
                t = math.tau*j/5
                spoke = [(x+r*math.cos(t+delta), sign*y, z+r*math.sin(t+delta)) for r, delta, y in
                         [(.080, -.40, .941), (.281, -.09, .920), (.277, .12, .920), (.085, .42, .942)]]
                mesh('Wheels / five machined spokes', spoke, [(0, 1, 2, 3) if sign < 0 else (3, 2, 1, 0)], m['rim'])
                cylinder('Wheels / lug nuts', (x+.075*math.cos(t), sign*.944, z+.075*math.sin(t)),
                         (x+.075*math.cos(t), sign*.955, z+.075*math.sin(t)), .013, m['lamp'], 6)
            for j in range(24):
                t = math.tau*j/24
                tube('Wheels / engraved tread', [(x+.402*math.cos(t), sign*.754, z+.402*math.sin(t)),
                     (x+.408*math.cos(t+.044), sign*.806, z+.408*math.sin(t+.044)),
                     (x+.398*math.cos(t+.067), sign*.864, z+.398*math.sin(t+.067))], m['ink'], .004, 5)


def sheet(name, rows, mats, sequence=None):
    """Skin a strip of the coastal plate through two or more cross sections."""
    n = len(rows[0])
    faces = [(n*i+j, n*i+j+1, n*(i+1)+j+1, n*(i+1)+j) for i in range(len(rows)-1) for j in range(n-1)]
    return mesh(name, [p for row in rows for p in row], faces, mats, indices=sequence)


def cloud(x, y, z, scale, m):
    outline = [(-2.65,-.14),(-2.52,.03),(-2.23,.13),(-2.06,.42),(-1.78,.44),(-1.56,.72),(-1.25,.85),
               (-.98,.74),(-.66,1.07),(-.35,1.15),(-.09,1.34),(.24,1.38),(.52,1.11),(.81,1.16),(1.02,.97),
               (1.30,.98),(1.54,.73),(1.76,.73),(2,.47),(2.23,.37),(2.34,.13),(2.64,-.03),
               (2.53,-.17),(1.67,-.24),(.60,-.21),(-.29,-.28),(-1.26,-.22),(-2.10,-.25)]
    path = spline([(x+a*scale,y,z+b*scale) for a,b in [outline[-1],*outline,outline[0],outline[1]]], 3)[3:-4]
    center = Vector((x, y, z+.13*scale))
    n = len(path)
    rings = [(.24,-.49),(.69,-.31),(1,0),(.69,.31),(.24,.49)]
    points = [center.lerp(p, r)+Vector((0, d*scale, 0)) for r,d in rings for p in path]
    faces = [(i*n+j, i*n+(j+1)%n, (i+1)*n+(j+1)%n, (i+1)*n+j) for i in range(len(rings)-1) for j in range(n)]
    faces.extend((tuple(reversed(range(n))), tuple(range(len(points)-n,len(points)))))
    mesh('Clouds / shaped paper thickness', points, faces, m['cloud'], True)
    tube('Clouds / traced silhouettes', [(a,b-.02,c) for a,b,c in path], m['horizon'], .027*scale, 5, True)


def shore(m, rng):
    xs = [-58, *range(-18, 19, 2), 58]
    bend = lambda x: .5*(1-math.cos(x*.15))
    sheet('Ground / near sand', [[(x, -50, -.08) for x in xs], [(x, -2.1+bend(x), -.014) for x in xs]], m['sand'])
    sheet('Road / ivory asphalt', [[(x, -2.1+bend(x), -.011) for x in xs],
                                  [(x, 2.15+bend(x), -.011) for x in xs]], m['road'])
    sheet('Ground / bank towards the tide', [[(x, 2.15+bend(x), -.012) for x in xs], [(x, 4.4+bend(x)*2, -.23) for x in xs]], m['sand'])
    sheet('Water / continuous ocean surface', [[(x, y, -.26) for x in xs] for y in (4.0, 8, 14, 23, 40, 100)], m['sea'])
    for y in (-1.97, 1.95):
        tube('Road / engraved edge', [(x, y+bend(x), .002) for x in range(-20, 21)], m['tread'], .015, 5)
        tube('Road / edge glint', [(x, y+bend(x)+.045, .001) for x in range(-20, 21)], m['foam'], .012, 5)
    for x in (-13, -10, -7, -4, 4, 7, 10, 13):
        tube('Road / broken centerline', [(x, bend(x), -.006), (x+.96, bend(x+.96), -.006)], m['foam'], .020, 5)
    for i in range(41):
        y = 4.39+i**1.22*.47
        for _ in range(3 if i < 15 else 2):
            x = rng.uniform(-26, 18)
            length = rng.uniform(3.1, 15)
            pts = [(x+length*t/10, y+math.sin(t*.57+i)*(.12 if i < 6 else .054), -.250) for t in range(11)]
            tube('Water / cross-hatched swells', pts, m['wave'] if i%3 else m['foam'], rng.uniform(.011, .023), 5)
    for i in range(205):
        x, y = rng.uniform(-14, 14), rng.choice((rng.uniform(-5.9, -2.25), rng.uniform(2.25, 4.0)))
        curve = bend(x)
        z = (-.014-.066*min(1, abs(y+2.1-curve)/47.9) if y < 0 else
             -.012-.218*max(0, (y-2.15)/(2.25+curve)))
        if y > 0:
            y += curve
        length = rng.uniform(.035, .26)
        pts = [(x, y, z+.008), (x+length, y+length*.34, z+.008)]
        tube('Ground / fine paper hatch', pts, m['tread'] if i%4 == 0 else m['grain'], rng.uniform(.003, .008), 5)
    # Shells and layered, light-faced rocks mark the bank and keep a low open horizon.
    for i in range(51):
        x, y = rng.uniform(-13.0, 13.0), rng.uniform(2.3, 3.8)
        z = -.02-.213*(y-2.15)/(2.25+bend(x))
        scale = rng.uniform(.045, .22)
        rock = ellipsoid('Shore rocks / eroded shale', (x, y+bend(x), z+.006), (scale, scale*.58, scale*.40),
                         m['rock'] if i%4 else m['grain'], 11, 6)
        rock.rotation_euler.z = rng.random()*math.pi
    for x, y, z, scale in ((-20,26,2.42,1.20), (-10,24,3.04,1.94), (2.6,28,3.36,1.04), (14.8,24.5,2.57,1.78),
                           (28,30,3.27,1.38), (-32,31,3.52,1.20)):
        cloud(x, y, z, scale, m)
    for j in range(29):
        height = .14+j*.162
        tube('Clouds / etched horizon rules', [(-41,30.4,height),(40,30.4,height)], m['horizon'], .013, 5)


def frond(start, direction, length, drop, rng, m):
    direction = Vector(direction).normalized()
    up = Vector((0, 0, 1))
    side = up.cross(direction).normalized()
    origin = Vector(start)

    def stem(t):
        return origin+direction*(length*t)+side*(math.sin(t*2.1)*length*.10)+up*(.28*length*math.sin(t*math.pi)-drop*t*t)

    pts = [stem(i/20) for i in range(21)]
    tube('Palms / frond stems', pts, m['bark'], tuple(.029*(1-i/22)**.75 for i in range(21)), 6)
    for j in range(14):
        t = .11+.061*j
        for sign in (-1, 1):
            root = stem(t+sign*.012)
            spread = .31*length*math.sin(math.pi*t)**.91*rng.uniform(.73, 1.10)
            tip = root+direction*spread*.49+side*spread*sign-up*spread*rng.uniform(.27, .55)
            middle = root.lerp(tip, .50)+up*spread*.16
            edge = direction*spread*.14
            ridge = middle+up*.018
            verts = [root, root.lerp(middle, .54)-edge*.8, middle-edge, tip, middle+edge, root.lerp(middle, .53)+edge*.8, ridge]
            faces = [(0, 1, 6), (1, 2, 6), (2, 3, 6), (3, 4, 6), (4, 5, 6), (5, 0, 6)]
            mesh('Palms / folded ink leaflets', verts, faces, (m['palm'], m['palm_lit']), indices=[0, 0, 0, 1, 1, 1])
            if length > 2.8:
                tube('Palms / quill veins', [root, ridge, tip], m['grain'], .008, 5)


def palm(root, height, tilt, scale, rng, m):
    p = Vector(root)
    top = p+Vector((tilt[0], tilt[1], height))
    path = spline([p, p.lerp(top, .33)+Vector((-.16, .1, 0)), p.lerp(top, .67)+Vector((-.23, .12, 0)), top], 5)
    tube('Palms / bent trunks', path, m['bark'], tuple(scale*(.20-.095*i/(len(path)-1)) for i in range(len(path))), 13)
    for j in range(max(5, int(height*5.7))):
        a = j/(height*5.7)
        p0 = path[round(a*(len(path)-1))].copy()
        p0.z = p.z+height*a
        ring = .20-.095*a
        pts = [p0+Vector((scale*ring*math.cos(t), scale*ring*math.sin(t), math.sin(t)*.036))
               for t in (math.tau*i/12 for i in range(12))]
        tube('Palms / engraved bark rings', pts, m['palm_lit'], scale*.013, 5, True)
    for j in range(8):
        t = math.tau*j/8+rng.uniform(-.19, .19)
        frond(top, (math.cos(t), math.sin(t), 0), scale*rng.uniform(2.15, 3.9), scale*rng.uniform(.5, 1.1), rng, m)


def still_life(m, with_reader):
    x, y, span, depth = (2.91, -2.68, 1.90, 1.18) if with_reader else (2.24, -2.51, 1.48, .85)
    # Pleated cloth, resting on the verge, with an open paper book and straw hat.
    n = 23
    fold = .005 if with_reader else .018
    vertices = []
    for j in range(8):
        for i in range(n):
            edge = max((abs(2*i/(n-1)-1))**8, (abs(2*j/7-1))**6)
            base = .012-.025*edge if with_reader else .020
            vertices.append((x-span/2+span*i/(n-1), y-depth/2+depth*j/7+.05*math.sin(i*.42+j*.48),
                             base+fold*math.sin(j*1.39)**2+fold*.83*math.cos(i*.48+j*.39)**2))
    faces = [(n*j+i, n*j+i+1, n*(j+1)+i+1, n*(j+1)+i) for j in range(7) for i in range(n-1)]
    mesh('Parking still life / striped cloth', vertices, faces, (m['cloud'], m['grain'], m['rock']), indices=[j%3 for j in range(7) for _ in range(n-1)])
    bx, by = (x+.56, y-.45) if with_reader else (x+.21, y-.07)
    book_base = .039 if with_reader else .057
    for s in (-1, 1):
        rows = []
        for j in range(9):
            width = j*.040
            depth = .214
            z = book_base+.076*math.sin(j/8*math.pi*.85)
            rows.append([(bx+s*width, by-depth+.025*j/8, z), (bx+s*width, by+depth+.025*j/8, z)])
            if j:
                for line in range(3):
                    ly = by-.113+line*.087
                    tube('Parking still life / lines of print', [(bx+s*(width-.029), ly, z-.005), (bx+s*(width-.003), ly, z+.001)], m['grain'], .004, 5)
        sheet('Parking still life / book leaves', rows if s > 0 else rows[::-1], m['cloud'])
        for end in (0, 1):
            for offset in (.006, .016, .027):
                tube('Parking still life / book signatures', [(q[end][0], q[end][1], q[end][2]-offset) for q in rows], m['rock'], .006, 5)
    tube('Parking still life / book spine', [(bx, by-.221, book_base-.003), (bx, by+.225, book_base-.002)], m['ink'], .016, 7)
    if with_reader:
        return
    hx, hy = x-.43, y+.15
    table = [(0, .26), (.13, .25), (.19, .20), (.204, .112), (.32, .096), (.39, .064), (.421, .079)]
    count = 32
    verts = [(hx+r*math.cos(t), hy+r*.75*math.sin(t), z+.045*math.cos(t)*r/.42+.021*math.sin(2*t)*r/.42)
             for r, z in table for t in (math.tau*i/count for i in range(count))]
    faces = [(i*count+j, (i+1)*count+j, (i+1)*count+(j+1)%count, i*count+(j+1)%count) for i in range(len(table)-1) for j in range(count)]
    mesh('Parking still life / woven sunhat', verts, faces, (m['sand'], m['ink']), True, [int(i == 2) for i in range(len(table)-1) for _ in range(count)])
    for r, z in table[3:]:
        tube('Parking still life / straw tracing', [(hx+r*math.cos(t), hy+.75*r*math.sin(t), z+.006+.045*math.cos(t)*r/.42+.021*math.sin(2*t)*r/.42)
               for t in (math.tau*i/32 for i in range(32))], m['grain'], .006, 5, True)


def build(with_reader=False):
    m = {
        'paint': material('Off-white enamel and graphite', '#b8b3a8', .51, .14),
        'ink': material('Dense graphite', '#252525', .70),
        'rim': material('Clean nickel engravings', '#b9b8af', .33, .48),
        'glass': material('Ink-wash glass', '#abb4b2', .27, .07, alpha=.21),
        'lamp': material('Soft white lamps', '#e4dfca', .32),
        'leather': material('Black grained leather', '#302f2d', .88),
        'seat': material('Neutral seat hide', '#77716b', .76),
        'rubber': material('Graphite rubber', '#333331', .88),
        'rubberline': material('Raised sidewall type', '#6b6964'),
        'sand': material('Ivory book stock sand', '#c3b9a5'),
        'road': material('Warm grey ink wash asphalt', '#96938a'),
        'sea': material('Graphite wash sea', '#9c9c95', .64),
        'wave': material('Pencil rules on water', '#68655c'),
        'tread': material('Pencil border and sand ticks', '#5f594e'),
        'foam': material('Paper highlights', '#dbd7c8', .85),
        'grain': material('Fine sepia ink', '#857b69'),
        'rock': material('Shore slate', '#716a61'),
        'cloud': material('Cloud stock', '#dcd7cb', .95, glow=.19),
        'horizon': material('Distant etched rules', '#9a9d96', glow=.5),
        'bark': material('Dry palm trunk', '#514a40'),
        'palm': material('Palm black ink', '#2c2925'),
        'palm_lit': material('Palm grey facets', '#716a5e'),
    }
    rng = random.Random(3562026)
    body(m)
    open_door(m)
    wheels(m)
    fittings(m)
    shore(m, rng)
    palm((-4.2, 2.7, -.03), 4.83, (1.05, .20), 1.04, rng, m)
    palm((6.8, 3.95, -.15), 5.7, (-.59, .55), .83, rng, m)
    palm((9.6, 4.45, -.16), 4.54, (.3, .31), .69, rng, m)
    palm((-5.53, -3.5, -.028), 4.45, (1.42, .83), 1.07, rng, m)
    tube('Palms / rooted young palm', [(4.52, -4.34, -.03), (4.48, -4.28, .27), (4.37, -4.22, .53)], m['bark'], [.085, .064, .045], 9)
    frond((4.37, -4.22, .53), (-1, -.34, 0), 1.97, .48, rng, m)
    frond((4.37, -4.22, .53), (.3, .8, 0), 1.31, .33, rng, m)
    still_life(m, with_reader)
    backdrop('#e2e3e0', .63, '#e7e4dd')
    area('High paper key', (-4, -4.6, 7.3), (0, 0, .4), 2050, '#fffaf0', 5.3)
    area('Reflected sea light', (1.2, 5, 4.75), (0, 0, .7), 1060, '#e1e9eb', 7)
