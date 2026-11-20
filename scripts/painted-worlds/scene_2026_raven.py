"""An original sculpture study in indigo, lit by a suspended cyan blade."""

import math
import random

from mathutils import Vector

from painted_worlds_2026 import area, backdrop, bloom, box, cylinder, ellipsoid, material, mesh, spline, tube


VIEWS = [
    dict(label='電青斜刃', description='從正面看低處刃尖斜接右上護環，深藍髮束沿雕像兩側翻起，方形光點落在暗處。',
         position=(2.35, -8.65, 2.82), target=(.04, -.01, 1.98), fov=33, mobileFov=47),
    dict(label='從光刃側看', description='橫移看刃的厚度、近側圓形機件，以及髮束與後方暗艙之間的距離。',
         position=(-5.65, -6.23, 3.15), target=(.02, .02, 1.95), fov=35, mobileFov=49),
]
CHECKS = [((6.38, -.78, 2.8), (0, .03, 1.90), 40), ((-4.22, 5.7, 3.44), (-.05, .12, 1.91), 38)]
TRIPO_VIEWS = [
    dict(label='電青斜刃', description='從正面看斜向青光跨過人物，深藍髮束和衣帶在暗艙中往外延伸。',
         position=(1.15, -7.9, 2.35), target=(.02, 0, 1.77), fov=32, mobileFov=49),
    dict(label='從光刃側看', description='橫移看髮束、手與青光的間距，腳下深色基座托住整尊雕塑。',
         position=(5.04, -6.25, 2.62), target=(.03, .02, 1.68), fov=36, mobileFov=52),
]
TRIPO_CHECKS = [
    ((0, -6.3, 2.11), (0, 0, 1.67), 39),
    ((3.60, -5.15, 2.30), (0, 0, 1.67), 39),
    ((6.20, -.35, 2.37), (0, 0, 1.67), 39),
    ((0, 4.28, 2.36), (0, 0, 1.67), 46),
    ((-3.72, -5.00, 2.31), (0, 0, 1.67), 39),
    ((1.35,-2.63,3.14), (.12,.34,2.93), 26),
    ((1.42,-2.34,.69), (0,0,.43), 29),
]
PEDESTAL_TOP = .178
LOOK = dict(sky='#05080e', fog=dict(color='#05080e', near=10, far=17), key='#badceb', fill='#85c0e5',
            ground='#1c3049', keyIntensity=1.50, fillIntensity=1.70, skyIntensity=1.10)


def taper(name, controls, widths, thicknesses, mats, steps=6, sides=12, ribbon=False, twist=0):
    """Loft a closed elliptical section along a curved strand, garment, or limb."""
    centers = spline(controls, steps)
    radii = spline([(w, d, 0) for w, d in zip(widths, thicknesses, strict=True)], steps)
    verts, faces, colors = [], [], []
    for i, center in enumerate(centers):
        direction = (centers[min(i+1, len(centers)-1)]-centers[max(0, i-1)]).normalized()
        axis = Vector((0, -1, 0))
        if abs(direction.dot(axis)) > .97:
            axis = Vector((1, 0, 0))
        front = (axis-direction*direction.dot(axis)).normalized()
        side = front.cross(direction).normalized()
        roll = twist*math.sin(math.pi*i/(len(centers)-1))
        u = side*math.cos(roll)+front*math.sin(roll)
        v = front*math.cos(roll)-side*math.sin(roll)
        w, d, _ = radii[i]
        for j in range(sides):
            angle = math.tau*j/sides
            verts.append(center+u*(max(.001, w)*math.cos(angle))+v*(max(.001, d)*math.sin(angle)))
    for i in range(len(centers)-1):
        for j in range(sides):
            a, b, k = i*sides, (i+1)*sides, (j+1)%sides
            faces.append((a+j, a+k, b+k, b+j))
            colors.append(1 if ribbon and j in (1, 2) else 2 if ribbon and j == sides-2 else 0)
    faces.extend((tuple(reversed(range(sides))), tuple(range(len(verts)-sides, len(verts)))))
    return mesh(name, verts, faces, mats, True, colors+[0, 0])


HEAD_X = -.56
FACE_RINGS = [
    (2.78, .001, .07, .05, .025), (2.80, .077, .174, .105, .019),
    (2.86, .145, .192, .142, .010), (2.94, .182, .210, .180, 0),
    (3.035, .214, .217, .206, -.005), (3.12, .210, .197, .213, -.008),
    (3.20, .209, .200, .213, -.012), (3.29, .194, .179, .202, -.017),
    (3.37, .143, .136, .172, -.015), (3.416, .07, .081, .096, -.011), (3.428, .001, .027, .038, -.008),
]


def face(m):
    points = []
    head_sections = spline([p[:3] for p in FACE_RINGS], 3)
    back_sections = spline([(r[3], r[4], 0) for r in FACE_RINGS], 3)
    count = 40
    for (z, width, f), (b, dx, _) in zip(head_sections, back_sections, strict=True):
        for j in range(count):
            t = math.tau*j/count
            x, y = math.sin(t), math.cos(t)
            points.append((HEAD_X+dx+width*x, .01-y*(f if y >= 0 else b), z))
    faces = [(i*count+j, i*count+(j+1)%count, (i+1)*count+(j+1)%count, (i+1)*count+j)
             for i in range(len(head_sections)-1) for j in range(count)]
    faces += [tuple(reversed(range(count))), tuple(range(len(points)-count, len(points)))]
    mesh('Portrait / shaped porcelain face', points, faces, m['skin'], True)
    for sign in (-1, 1):
        ellipsoid('Portrait / ear', (HEAD_X+sign*.201, .011, 3.044), (.036, .062, .089), m['skin'], 20, 12)
        eye = [(HEAD_X+sign*x, y, z) for x, y, z in ((.034,-.195,3.107),(.067,-.214,3.137),(.106,-.206,3.139),(.148,-.175,3.112),
                                                    (.119,-.189,3.091),(.078,-.205,3.089))]
        mid = Vector((HEAD_X+sign*.087, -.219, 3.111))
        verts = [mid]+spline(eye+[eye[0]], 4)[:-1]
        mesh('Portrait / almond silver eye', verts, [(0, i+1, (i+1)%(len(verts)-1)+1) for i in range(len(verts)-1)], m['eye'])
        ellipsoid('Portrait / slate iris', (HEAD_X+sign*.085, -.218, 3.113), (.027, .011, .028), m['iris'], 16, 10)
        ellipsoid('Portrait / pupil', (HEAD_X+sign*.083, -.226, 3.112), (.012, .006, .017), m['lacquer'], 14, 9)
        ellipsoid('Portrait / glint', (HEAD_X+sign*.085-.006, -.231, 3.121), (.0040, .003, .0040), m['eye'], 10, 7)
        tube('Portrait / upper lid', spline(eye[:4], 4), m['lacquer'], (.0055,)*12+(.0018,), 6)
        tube('Portrait / lower lid', spline([eye[3], *eye[4:], eye[0]], 3), m['skinshade'], .0035, 5)
        brow = [(HEAD_X+sign*x, y, z) for x, y, z in ((.037,-.196,3.183),(.081,-.200,3.195),(.128,-.177,3.188),(.155,-.152,3.167))]
        tube('Portrait / ink eyebrow', spline(brow, 4), m['hair_shadow'], tuple(.008-i*.00048 for i in range(13)), 6)
    taper('Portrait / nose bridge and tip', [(HEAD_X-.003,-.181,3.169),(HEAD_X-.004,-.209,3.091),(HEAD_X-.006,-.229,3.037),
          (HEAD_X-.006,-.236,3.019),(HEAD_X-.005,-.216,3.006)], [.016,.023,.031,.027,.010], [.009,.015,.028,.019,.006], m['skin'], 4)
    mouth = [(HEAD_X-.056,-.184,2.962),(HEAD_X-.026,-.200,2.951),(HEAD_X+.006,-.205,2.949),
             (HEAD_X+.036,-.196,2.956),(HEAD_X+.052,-.184,2.966)]
    tube('Portrait / lip seam', spline(mouth, 3), m['skinshade'], tuple(.0042+.002*math.sin(i*math.pi/12) for i in range(13)), 6)
    tube('Portrait / lower lip light', spline([(-.602,-.192,2.949),(-.553,-.202,2.938),(-.520,-.190,2.951)], 4), m['lips'], .0065, 6)
    taper('Portrait / collar into neck', [(-.48,.043,2.56),(-.54,.026,2.72),(-.55,.021,2.85)],
          [.142,.119,.106], [.117,.099,.086], m['skin'])


def hair(m):
    count, height = 32, 12
    verts = []
    for i in range(height+1):
        for j in range(count):
            theta = math.tau*j/count
            extent = 1.28+.86*min(1, (1-math.cos(theta))*.83)
            phi = .025+(extent-.025)*i/height
            verts.append((HEAD_X-.016+.242*math.sin(phi)*math.sin(theta), .04-.254*math.sin(phi)*math.cos(theta), 3.138+.323*math.cos(phi)))
    faces = [(i*count+j, (i+1)*count+j, (i+1)*count+(j+1)%count, i*count+(j+1)%count) for i in range(height) for j in range(count)]
    mesh('Hair crown / deep indigo roots', verts, faces, m['hair'], True)
    h = (m['hair'], m['hair_mid'], m['hair_shadow'])
    locks = [
        ([(-.72,.085,3.37),(-.92,.07,3.00),(-1.15,.14,2.52),(-1.52,.18,2.02),(-1.45,.34,1.54),(-1.08,.62,1.54),(-.83,.77,1.80)], [.145,.165,.187,.210,.155,.109,.003], [.066,.065,.068,.055,.040,.028,.002], .32),
        ([(-.72,.194,3.37),(-.85,.245,2.87),(-.87,.40,2.39),(-.86,.74,1.86),(-1.01,1.09,1.30),(-1.45,.84,.95),(-1.67,.47,1.22)], [.153,.212,.266,.28,.181,.104,.004], [.071,.086,.076,.065,.048,.025,.002], -.55),
        ([(-.48,.17,3.36),(-.29,.24,2.89),(-.08,.51,2.48),(.29,.66,2.20),(.89,.90,1.91),(1.04,1.10,1.39),(.66,.87,1.16),(.22,.77,1.33)], [.115,.162,.283,.29,.22,.157,.090,.004], [.066,.080,.072,.075,.070,.052,.032,.002], .7),
        ([(-.42,.135,3.36),(-.29,.257,2.95),(.04,.34,2.68),(.51,.44,2.56),(1.06,.55,2.32),(1.45,.63,1.99),(1.50,.59,1.69),(1.31,.35,1.51)], [.10,.17,.21,.20,.198,.181,.111,.003], [.06,.056,.066,.059,.070,.045,.031,.002], -.32),
        ([(-.46,.253,3.30),(-.55,.33,2.82),(-.52,.62,2.38),(-.30,.95,1.93),(.16,1.12,1.27),(.78,.99,.83),(1.33,.57,.88),(1.44,.28,1.18)], [.14,.28,.30,.31,.28,.223,.139,.004], [.087,.090,.071,.069,.055,.057,.039,.002], -.58),
        ([(-.39,.146,3.34),(-.24,.18,2.98),(.13,.29,2.79),(.68,.42,2.71),(1.29,.65,2.65),(1.77,.78,2.46),(1.97,.67,2.16)], [.082,.099,.102,.112,.105,.079,.004], [.043,.042,.037,.036,.045,.029,.002], .39),
        ([(-.77,-.036,3.30),(-.83,-.150,3.06),(-.87,-.10,2.79),(-.86,-.12,2.49),(-.66,-.34,2.23),(-.33,-.38,2.16),(-.18,-.31,2.25)], [.094,.086,.105,.11,.109,.082,.003], [.044,.041,.056,.041,.035,.024,.002], .23),
        ([(-.83,.071,3.2),(-.97,.026,2.87),(-1.10,-.08,2.60),(-1.27,-.25,2.26),(-1.56,-.29,2.03),(-1.69,-.19,1.77),(-1.58,-.08,1.51)], [.058,.105,.148,.16,.127,.080,.003], [.04,.05,.048,.043,.042,.027,.002], -.38),
    ]
    for i, (points, widths, thickness, twist) in enumerate(locks):
        taper(f'Hair ribbons / windblown lock {i+1}', points, widths, thickness, h, 7, 12, True, twist)
        for offset, width in ((-.045, .0075), (.035, .0048)):
            path = [Vector((x+offset, y-d*.93, z)) for (x, y, z), d in zip(points, thickness)]
            line = spline(path, 5)[2:-5]
            tube('Hair ribbons / blue strand marks', line, m['hair_line'] if i%2 else m['hair_mid'],
                 tuple(width*(.2+.8*math.sin(j*math.pi/(len(line)-1))) for j in range(len(line))), 5)
    bangs = [
        ([(-.56,-.126,3.420),(-.68,-.218,3.376),(-.714,-.233,3.280),(-.730,-.217,3.196),(-.756,-.193,3.119)], [.071,.102,.093,.055,.003]),
        ([(-.575,-.096,3.421),(-.589,-.209,3.389),(-.603,-.235,3.315),(-.630,-.230,3.237),(-.676,-.212,3.190)], [.072,.081,.067,.048,.003]),
        ([(-.526,-.123,3.417),(-.458,-.227,3.374),(-.411,-.232,3.294),(-.377,-.213,3.257),(-.354,-.174,3.203)], [.072,.106,.096,.077,.002]),
        ([(-.552,-.155,3.414),(-.563,-.221,3.367),(-.548,-.232,3.287),(-.562,-.223,3.225)], [.052,.065,.047,.003]),
        ([(-.67,-.115,3.402),(-.758,-.207,3.335),(-.797,-.210,3.244),(-.811,-.168,3.131),(-.804,-.115,3.047)], [.067,.071,.045,.025,.003]),
    ]
    for i, (path, widths) in enumerate(bangs):
        taper(f'Hair crown / curled fringe {i+1}', path, widths, [w*.41 for w in widths], h, 6, 12, True, (-1)**i*.17)


def mechanical_ring(name, center, normal, radius, m, active=True):
    p, n = Vector(center), Vector(normal).normalized()
    across = n.cross(Vector((0, 0, 1))).normalized()
    up = across.cross(n)
    cylinder(name+' / black actuator', p-n*.047, p+n*.042, radius, m['metal'], 32)
    for index, (r, d) in enumerate(((1.0, .048), (.80, .056), (.47, .062))):
        circle = [p+n*d+radius*r*(across*math.cos(t)+up*math.sin(t)) for t in (math.tau*j/32 for j in range(32))]
        tube(name+' / turned races', circle, m['cyan_edge'] if index == 1 and active else m['titanium'], .009 if index else .016, 6, True)
    cylinder(name+' / recessed lamp', p+n*.044, p+n*.053, radius*.38, m['small_glow'] if active else m['titanium'], 20)
    for j in range(8):
        t = math.tau*j/8
        spot = p+radius*.91*(across*math.cos(t)+up*math.sin(t))
        cylinder(name+' / socket fasteners', spot+n*.02, spot+n*.054, radius*.054, m['titanium'], 6)


def figure(m):
    taper('Figure / tapered lacquer torso', [(-.24,.02,1.20),(-.24,.06,1.51),(-.32,.062,1.86),(-.39,.028,2.13),(-.47,.067,2.43),(-.47,.062,2.59),(-.48,.037,2.68)],
          [.089,.252,.195,.207,.310,.238,.112], [.095,.17,.15,.155,.19,.158,.092], m['suit'], 6, 24)
    taper('Figure / inset silver chest shell', [(-.48,-.056,2.62),(-.44,-.119,2.41),(-.42,-.133,2.25),(-.35,-.106,2.06),(-.23,-.105,1.91)],
          [.095,.194,.187,.096,.024], [.04,.088,.093,.079,.023], m['plate'], 5, 18)
    for side in (-1, 1):
        line = [(-.45+side*.17,-.133,2.49),(-.39+side*.16,-.183,2.25),(-.30+side*.10,-.136,2.02),(-.23+side*.16,-.079,1.77)]
        tube('Figure / titanium seam', spline(line, 5), m['titanium'], .009, 6)
    path = [(-.731,.027,2.58),(-.59,-.114,2.68),(-.455,-.142,2.63),(-.308,-.106,2.56),(-.228,.04,2.53)]
    taper('Figure / overlapping collar ridge', path, [.022,.048,.040,.034,.003], [.027,.034,.024,.025,.003], m['metal'])
    taper('Arms / blade arm sleeve', [(-.270,.07,2.52),(-.12,.025,2.59),(.25,-.10,2.63),(.61,-.26,2.71),(1.002,-.36,2.79)],
          [.121,.135,.082,.095,.057], [.12,.101,.076,.080,.052], m['suit'], 6, 16)
    taper('Arms / pale forearm plate', [(.34,-.193,2.644),(.56,-.343,2.70),(.76,-.364,2.75),(.99,-.405,2.79)],
          [.040,.065,.061,.026], [.025,.022,.026,.013], m['plate'], 6, 12)
    tube('Arms / blade-arm wire', spline([(.02,-.072,2.66),(.33,-.185,2.70),(.65,-.35,2.77),(.97,-.39,2.82)], 5), m['titanium'], .009, 6)
    mechanical_ring('Arms / shoulder sensor', (-.23,-.110,2.56), (.21,-.97,.08), .149, m)
    taper('Arms / lifted sleeve', [(-.69,.063,2.51),(-.847,-.026,2.50),(-.926,-.08,2.61),(-.858,-.165,2.82),(-.713,-.264,3.049)],
          [.098,.111,.089,.079,.046], [.080,.089,.076,.064,.038], m['suit'], 6, 16)
    taper('Arms / raised wrist', [(-.75,-.255,3.002),(-.704,-.260,3.072),(-.678,-.260,3.116)],
          [.056,.064,.045],[.037,.034,.026], m['skin'], 5)
    for j in range(4):
        x = -.741+j*.023
        ys = -.266+.004*j
        z = 3.145 + (1-abs(j-1.5)/2)*.056
        taper('Arms / raised fingers', [(x+.047,ys,3.084),(x+.025,ys-.013,3.117),(x,ys+.001,z)],
              [.015,.014,.005],[.015,.010,.005], m['skin'], 4, 8)
    taper('Arms / thumb at temple', [(-.667,-.274,3.092),(-.627,-.292,3.111),(-.608,-.269,3.145)], [.020,.015,.006],[.015,.011,.006], m['skin'], 4, 8)
    taper('Arms / hilt grip palm', [(1.00,-.361,2.77),(1.075,-.399,2.80),(1.128,-.401,2.816)],
          [.059,.073,.043],[.043,.050,.031], m['skin'], 4, 14)
    for j in range(4):
        x, z = 1.071+j*.020, 2.761+j*.038
        tube('Arms / fingers around hilt', spline([(x,-.443,z+.032),(x+.074,-.446,z+.019),(x+.075,-.393,z)], 4), m['skin'], [.018]*5+[.016,.014,.012,.009], 7)
    # Uneven leg heights carry the same suspended weight as the curved cloth volumes.
    for index, (path, widths, depth) in enumerate([
        ([(-.135,.069,1.67),(.19,-.018,1.38),(.35,-.071,1.03),(.23,-.21,.77),(.092,-.30,.47),(.023,-.267,.28)],
         [.146,.157,.124,.104,.072,.059], [.144,.133,.105,.094,.065,.05]),
        ([(-.34,.051,1.63),(-.349,.18,1.31),(-.258,.214,1.02),(-.109,.200,.77),(.07,.16,.47),(.24,.09,.34)],
         [.141,.139,.104,.093,.066,.058], [.145,.144,.105,.09,.061,.046]),
    ]):
        taper('Figure / folded trouser leg', path, widths, depth, m['suit'], 7, 16)
        insert = [(x, y-d*.84, z) for (x, y, z), d in zip(path, depth)]
        taper('Figure / porcelain leg plate', insert, [w*.71 for w in widths], [d*.28 for d in depth], m['plate'] if index == 0 else m['blueplate'], 7, 16)
        for delta in (-.043, .042):
            center = [(x+delta, y-d*1.08, z) for (x, y, z), d in zip(path[1:5], depth[1:5])]
            tube('Figure / silver trouser seams', spline(center, 6), m['titanium'], .008, 5)
        x, y, z = path[-1]
        taper('Figure / fitted boot', [(x,y,z+.12),(x-.014,y-.022,z),(x-.083,y-.078,z-.094),(x-.098,y-.205,z-.141)],
              [.066,.079,.103,.055],[.058,.068,.061,.035], m['metal'], 5, 14)
        tube('Figure / boot sole inlay', spline([(x-.13,y-.18,z-.142),(x-.064,y-.2,z-.129),(x+.052,y-.10,z-.082),(x+.055,y,z-.022)], 4), m['titanium'], .013, 6)
    fabric = (m['suit'], m['hair_mid'], m['hair_shadow'])
    for path, widths, depths in [
        ([(-.43,.01,1.83),(-.52,-.02,1.66),(-.52,-.04,1.32),(-.71,.11,1.00),(-1.10,.23,.72),(-1.22,.38,.62)], [.14,.176,.194,.159,.116,.004], [.055,.052,.039,.037,.034,.005]),
        ([(-.125,.08,1.78),(.049,.22,1.58),(.224,.43,1.35),(.64,.50,1.10),(1.04,.37,.89),(1.22,.16,.90)], [.15,.155,.19,.20,.121,.003], [.044,.04,.036,.045,.030,.004]),
    ]:
        taper('Figure / open coat tails', path, widths, depths, fabric, 7, 14, True, .65)


def sword(m):
    root = Vector((1.025, -.481, 2.681))
    point = Vector((-.932, -.816, .276))
    forward = (root-point).normalized()
    front = (Vector((0,-1,0))-forward*forward.dot(Vector((0,-1,0)))).normalized()
    edge = front.cross(forward).normalized()
    length = (root-point).length

    def coord(t, w=0, d=0):
        return point+forward*(t*length)+edge*w+front*d

    shape = [(0,.002,.001),(.07,.109,.020),(.16,.140,.032),(.71,.154,.048),(.89,.218,.051),(.968,.149,.054),(1,.092,.036)]
    sections = [(-1,0),(-.68,.69),(-.31,1),(.31,1),(.68,.69),(1,0),(.68,-.69),(.31,-1),(-.31,-1),(-.68,-.69)]
    n = len(sections)
    verts = [coord(t, x*w, y*d) for t, w, d in shape for x, y in sections]
    polys = [(i*n+j, i*n+(j+1)%n, (i+1)*n+(j+1)%n, (i+1)*n+j) for i in range(len(shape)-1) for j in range(n)]
    polys += [tuple(reversed(range(n))), tuple(range(len(verts)-n, len(verts)))]
    glass = [1 if j in (0, 4, 5, 9) else 2 if j in (2, 7) else 0 for j in range(n)]
    mesh('Blade / faceted chromatic steel', verts, polys, (m['blade_blue'], m['cyan_edge'], m['blade_dark']), indices=glass*(len(shape)-1)+[1, 0])
    for sign in (-1, 1):
        for side in (-1, 1):
            points = [coord(t, w*.68*sign, d*.70*side) for t,w,d in shape]
            tube('Blade / white-hot cutting lines', points, m['blade_core'], [.002,.009,.012,.014,.015,.013,.010], 7)
        tube('Blade / double fuller lines', [coord(t, w*.20*sign, d*1.13) for t,w,d in shape[1:]], m['cyan_edge'], .007, 6)
    cylinder('Hilt / shadow core', coord(.965), coord(1.176), .071, m['lacquer'], 24)
    cylinder('Hilt / lower collar', coord(.997), coord(1.030), .091, m['titanium'], 24)
    cylinder('Hilt / silver pommel', coord(1.168), coord(1.192), .084, m['titanium'], 24)
    for j in range(8):
        t = 1.033+j*.016
        cylinder('Hilt / winding grip', coord(t), coord(t+.006), .074, m['metal'], 18)
    quillon = [coord(.967,.13,-.015),coord(1.014,.292,-.025),coord(1.081,.302,-.035),coord(1.164,.226,-.042),coord(1.185,.07,-.04)]
    taper('Hilt / swept open knuckle guard', quillon, [.025,.076,.058,.034,.022], [.036,.045,.047,.037,.025], m['titanium'], 7)
    tube('Hilt / guard side light', spline([p+front*.037 for p in quillon], 6), m['cyan_edge'], .007, 6)
    tube('Hilt / inner support', [coord(.99,.137,.027),coord(1.031,.211,.027),coord(1.097,.211,.027),coord(1.155,.11,.027)], m['metal'], .018, 7)
    mechanical_ring('Hilt / floating blade coupler', coord(.98, 0, .059), front, .104, m)


def chamber(m):
    # Thin offset bays keep the depth cues visible when the viewer moves across the scene.
    box('Chamber floor / continuous graphite', (0, 1, -.052), (125, 125, .1), m['floor'])
    for j in range(7):
        x = -3.4+j*1.15
        p = [(x, 4.7+abs(j-3)*.17,-.04),(x,4.7+abs(j-3)*.17,3.55),(x*.83,4.22,4.7)]
        tube('Chamber / receding dark ribs', p, m['wall'], .036, 6)
        tube('Chamber / thin faded blue seams', [(a,b-.04,c) for a,b,c in p], m['distance'], .006, 5)
    for j in range(5):
        y = .76+j*.76
        tube('Chamber floor / scored deck', [(-5.4,y,.002),(5.4,y,.002)], m['wall'], .008, 5)
    # Segmented circle on the floor catches cyan as a shallow reflection cue.
    for start, stop, r in ((-.4,1.5,1.48),(1.88,3.22,1.48),(3.56,5.60,1.48),(.76,2.98,1.65),(3.21,4.89,1.65)):
        path = [(r*math.cos(t),.04+r*.81*math.sin(t),.011) for t in (start+(stop-start)*j/32 for j in range(33))]
        tube('Chamber floor / scoring arcs', path, m['distance'], .011, 6)
    # An open, offset machine in the midground keeps the blade distinct from the wall.
    for start, stop, r, depth in ((.28,1.78,1.79,2.10),(2.03,3.91,1.79,2.10),(4.09,5.74,1.79,2.10),(-.18,1.00,1.55,2.28),(1.66,2.97,1.55,2.28)):
        path = [(.22+r*math.cos(t),depth+.13*math.cos(t),1.94+r*math.sin(t)) for t in (start+(stop-start)*j/32 for j in range(33))]
        tube('Chamber / interrupted resonance ring', path, m['wall'], .029, 8)
        tube('Chamber / unlit ring inlays', [(x,y-.025,z) for x,y,z in path], m['distance'], .007, 5)
    rng = random.Random(22032026)
    positions = [(-1.49,-.92,1.41,.114),(-1.71,-.44,1.22,.074),(.99,-.69,.89,.078),(1.79,-.15,2.29,.109),
                 (1.52,.69,1.13,.093),(-1.31,.65,2.67,.082),(.73,.99,2.09,.078),(.30,-1.18,.24,.053),
                 (1.92,1.74,1.86,.073),(-1.91,1.46,.76,.089),(-.167,1.66,3.39,.058),(1.19,-1.20,3.20,.050)]
    for j, (x, y, z, size) in enumerate(positions):
        rot = (rng.uniform(-.38,.42),rng.uniform(-.55,.36),rng.uniform(-.43,.39))
        base = box('Drifting squares / dark housings', (x,y,z), (size*1.47,size*.90,size*1.47), m['metal'], .007)
        base.rotation_euler = rot
        face = box('Drifting squares / cyan faces', (x,y-size*.51,z), (size,size*.34,size), m['small_glow'], .004)
        face.rotation_euler = rot
        if j % 3 == 0:
            box('Drifting squares / companions', (x+.10,y+.12,z-.081), (size*.33,)*3, m['cyan_edge'], .003).rotation_euler = rot
    for j in range(29):
        x, y, z = rng.uniform(-2.8,2.8), rng.uniform(-1.03,3.7), rng.uniform(.24,4.05)
        size = rng.uniform(.013,.032)
        box('Drifting squares / distant dust', (x,y,z), (size,)*3, m['distance'] if j%3 else m['cyan_edge']).rotation_euler = (.4,.7,.3)


def pedestal(m):
    """Low, solid slate and a recessed blue line below the contact surface."""
    for name, low, high, radius, upper, surface in (
        ('stone lower edge', .002, .048, .78, .83, m['wall']),
        ('solid slate body', .048, .143, .83, .83, m['suit']),
        ('recessed cold metal seam', .143, .155, .82, .82, m['metal']),
        ('open bevel top', .155, PEDESTAL_TOP, .83, .787, m['wall']),
    ):
        o = cylinder('Pedestal floor / '+name, (0,0,low), (0,0,high), radius, surface, 64, top=upper)
        o.scale.y = .83
    for start, stop in ((.28,1.35),(2.28,3.18),(4.52,5.88)):
        angles = [start+(stop-start)*i/24 for i in range(25)]
        tube('Pedestal floor / shallow blue inlay', [(.763*math.cos(t),.633*math.sin(t),PEDESTAL_TOP+.002) for t in angles],
             m['distance'], .006, 6)


def build(tripo=None):
    m = {
        'skin': material('Pale bisque', '#c8c1bc', .55, glow=.026),
        'skinshade': material('Pressed porcelain shadow', '#5c5363', .69),
        'lips': material('Soft cool bisque', '#a69aa2', .63),
        'eye': material('Ground silver', '#dedfe7', .36, glow=.17),
        'iris': material('Storm blue iris', '#526987', .35, glow=.05),
        'hair': material('Ink blue hair', '#092b47', .43, .34, .13),
        'hair_mid': material('Brushed indigo', '#15466b', .40, .30, .14),
        'hair_shadow': material('Midnight indigo', '#081a33', .49, .28, .10),
        'hair_line': material('Fine reflected blue', '#2e719d', .37, .30, .16),
        'suit': material('Black satin with indigo undertone', '#0c1928', .56, .16, .13),
        'plate': material('Frosted alloy', '#7c929e', .51, .28, .08),
        'blueplate': material('Blacked alloy on reverse', '#25374d', .57, .32, .13),
        'lacquer': material('Near-black ceramic', '#080d18', .41, .25),
        'metal': material('Milled gunmetal', '#142d41', .42, .52, .16),
        'titanium': material('Burred silver edges', '#556d7b', .36, .45, .16),
        'cyan_edge': material('Electric cyan facets', '#05b5e8', .31, .22, 1.70),
        'blade_blue': material('Blue blade interior', '#2684aa', .38, .32, .68),
        'blade_dark': material('Fuller recess', '#24627f', .47, .34, .38),
        'blade_core': material('White cyan edge', '#71e4ff', .32, .06, 3.4),
        'small_glow': material('Suspended cyan square', '#52dfeb', .40, .05, 2.0),
        'floor': material('Unlit black deck', '#04070b', .42, .28, .045),
        'wall': material('Black blue machined ribs', '#0d1925', .65, .19, .20),
        'distance': material('Faint depth lines', '#1a364a', .58, .15, .26),
    }
    chamber(m)
    if tripo is None:
        figure(m)
        face(m)
        hair(m)
        sword(m)
    else:
        pedestal(m)
        tripo()
    backdrop('#8bb4d0', .20, '#04060a', reflection_hue='#04060a')
    if tripo:
        area('Quiet porcelain key', (.83,-3.82,4.53), (.05,.35,2.92), 215, '#f1e5dd', 2.9)
        area('Cold reflection from the blade', (.73,-1.72,1.97), (-.04,.18,1.55), 75, '#47c5f1', 2.0)
        area('Raking pedestal bounce', (-1.43,-.89,.79), (0,.12,.64), 32, '#68b2de', 1.9)
    else:
        area('Quiet portrait key', (-2.4,-4.0,5.5), (-.52,.03,2.75), 315, '#eff0fa', 3.35)
        area('Blade bounce above the core', (.70,-1.52,2.18), (-.22,.04,1.79), 160, '#39d8ff', 2.05)
        area('Icy low bounce', (-1.05,-.69,.48), (-.07,.10,1.40), 56, '#2aa9ea', 1.7)
    area('Tint on back hair only', (2.25,2.16,3.57), (-.11,.25,2.03), 83, '#c886ce', 2.8)
    area('Cool separations behind the jacket', (-2.5,1.34,3.65), (-.20,.10,2.02), 170, '#5cb9f2', 2.8)
    bloom()
