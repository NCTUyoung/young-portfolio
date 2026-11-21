"""Original geometry and offline lighting for the five 2024 rooms. Z is up."""

from math import cos, hypot, pi, sin, tau

import bpy
import numpy as np
from mathutils import Euler, Vector


def moving_paper(studio, ink):
    # Raster only the ink. The moving paper surface is curved, UV mapped and thickened.
    pixels = np.full((256, 192, 4), (.83, .80, .72, 1), dtype=np.float32)
    rng = studio.rng
    pixels[224:230, 11:125, :3] = (.17, .24, .23)
    pixels[217:220, 12:111, :3] = .42
    pixels[210:211, 11:182, :3] = .34
    pixels[150:201, 14:81, :3] = (.33, .46, .43)
    for y in range(150, 201):
        crest = max(0, int(18 - abs(y - 176) * .7))
        pixels[y, 20:25+crest, :3] = (.52, .59, .49)
        pixels[y, 43:46+int(crest*.8), :3] = (.22, .35, .32)
    for x in (13, 72, 129):
        for y in range(35, 199, 4):
            if x < 100 and y > 147:
                continue
            cursor = x
            for _ in range(8):
                length = rng.randrange(2, 7)
                pixels[y:y+2, cursor:cursor+length, :3] = rng.uniform(.30, .59)
                cursor += length + 2
                if cursor > x + 44:
                    break
    pixels[98:102, 75:123, :3] = (.69, .60, .34)
    pixels[22:23, 11:182, :3] = .36
    img = bpy.data.images.new("Original abstract newsprint", width=192, height=256, alpha=False)
    img.pixels.foreach_set(pixels.ravel())
    img.pack()
    texture = ink.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = img
    ink.node_tree.links.new(texture.outputs["Color"], ink.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])


def paper(studio, name, center, size, bend, rotation, material, *, twist=.19):
    width, height = size
    columns, rows = 6, 9
    uv = [(i / columns, j / rows) for j in range(rows + 1) for i in range(columns + 1)]
    vertices = [((x-.5)*width, (y-.5)*height, bend*((2*y-1)**2-.35) + twist*width*(x-.5)*(y-.5))
                for x, y in uv]
    faces = [(k, k+1, k+columns+2, k+columns+1) for k, (_, y) in enumerate(uv)
             if k % (columns+1) < columns and y < 1]
    obj = studio.mesh(name, vertices, faces, material, smooth=True)
    obj.location, obj.rotation_euler = center, rotation
    layer = obj.data.uv_layers.new()
    for loop in obj.data.loops:
        layer.data[loop.index].uv = uv[loop.vertex_index]
    solid = obj.modifiers.new("Paper edge", "SOLIDIFY")
    solid.thickness = .0025


def print_room(s):
    m = s.material
    box = s.box
    tile = [m("Cool gray terrazzo", c, rough=.32, coat=.18) for c in ("#8b9b9d", "#9aaba9", "#a6aeaa", "#829494")]
    grout = m("Tile grout", "#384f52")
    plaster = m("Pale gray plaster", "#aab7b6")
    moss = m("Window joinery", "#526765", rough=.37)
    frosted = m("Cool paper-white lower window", "#e2f3ee", glow=.88, rough=.36)
    frost_dark = m("Bright north light in the upper panes", "#f4f7f0", glow=1.11, rough=.41)
    navy = m("Copier indigo enamel", "#304b6c", rough=.29, coat=.35)
    slate = m("Copier graphite plastic", "#1f2e3c", rough=.46)
    rim = m("Indented seam and rollers", "#111d26", rough=.35)
    trim = m("Scanner blue gray", "#58748b", rough=.26, coat=.3)
    button = m("Porcelain keys", "#bcc4bb", rough=.42)
    screen = m("Aqua status display", "#5cbfb1", rough=.2, glow=.38)
    amber = m("Amber key", "#da9776", rough=.29)
    cream = m("Ivory rag paper", "#f4f3ec", rough=.81, glow=.08)
    ink = m("Printed paper", "#dcdcc8", rough=.86)
    moving_paper(s, ink)
    rust = m("Worn oxblood folio", "#843b48", rough=.60, glow=.10)
    spine = m("Dark bookcloth spine", "#632c3a", rough=.73, glow=.06)
    stitching = m("Muted warm folio seam", "#ab6470", rough=.66)
    stone = m("Planter pottery", "#708981", rough=.69)
    leaf = [m("Plant frond", c, rough=.48) for c in ("#476e5d", "#648a65", "#889d64", "#345d55")]
    box("Ground tile bed", (0,1,-.13), (9.6,10,.22), grout)
    for i in range(12):
        for j in range(12):
            box("Glazed floor tile", ((i-5.5)*.76,(j-4.4)*.78,-.018), (.747,.768,.035), s.rng.choice(tile))
    box("Plaster below window", (0,4.1,.64), (9.5,.24,1.28), plaster)
    box("Window head", (0,4.1,5.2), (9.5,.25,.66), plaster)
    box("Side wall and shallow return", (-4.63,2.5,2.65), (.25,3.4,5.3), plaster)
    box("Opposite wall behind the service panel", (4.63,2.15,2.65), (.25,4.08,5.3), plaster)
    for row in range(2):
        for col in range(5):
            x = (col-2)*1.78
            z = 2.09 + row * 1.68
            box("Clouded window pane", (x,4.22,z), (1.77,.09,1.67), frosted if not row else frost_dark)
            box("Window mullion", (x-.87,4.05,z), (.075,.16,1.72), moss, radius=.013)
            if col == 4:
                box("Window trim", (x+.87,4.05,z), (.075,.16,1.72), moss)
    for z in [1.24,2.91,4.61]:
        box("Window transom", (0,4.01,z), (9.02,.19,.075), moss, radius=.012)
    box("Deep window ledge", (0,3.92,1.21), (9.13,.51,.105), moss, radius=.028)
    s.section("Copier and controls")
    x, y = .42, .42
    for dx in (-.75,.75):
        for dy in (-.50,.53):
            s.cylinder("Castor", (x+dx,y+dy,.11), .105, .09, rim, segments=16, bevel=.012, rotation=(0,pi/2,0))
            box("Castor housing", (x+dx,y+dy,.18), (.14,.18,.10), slate, radius=.02)
    box("Copier lower cabinet", (x,y,.88), (1.76,1.39,1.38), navy, radius=.072)
    box("Printer shoulder", (x,y,1.55), (1.85,1.47,.23), navy, radius=.05)
    box("Output well back", (x,y+.59,1.85), (1.74,.26,.52), rim, radius=.032)
    for dx in (-.68,.70):
        box("Output well side", (x+dx,y,1.84), (.44,1.36,.48), navy, radius=.04)
    box("Output well tray", (x+.012,y-.13,1.65), (.99,1.01,.066), slate, radius=.02)
    for dx in (-.35,-.20,0,.20,.35):
        box("Tray rib", (x+dx,y-.17,1.687), (.018,.59,.014), trim, radius=.004)
    s.cylinder("Output roller", (x,y+.31,1.876), .040, .89, slate, segments=16, rotation=(0,pi/2,0))
    box("Bridge above output well", (x,y,2.06), (1.86,1.45,.23), slate, radius=.053)
    box("Scanner body", (x,y+.10,2.205), (1.79,1.24,.18), trim, radius=.046)
    box("Scanner lid gasket", (x,y+.15,2.296), (1.7,1.05,.049), rim, radius=.02)
    box("Flatbed lid", (x,y+.14,2.34), (1.68,1.01,.083), navy, radius=.035)
    box("Paper feed hinge", (x,y+.60,2.39), (1.19,.16,.12), slate, radius=.028)
    box("Inclined control panel", (x,y-.675,2.13), (1.78,.46,.135), rim, radius=.039, rotation=(.28,0,0))
    box("Copier display bezel", (x+.33,y-.76,2.187), (.69,.245,.028), trim, radius=.013, rotation=(.28,0,0))
    box("Aqua copier display", (x+.33,y-.773,2.207), (.615,.185,.014), screen, radius=.012, rotation=(.28,0,0))
    for dx in (.18,.33,.48):
        box("Display status mark", (x+dx,y-.785,2.215), (.087,.022,.002), rim, rotation=(.28,0,0))
    for row in range(3):
        for col in range(4):
            cy = y-.83 + row*.078
            s.cylinder("Keypad button", (x-.68+col*.102,cy,2.216+(cy-y+.66)*.286),
                       .031,.022, amber if row == 0 and col == 3 else button,
                       segments=12, bevel=.004, rotation=(.28,0,0))
    for i, z in enumerate((.35,.66,.98,1.30)):
        box("Cassette drawer", (x,y-.712,z), (1.67,.085,.287), trim if i == 3 else navy, radius=.023)
        box("Recessed cassette pull", (x+.45,y-.761,z+.047), (.43,.021,.072), slate, radius=.012)
        box("Drawer pull lip", (x+.45,y-.784,z+.069), (.36,.029,.021), trim, radius=.007)
    box("Service side panel", (x-.88,y+.06,1.01), (.033,1.13,.94), trim, radius=.021)
    for i in range(10):
        box("Service vent", (x-.903,y-.33+i*.085,1.29), (.012,.040,.39), rim, radius=.006)
    s.tube("Power cable to floor socket", [(1.21,.88,.51),(1.41,1.13,.20),(1.68,1.53,.042),(1.54,2.02,.029),
                                         (1.84,2.5,.028),(2.44,3.52,.028),(2.5,3.97,.15)], .033, rim, sides=8)
    box("Window wall socket", (2.5,3.955,.15), (.15,.03,.14), button, radius=.012)
    box("Scanner top protective mat", (x-.11,y+.11,2.397), (.84,.68,.048), trim, radius=.015, rotation=(0,0,.19))
    for i in range(24):
        paper(s, "Newsprint stack", (x-.12+s.rng.uniform(-.07,.07),y+.10+s.rng.uniform(-.05,.05),2.423+i*.011),
              (s.rng.uniform(.72,.81),s.rng.uniform(.59,.64)), .006+i*.00021,
              (0,0,s.rng.uniform(-.105,.115)), ink if i % 6 == 5 else cream, twist=.023)
    paper(s, "Sheet emerging from the rollers", (x+.16,y-.22,1.76), (.69,.94), .18,(.19,-.18,.19), ink)
    s.section("Left-hand filing stand and oxblood folio")
    fx, fy = -1.51, -.04
    box("Filing stand floor plate", (fx,fy,.066),(.86,.62,.13),slate,radius=.036)
    for dx in (-.34,.34):
        s.beam("Filing stand upright",(fx+dx,fy+.12,.115),(fx+dx,fy+.15,1.62),.047,slate)
    box("Filing stand lower shelf", (fx,fy,.34),(.78,.53,.059),trim,radius=.015)
    box("Filing stand angled rest", (fx,fy+.11,1.30),(.83,.064,.83),slate,radius=.032,rotation=(-.20,0,0))
    box("Filing stand retaining lip", (fx,fy-.019,.914),(.84,.190,.053),slate,radius=.015)
    origin = Vector((fx,fy+.014,1.328))
    angle = Euler((-.20,-.097,-.05))
    rotation = angle.to_matrix()
    def folio(name, offset, dimensions, material, radius):
        box(name, origin+rotation @ Vector(offset), dimensions, material,radius=radius,rotation=angle)
    folio("Folio back board",(0, .016,0),(.785,.035,.825),rust,.026)
    folio("Ivory edges of the filing packet",(.008,-.018,0),(.737,.061,.778),cream,.016)
    folio("Oxblood folio front board",(0,-.058,0),(.788,.037,.829),rust,.028)
    folio("Rounded bookcloth spine",(-.365,-.014,0),(.116,.119,.825),spine,.035)
    for dx in (-.281,.337):
        folio("Inset tooling on the folio",(dx,-.079,0),(.009,.003,.714),stitching,.002)
    for dz in (-.359,.359):
        folio("Inset tooling on the folio",(.029,-.079,dz),(.625,.003,.009),stitching,.002)
    folio("Small ivory filing tab",(.133,-.080,.22),(.191,.007,.061),cream,.007)
    s.section("Window draft")
    sheets = [
        ((-1.85,-1.40,.73),(.55,.83),.21,(.63,.3,-.32)),
        ((1.6,-.47,2.63),(.74,1.05),.28,(1.03,-.3,.48)),
        ((-.90,1.31,2.91),(.73,.9),.20,(.80,-.34,.54)),
        ((.75,2.5,3.41),(.63,.9),.17,(1.10,.2,-.21)),
        ((-.86,1.99,3.42),(.50,.68),.13,(1.14,.39,.22)),
        ((-.82,-2.15,.51),(.82,1.14),.19,(.44,-.19,.23)),
        ((1.65,-1.29,.46),(.64,.91),.18,(.38,-.31,.17)),
    ]
    for i, (loc, size, bend, rot) in enumerate(sheets):
        paper(s, "Loose sheet in the window draft", loc, size, bend, rot, ink if i % 3 != 1 else cream)
    for i in range(9):
        paper(s, "Settled sheet on tiles", (s.rng.uniform(-2.25,2.25),s.rng.uniform(-3,3),.017+.006*i),
              (.48,.69),.016,(0,0,s.rng.uniform(-pi,pi)), ink if i%2 else cream)
    for x, y, scale in [(-2.06,2.71,1), (2.9,3.16,.70)]:
        s.cylinder("Glazed planter", (x,y,.34*scale), .31*scale,.66*scale, stone, top=.40*scale, bevel=.026)
        s.ring("Pot rim", (x,y,.65*scale), (.38*scale,.38*scale), .028, stone, segments=32)
        s.cylinder("Potting soil", (x,y,.653*scale), .345*scale,.028, grout, segments=24)
        for i in range(16):
            a = i * 2.4
            r = s.rng.uniform(.27,.87)*scale
            rise = s.rng.uniform(.38,1.68)*scale
            start = Vector((x,y,.65*scale))
            tip = Vector((x+cos(a)*r,y+sin(a)*r,.59*scale+rise))
            middle = start.lerp(tip,.62) + Vector((0,0,.1))
            s.tube("Plant branch", [start,start.lerp(middle,.58),middle], .013*scale, leaf[0], sides=5)
            across = Vector((-sin(a),cos(a),.12)) * s.rng.uniform(.12,.23)*scale
            base = start.lerp(middle,.76)
            mid = base.lerp(tip,.57)
            crest = mid + Vector((0,0,.09*scale))
            s.mesh("Folded broad leaf", [base,mid+across,tip,mid-across,crest],
                   [(0,1,4),(1,2,4),(2,3,4),(3,0,4)], leaf[i%len(leaf)], smooth=True)


def print_lights(s):
    s.light("Diffuse paper-white window", "AREA", (-1.15,3.64,4.1), "#eefbf7", 825, target=(.2,.3,1.2), size=6, height=3.6)
    s.light("Broad left upper paper bounce", "AREA", (-2.6,-3.15,4.6), "#fff6ef", 475, target=(-.55,.2,1.6), size=5)
    s.light("Cool low bounce", "AREA", (3.1,-1.6,2.1), "#83a5d2", 115, target=(0,.6,1.4), size=3)


def closed_lathe(s, name, center, profiles, material, n=32):
    vertices = [(center[0]+rx*cos(i*tau/n),center[1]+ry*sin(i*tau/n),z)
                for z,rx,ry in profiles for i in range(n)]
    faces = [(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)
             for j in range(len(profiles)-1) for i in range(n)]
    faces += [tuple(reversed(range(n))), tuple(range(len(vertices)-n,len(vertices)))]
    return s.mesh(name, vertices, faces, material, smooth=True)


def alley(s):
    m, box = s.material, s.box
    road = [m("Damp blue-gray paving", c, rough=.24, coat=.32) for c in ("#3b4648","#454b4d","#414749","#4b4d49")]
    mortar = m("Black joints", "#252c2e", rough=.62)
    umber = [m("Uneven old lime plaster", c, rough=.84) for c in ("#655d4f","#756855","#5e5c55","#6c665a")]
    right = [m("Soot-dark wall", c, rough=.64) for c in ("#293338","#343d40","#374145","#3d4140")]
    truss = m("Canopy black iron", "#29302d", rough=.39, metal=.25)
    brass = m("Weathered brass", "#806b4f", rough=.36, metal=.32)
    light = m("Old opal glass", "#ffcf91", rough=.24, glow=2.8)
    window = m("Warm pearl in the carriage windows", "#e7c9a4", rough=.35, glow=1.12)
    coach_trim = m("Worn dark blue coach bead", "#4b5458", rough=.46, metal=.12, glow=.06)
    coach_line = m("Muted umber coach pinstripe", "#776451", rough=.55, glow=.13)
    damp = m("Wet stone robe", "#2e383e", rough=.35, coat=.2)
    fold = m("Raised seams of grey slate", "#40494a", rough=.4)
    face = m("Smooth black basalt inset", "#343e42", rough=.25)
    ivory = m("Stone plum blossom clasp", "#ded2b6", rough=.48)
    snow = m("Slow snow flurry", "#acaead", rough=.66, glow=.13)
    box("Street paving bed", (.8,4,-.16), (10,22,.26), mortar)
    for j in range(30):
        for i in range(10):
            x = (i-4.5)*.55 + (.27 if j%2 else 0)
            y = (j-8)*.54
            box("Damp setts", (x,y,-.025), (.532,.524,.044), s.rng.choice(road),
                rotation=(0,0,s.rng.uniform(-.012,.012)))
    for j in range(4):
        y = -1.7+j*3.04
        bend = max(0,j-1)*.56
        for sign in (-1,1):
            x = sign*2.2+bend
            palette = umber if sign<0 else right
            box("Plaster bay" if sign<0 else "Charcoal wall bay", (x,y,2.15), (.23,3.12,4.3), palette[j])
            if sign<0:
                box("Wall coping", (x+.17,y,3.36), (.15,3.10,.12), brass)
                box("Pavement curb", (x+.32,y,.1), (.43,3.10,.22), palette[j], radius=.03)
                box("Projecting masonry pilaster", (x+.20,y-1.42,2.04), (.34,.29,4.08), palette[(j+1)%4], radius=.033)
        body_x = 2.19+bend
        box("Dark carriage side shell",(body_x,y,1.73),(.29,2.965,2.96),right[j],radius=.115)
        box("Carriage radius at the eave",(body_x+.006,y,3.132),(.33,2.989,.44),coach_trim,radius=.145)
        box("Dark carriage skirt",(body_x-.017,y,.49),(.31,2.947,.37),truss,radius=.067)
        for z,material in ((1.13,coach_trim),(1.37,coach_line),(2.87,coach_trim)):
            box("Longitudinal carriage bead",(body_x-.166,y,z),(.047,2.953,.039),material,radius=.009)
        box("Platform edge beside carriage",(body_x-.42,y,.077),(.38,3.10,.158),right[(j+1)%4],radius=.023)
        for k in range(5):
            yy = y-1.02+k*.51
            x = 2.2+bend-.132
            box("Deep window frame", (x,yy,2.12), (.11,.34,1.23), truss, radius=.028)
            box("Amber slit window", (x-.064,yy,2.15), (.025,.216,1.09), window, radius=.020)
            for zz in (1.89,2.30):
                box("Slit window crossbar", (x-.084,yy,zz), (.024,.221,.024), brass)
        if j >= 2:
            for sign, material in [(-1,umber[j]),(1,right[j])]:
                xx,yy = sign*2.2+bend-.28,y-1.52
                box("Masonry return at the bend", (xx,yy,2.13), (.78,.24,4.26), material)
                box("Curb return at the bend", (xx-sign*.31,yy,.09), (.75,.47,.19), material, radius=.027)
    for sign, material in [(-1,umber[1]),(1,right[1])]:
        box("Wall continuing to the entrance", (sign*2.2,-4.76,2.26), (.28,3.08,4.52), material)
        box("Worn ashlar entrance jamb", (sign*1.97,-4.45,2.18), (.24,.42,4.36), material, radius=.032)
    box("Crosspiece above the entrance", (0,-4.45,4.22), (4.22,.43,.26), truss, radius=.043)
    box("Far building seen across the entrance",(0,-9.24,2.67),(14,.28,5.34),right[2])
    for x in (-3.1,-1.35,.4,2.15,3.9):
        box("Unlit doorway facing the entrance", (x,-9.07,1.27),(.92,.16,2.54),truss, radius=.033)
    box("Cross street closing wall", (3.12,10.03,2.22), (5.5,.26,4.44), right[1])
    box("Recessed door to cross street", (2.13,9.88,1.29), (1.38,.12,2.56), truss, radius=.045)
    box("Amber cross-street transom", (2.13,9.79,2.48), (1.14,.08,.20), window, radius=.016)
    for i in range(3):
        box("Cross street riser", (2.13,9.31-i*.24,.22-i*.077), (1.72,.44,.12), road[1], radius=.016)
    s.section("Overhangs and lamp fixtures")
    for x in (-2.02,-1.56,-1.02,-.48):
        s.beam("Canopy ribs along alley", (x,-3.22,3.54+(x+2.02)*.34), (x,4.58,3.54+(x+2.02)*.34),
               .105,truss)
    for y in (-2.9,-1.22,.46,2.14,3.82):
        s.tube("Swept canopy wall bracket", [(-2.05+1.68*i/18,y,3.11+.94*sin(i/18*pi/2)) for i in range(19)],
               .062,truss,sides=8)
        s.beam("Canopy short upper strut", (-2.08,y,4.05),(-.35,y,4.05),.078,truss)
        s.beam("Diagonal iron lattice", (-1.72,y,3.58),(-.70,y+.67,4.02),.055,truss)
        s.beam("Lamp mount",(-2.02,y,2.91),(-1.61,y,3.02),.066,truss)
        s.cylinder("Spun bronze lamp shade", (-1.59,y,2.92),.234,.14,brass,top=.10,segments=24,bevel=.009)
        s.orb("Warm opal pendant",(-1.59,y,2.79),(.156,.156,.152),light,segments=20,rings=12)
    box("Stone bench by the first lamp", (-1.75,-.2,.40), (.55,1.25,.13), umber[0], radius=.07)
    for y in (-.63,.25):
        box("Bench foot", (-1.72,y,.205), (.43,.20,.39), right[0], radius=.026)
    s.section("Basalt cloak and snow")
    cx, cy = -.49,1.39
    s.cylinder("Low basalt footing", (cx,cy,.07), .76,.14, right[1], segments=12, bevel=.036)
    closed_lathe(s,"Basalt cloak", (cx,cy), [(.14,.58,.39),(.31,.56,.34),(.68,.41,.28),(1.12,.36,.24),
                                          (1.45,.46,.26),(1.63,.33,.22),(1.76,.18,.17)], damp)
    s.orb("Folded hood", (cx,cy,1.84),(.354,.315,.395),damp,rotation=(-.12,.03,-.14))
    s.orb("Basalt inset inside hood", (cx+.015,cy-.231,1.825),(.202,.117,.241),face,segments=22)
    for i in range(11):
        a = i*tau/11
        points = [(cx+rx*cos(a+t*.52),cy+ry*sin(a+t*.52),z)
                  for t,rx,ry,z in [(0,.576,.387,.16),(.21,.532,.33,.40),(.52,.394,.276,.73),(.80,.363,.243,1.12), (1,.441,.25,1.48)]]
        s.tube("Ridge in the cut stone drape", points,.019+(.008 if i%3==0 else 0),fold,sides=6)
    for sign in (-1,1):
        s.tube("Deep hem rising to the hood", [(cx+sign*.17,cy+.208,1.00),(cx+sign*.32,cy+.184,1.29),
               (cx+sign*.39,cy+.145,1.46),(cx+sign*.30,cy+.218,1.57),(cx+sign*.22,cy+.227,1.71)],
               .042 if sign>0 else .034,fold,sides=8)
    s.tube("Asymmetric edge of the hood",[(cx-.248,cy-.158,1.67),(cx-.270,cy-.186,1.85),
           (cx-.204,cy-.181,2.062),(cx+.018,cy-.152,2.17),(cx+.17,cy-.155,2.09)],
           .037,damp,sides=9)
    s.tube("Crossed robe collar", [(cx-.34,cy-.16,1.61),(cx-.17,cy-.255,1.51),
                                  (cx+.02,cy-.261,1.35),(cx+.19,cy-.205,1.22)], .051,fold,sides=8)
    s.tube("Opposing collar fold", [(cx+.34,cy-.17,1.63),(cx+.16,cy-.267,1.53),
                                    (cx-.02,cy-.267,1.40)], .035,fold,sides=8)
    for j in range(5):
        a = j*tau/5
        s.orb("Ivory plum blossom petal", (cx+.238+.043*cos(a),cy-.220,1.98+.043*sin(a)),
              (.026,.014,.031),ivory,segments=10,rings=6)
    s.orb("Plum clasp center", (cx+.238,cy-.232,1.98),(.02,.014,.02),brass,segments=10,rings=6)
    for i in range(90):
        size = s.rng.uniform(.008,.023)
        s.orb("Wind-carried flake", (s.rng.uniform(-1.9,1.92),s.rng.uniform(-2.45,8.9),s.rng.uniform(.27,3.6)),
              (size,size*.63,size*.88),snow,segments=8,rings=4)


def alley_lights(s):
    for i, y in enumerate((-2.9,-1.22,.46,2.14,3.82)):
        s.light("Warm pool from pendant", "POINT", (-1.57,y,2.63), "#ffce99", 95-i*7, size=.20)
    s.light("Moonlit gap between eaves", "AREA", (.1,2.2,5.45), "#a8bfd5", 545, target=(.26,1.5,0), size=3.0, height=8)
    s.light("Soft alley entrance bounce", "AREA", (.4,-3.69,2.27), "#b5c8ca", 85, target=(-.4,1.2,1.33), size=3.8)
    s.light("Warm glow in the bend", "AREA", (1.96,9.35,2.65), "#ffc590", 145, target=(.3,3.1,1.10),size=2.2)
    s.light("Diffuse bounce off the carriage windows", "AREA", (1.78,.64,2.24), "#e7d7b9", 92,
            target=(-.49,1.28,1.57),size=.52,height=2.94)


def petal(s, name, root, direction, length, width, curl, material, *, roll=0):
    base = Vector(root)
    along = Vector(direction).normalized()
    across = Vector((0,-1,0)).cross(along).normalized()
    normal = along.cross(across).normalized()
    if roll:
        across, normal = cos(roll)*across+sin(roll)*normal, cos(roll)*normal-sin(roll)*across
    cols, rows = 6, 9
    vertices = []
    for i in range(rows+1):
        t = i/rows
        taper = .035+.965*sin(pi*t**.88)**.68
        for j in range(cols+1):
            side = (j-cols/2)/(cols/2)
            rise = curl*t*t + width*(.31*side*side+.065*cos(side*pi*2))*sin(pi*t)
            vertices.append(base + along*length*t + across*(side*width*taper) + normal*rise)
    faces = [(i*(cols+1)+j,i*(cols+1)+j+1,(i+1)*(cols+1)+j+1,(i+1)*(cols+1)+j)
             for i in range(rows) for j in range(cols)]
    obj = s.mesh(name, vertices, faces, material, smooth=True)
    modifier = obj.modifiers.new("Folded petal thickness", "SOLIDIFY")
    modifier.thickness = .010 if length>.4 else .005


def flower(s, loc, size, palette, center_m, seed_m, *, depth=1):
    x,y,z = loc
    for layer, count in [(0,11),(1,8),(2,5)]:
        for i in range(count):
            a = i*tau/count + layer*.27
            rot = s.rng.uniform(-.12,.12)
            petal(s, "Hand-curved corolla petal", (x+.08*size*cos(a),y-.06*size*layer,z+.08*size*sin(a)),
                  (cos(a),.06-.17*layer,sin(a)), size*(1-.21*layer)*s.rng.uniform(.85,1.14),
                  size*(.23-.04*layer), depth*size*(.22+.105*layer)*s.rng.uniform(.75,1.16),
                  palette[(i+layer)%len(palette)], roll=rot)
    s.orb("Flower center", (x,y-.23*size,z),(.23*size,.16*size,.23*size),center_m,segments=20,rings=12)
    for i in range(22):
        a = i*2.39996
        r = .185*size*(i/22)**.5
        s.orb("Pollen bead", (x+r*cos(a),y-size*(.356+.028*(1-i/22)),z+r*sin(a)),
              (.020*size,.022*size,.020*size),seed_m,segments=8,rings=4)


def cupped_rose(s, center, size, palette):
    origin = Vector(center)
    for layer, count in enumerate((10, 8, 7, 5)):
        for i in range(count):
            angle = i*tau/count + layer*.52
            radial = Vector((cos(angle),0,sin(angle)))
            tangent = Vector((-sin(angle),0,cos(angle)))
            vertices = []
            for row in range(8):
                t = row/7
                radius = size*(.11 + (.74-.15*layer)*sin(t*pi/2))
                half_width = size*(.30-.037*layer)*(.09+.91*sin(pi*t*.79))
                for col in range(7):
                    edge = (col-3)/3
                    curl = size*(.13*layer+.29*t+.074*edge**2*sin(pi*t)-.085*t**5)
                    vertices.append(origin+radius*radial+edge*half_width*tangent+Vector((0,-curl,0)))
            faces = [(j*7+i,j*7+i+1,(j+1)*7+i+1,(j+1)*7+i) for j in range(7) for i in range(6)]
            petal_mesh = s.mesh("Cupped coral rose petal",vertices,faces,palette[(layer+i)%len(palette)],smooth=True)
            petal_mesh.modifiers.new("Rose petal edge","SOLIDIFY").thickness = .012


def glove(s, center, angle, cloth, trim):
    origin = Vector(center)
    basis = Euler((0,angle,0)).to_matrix()
    def at(x,y,z):
        return origin+basis @ Vector((x,y,z))
    s.orb("White glove palm",at(0,0,0),(.144,.060,.176),cloth,rotation=(0,angle,0))
    for i, length in enumerate((.312,.375,.357,.280)):
        x = (i-1.5)*.061
        points = [at(x,0,.102),at(x*1.08,-.012,.181),at(x*1.12,-.019,length-.036),at(x*1.08,-.037,length)]
        s.tube("Tailored finger of a white glove",points,.026 if i==0 else .028,cloth,sides=10)
        s.orb("Rounded glove fingertip",points[-1],(.025,.025,.026),cloth,segments=12,rings=8)
    thumb = [at(.106,-.006,-.056),at(.168,-.031,.000),at(.219,-.048,.073)]
    s.tube("Tailored glove thumb",thumb,.034,cloth,sides=10)
    s.orb("Rounded glove thumb",thumb[-1],(.031,.028,.032),cloth,segments=12,rings=8)
    s.orb("White glove folded cuff",at(0,0,-.166),(.110,.069,.107),cloth,rotation=(0,angle,0))
    s.ring("Pale stitched seam around cuff",at(0,0,-.181),(.108,.068),.005,trim,rotation=(0,angle,0),segments=30)
    return at(0,.034,-.20)


def flower_stage(s):
    m, box = s.material, s.box
    lavender = m("Powdered mauve stage platform", "#b8a7b4", rough=.43, coat=.25)
    floor = m("Warm pearl cyclorama", "#d8c2c5", rough=.49, coat=.13)
    backdrop = m("Coral wing cyclorama", "#d2a1ab", rough=.66)
    cool_backdrop = m("Pale aqua wing cyclorama", "#b0d1d3", rough=.67)
    winter_backdrop = m("Pearl center cyclorama", "#e3d7d8", rough=.66)
    rim = m("Pale gilding", "#bca07e", rough=.27, metal=.22)
    cream = m("Ivory petals", "#fff3eb", rough=.47, coat=.16,glow=.13)
    rose = [m("Petal shell", c, rough=.40, coat=.18) for c in ("#f3c1c7","#e892ad","#e1a2b5","#ab6889")]
    muted = [m("Wings of aquamarine petals", c, rough=.45) for c in ("#83c5c7","#6fa6bb","#a0c7c1","#c7a9c3")]
    stem = m("Sage stem", "#789a85", rough=.49)
    pollen = m("Rosewood flower heart", "#a35870", rough=.61)
    seed = m("Millet gold", "#e2af7c", rough=.45)
    pearl = m("Pearl ring inlays", "#fff0eb", rough=.26, glow=.35)
    peach = m("Peach opaline glass", "#ffd4c8", rough=.15, glass=.88, coat=.28)
    aqua = m("Aqua opaline glass", "#9ce3ec", rough=.12, glass=.88, coat=.31)
    shard = [m("Fold inside the opaline glass", c, rough=.18, glass=.42, coat=.38, glow=.08)
             for c in ("#f0a193","#e7b0c8","#6ebfcf","#4597bb","#e4ceac")]
    box("Pearl theatre floor", (0,2,-.139), (16,17,.26),floor)
    for i in range(27):
        x = (i-13)*.72
        y = 6.9-.025*(i-13)**2
        drape = backdrop if x < -1.2 else cool_backdrop if x > 1.2 else winter_backdrop
        s.cylinder("Fluted theatre cyclorama", (x,y,2.8),.55,5.6,drape,segments=16)
    for sign in (-1,1):
        box("Wraparound theatre wing", (sign*9.46,-.28,2.83),(.31,9.34,5.69),backdrop if sign<0 else cool_backdrop,radius=.085)
    s.cylinder("Oval stage base", (.12,.82,.13), 3.24,.26,lavender,segments=64,bevel=.035)
    s.cylinder("Pearl stage surface", (.12,.82,.265), 3.16,.045,floor,segments=64,bevel=.012)
    s.ring("Dais metallic lip", (.12,.82,.17),(3.217,3.217),.018,rim,segments=80)
    s.ring("Stage circle inlay", (.12,.82,.294),(2.92,2.92),.011,pearl,segments=80)
    s.section("Petal scenery")
    plantings = [
        ((-1.30,1.65,2.27),1.14,[cream,*rose[:3]],.92),
        ((-2.02,1.19,.91),.61,rose,.93),
        ((-.48,2.49,1.43),.82,[cream,rose[0],rose[2]],1.06),
        ((1.96,2.0,.72),.62,muted,1.0),
        ((-1.81,2.43,3.07),.61,rose,1.0),
        ((.13,3.01,2.56),.46,rose,.86),
        ((2.52,2.89,1.28),.42,[cream,muted[0],muted[3]],.95),
    ]
    for i,(loc,size,palette,depth) in enumerate(plantings):
        x,y,z = loc
        root_x,root_y = x+.28,y+.41
        on_stage = hypot(root_x-.12,root_y-.82) < 3.15
        if not on_stage:
            s.cylinder("Weighted porcelain foot in the theatre wing",(root_x,root_y,.016),.096,.061,lavender,
                       segments=24,bevel=.012)
        s.tube("Curved stem", [(root_x,root_y,.278 if on_stage else .038),(x+.18,y+.34,z*.39),(x-.11,y+.27,z*.73),(x,y,z)],
               .024+.025*size,stem,sides=8)
        for sign in (-1,1):
            petal(s,"Sage leaf",(x+.12,y+.31,z*.53),(sign,.12,.56),.50+.2*size,.17,.16,stem,roll=.4*sign)
        if i in (0,1):
            cupped_rose(s,loc,size,[rose[0],rose[1],rose[2],rose[3]])
        else:
            flower(s,loc,size,palette,pollen,seed,depth=depth)
    for i in range(15):
        offset = s.rng.uniform(0,tau)
        radius = s.rng.uniform(.55,2.78)
        x,y = .12+radius*cos(offset),.82+radius*sin(offset)
        angle = s.rng.uniform(-pi,pi)
        petal(s,"Petal shed on the stage",(x,y,.287),(cos(angle),sin(angle),.05),
              s.rng.uniform(.13,.35),.055,.037,rose[i%len(rose)],roll=.8)
    s.section("White flower crown and crossed gloves")
    crown_origin = (-1.42,.83,3.10)
    s.ring("Woven sage flower crown",crown_origin,(.70,.43),.027,stem,segments=64,rotation=(pi/2-.25,0,0))
    for i in range(10):
        a = i*tau/10
        x,y,z = crown_origin
        loc = (x+.70*cos(a),y-.034+.106*sin(a),z+.413*sin(a))
        petal(s,"Green leaf woven behind white flowers",loc,(cos(a),.13,sin(a)),.199,.061,.056,stem)
        if 1 <= i <= 5 or i in (0,7,8):
            for j in range(5):
                a0 = j*tau/5 + i*.59
                petal(s,"White blossom on the flower crown",loc,(cos(a0),.015,sin(a0)),.12,.037,.025,cream)
            s.orb("Crown blossom gold pollen",(loc[0],loc[1]-.044,loc[2]),(.039,.021,.039),seed,segments=12,rings=8)
    s.tube("Thin suspension on the flower crown", [(-1.42,.934,3.50),(-1.42,.934,5.74)],.007,rim,sides=6)
    s.beam("Flower crown rail",(-1.61,.934,5.73),(-.79,.934,5.73),.044,rim)
    cloth = m("Warm white glove fabric","#fff4e9",rough=.64,glow=.12)
    s.cylinder("Porcelain glove display foot",(-1.24,.28,.325),.36,.084,lavender,segments=40,bevel=.021)
    for center, angle in [((-1.07,.01,1.51),1.04),((-1.52,.17,1.45),-1.13)]:
        holding = glove(s,center,angle,cloth,seed)
        s.tube("Brass stand behind the glove cuff",[(-1.24,.28,.35),(-1.24,.28,1.13),holding],.019,rim,sides=8)
    s.section("Suspended opaline globes")
    globes = [
        ((.84,-.03,1.72),.79,aqua,2),
        ((1.04,1.03,3.05),.63,peach,0),
        ((1.87,1.94,1.92),.49,aqua,3),
        ((.36,1.32,3.83),.31,peach,1),
        ((2.16,.57,2.64),.29,peach,0),
        ((-.19,-.91,.91),.31,peach,4),
        ((1.66,3.38,3.11),.34,aqua,2),
    ]
    for i, (loc,radius,glass,index) in enumerate(globes):
        x,y,z = loc
        s.orb("Closed opaline globe",loc,(radius,radius,radius),glass,segments=36,rings=20)
        s.ring("Thin bezel around bubble", loc,(radius*1.024,radius*1.024),.013+.010*radius,pearl,
               segments=48,rotation=(pi/2-.29+i*.13,.16,i*.12))
        s.orb("Faceted colored inclusion", (x,y+.04,z-.09*radius),(.69*radius,.62*radius,.53*radius),
              shard[index],facets=True,rotation=(.43,.47*i,.22))
        s.orb("Opal fleck inside globe", (x-.22*radius,y-.22*radius,z+.31*radius),
              (.27*radius,.16*radius,.20*radius),shard[(index+1)%5],facets=True,rotation=(.43,.47*i,.22))
        start = (x,y,z+radius*.988)
        s.tube("Suspension wire to theatre grid",[start,(x,y,max(5.74,start[2]+1))],.005,rim,sides=5)
    s.beam("Upper iron track", (-2.1,1.1,5.76),(3.1,1.1,5.76),.082,rim)
    for x in (-.85,2.5):
        s.beam("Theatre rig side track", (x,-1.14,5.75),(x,3.62,5.75),.062,rim)
    for y in (-.91,-.03,.57,1.03,1.32,1.94,3.38):
        s.beam("Transverse suspension rail",(-1.0,y,5.74),(2.58,y,5.74),.043,rim)
    s.section("Freestanding beam of pearl light")
    disc = (1.41,2.91,1.94)
    s.ring("Pearl light disc rim",disc,(1.07,1.07),.021,pearl,segments=72,rotation=(pi/2,0,-.13))
    lightglass = m("Thin translucent opal disc","#c5eff2",glass=.65,rough=.36,glow=.10)
    s.cylinder("Opal light disc",disc,1.047,.040,lightglass,segments=72,bevel=.012,rotation=(pi/2,0,-.13))
    basis = Euler((pi/2,0,-.13)).to_matrix()
    for i in range(19):
        a = i*tau/19
        direction = basis @ Vector((cos(a),sin(a),0))
        base = Vector(disc)+1.06*direction
        s.tube("Pearl radial filament",[base,base+(.12+.135*(i%3))*direction],.012,pearl,sides=7)
    for dx in (-.36,.36):
        start = Vector(disc)+basis @ Vector((dx,(1.067**2-dx**2)**.5,0))
        s.tube("Opal disc steel suspension",[start,(start.x,disc[1],5.74)],.009,rim,sides=6)
    s.beam("Opal disc cross rail",(-.86,disc[1],5.74),(2.52,disc[1],5.74),.043,rim)


def flower_lights(s):
    s.light("Ivory theatre softbox", "AREA", (-2.4,-3.8,6.2), "#fff1e5", 770, target=(-.2,.8,1.9),size=4.8,height=2.2)
    s.light("Cool light across glass", "AREA", (4.1,.3,4.3), "#abedf8", 610, target=(.6,1.0,1.7),size=2.3,height=4)
    s.light("Warm silk behind the petals", "AREA", (-2.4,4.0,5.1), "#ffbbae", 640, target=(-.8,1.7,2.3),size=4.5)
    s.light("Thin white reflection", "AREA", (.9,-2.6,3.95), "#fff1ed", 95, target=(1,.7,2.25),size=.21,height=3.2)
    s.light("White glow at the costume center","AREA",(-1.22,-2.25,3.09),"#fff6ed",118,target=(-1.25,.65,1.67),size=1.85)


def enamel_image(material, name, stops, *, canopy=False):
    # Deterministic enamel mottling, stored as a packed 256px handmade atlas.
    v,u = np.mgrid[0:256,0:256].astype(np.float32) / 255
    clouds = (
        .10*np.sin(u*12.57+np.sin(v*8.7)*1.2)
        +.075*np.sin(u*31.42-v*16+np.cos(v*14.4))
        +.037*np.sin(u*62.83+v*39.2)
        +.022*np.sin(u*100.53-v*91.7)
        +.016*np.sin(u*182.21+v*138.1)
    )
    if canopy:
        base = np.clip(.50 + .34*np.sin(8*u + 6*v + 1.10*np.sin(5*v)) + clouds, 0, 1)
    else:
        base = np.clip(.06+.88*v+clouds*.77, 0, 1)
    positions, colors = zip(*stops)
    palette = np.array([tuple(int(h[i:i+2],16)/255 for i in (1,3,5)) for h in colors])
    rgb = np.stack([np.interp(base,positions,palette[:,c])+.028*clouds for c in range(3)],axis=-1)
    packed_color(material, name, rgb)


def packed_color(material, name, rgb):
    height, width, _ = rgb.shape
    rgba = np.ones((height,width,4),dtype=np.float32)
    rgba[:,:,:3] = np.clip(rgb,0,1)
    image = bpy.data.images.new(name,width=width,height=height,alpha=False)
    image.pixels.foreach_set(rgba.ravel())
    image.pack()
    nodes = material.node_tree.nodes
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    shader = nodes.get("Principled BSDF")
    material.node_tree.links.new(texture.outputs["Color"],shader.inputs["Base Color"])
    material.node_tree.links.new(texture.outputs["Color"],shader.inputs["Emission Color"])


def uv_map(obj, coordinates):
    uv = obj.data.uv_layers.new()
    for polygon in obj.data.polygons:
        for loop, (u,v) in zip(polygon.loop_indices, coordinates[polygon.index]):
            uv.data[loop].uv = (u,v)


def station_floor_map(material):
    v,u = np.mgrid[0:384,0:384].astype(np.float32) / 383
    x, y = 15*u-7.5, 16*v-5.5
    warm_red = np.exp(-((x+1.98)/1.84)**2-((y+.18)/2.66)**2)
    cool_blue = np.exp(-((x-1.82)/1.9)**2-((y-.96)/3.06)**2)
    warm_axis = np.exp(-((x-.02)/.91)**2-((y-3.15)/4.28)**2)
    mottling = .008*np.sin(x*21+y*20)+.009*np.sin(x*10.8-y*13.6)
    base = np.array([.178,.198,.225],dtype=np.float32)+mottling[:,:,None]
    rgb = (base + warm_red[:,:,None]*[.245,.058,.060] + cool_blue[:,:,None]*[.033,.132,.235]
           + warm_axis[:,:,None]*[.207,.155,.076])
    packed_color(material, "Red blue and amber bounce baked into the concourse", rgb)


def glass_tower(s, center, radius, height, glass, metal, base, shoe):
    x,y = center
    n,rows = 72,16
    vertices = [(x+radius*cos(i*tau/n),y+radius*sin(i*tau/n),.22+j*height/rows)
                for j in range(rows+1) for i in range(n)]
    faces = [(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)
             for j in range(rows) for i in range(n)]
    obj = s.mesh("Continuous curved enamel glazing",vertices,faces,glass,smooth=True)
    uv_map(obj,[[(i/n,j/rows),((i+1)/n,j/rows),((i+1)/n,(j+1)/rows),(i/n,(j+1)/rows)]
                for j in range(rows) for i in range(n)])
    shell = obj.modifiers.new("Glass thickness", "SOLIDIFY")
    shell.thickness = .032
    for i in range(12):
        a = i*tau/12
        xy = (x+(radius+.007)*cos(a),y+(radius+.007)*sin(a))
        column = s.box("Tower bronze mullion", (*xy,.22+height/2),(.092,.14,height+.077),metal,
                       radius=.010,rotation=(0,0,a+pi/2))
        column.name += " / glazing"
    for z in (.23,.22+height*.28,.22+height*.55,.22+height*.79,.22+height):
        s.ring("Continuous curved bronze transom", (x,y,z), (radius+.009,radius+.009),
               .048,metal,segments=72)
    s.cylinder("Raised granite tower footing",(x,y,.103),radius+.12,.204,base,segments=64,bevel=.038)
    s.cylinder("Colored bevel on the tower shoe",(x,y,.184),radius+.103,.065,shoe,segments=64,bevel=.019)
    s.cylinder("Bronze tower crown",(x,y,.27+height),radius+.08,.12,metal,segments=64,bevel=.032)


def station(s):
    m,box = s.material,s.box
    floor = m("Charcoal terrazzo with soft colored bounce","#42444c",rough=.28,coat=.30,glow=.83)
    station_floor_map(floor)
    grout = m("Dark tile joints","#171f28",rough=.6)
    metal = m("Bronze lead joints","#4a4140",metal=.44,rough=.36)
    beam = m("Dark station steel","#232738",metal=.25,rough=.4)
    column = m("Fluted concourse concrete","#5f646d",rough=.65)
    distant = m("Backlit plaster","#aa8488",rough=.57)
    stair = m("Passenger stair amber indirect light","#f0c2a0",glow=.96,rough=.44)
    plinth = m("Satin graphite tower stone","#63606a",rough=.57,glow=.19)
    warm_shoe = m("Vermilion light on the beveled tower shoe","#986362",rough=.44,glow=.32)
    blue_shoe = m("Lapis light on the beveled tower shoe","#5b759a",rough=.44,glow=.32)
    warm_screen = m("Frosted amber source above the rear step","#f7d2a5",rough=.68,glow=.81)
    red = m("Vitreous enamel / vermilion to warm white","#eaa088",rough=.36,glow=.81,coat=.17)
    blue = m("Vitreous enamel / lapis to opal","#8fbbde",rough=.34,glow=.79,coat=.17)
    canopy = m("Vitreous canopy / ultramarine and carmine","#c281a3",rough=.26,glow=.63,coat=.26)
    enamel_image(red,"Vermilion kiln atlas", [(0,"#831532"),(.17,"#b91538"),(.36,"#ed304b"),(.60,"#e66b58"),(.79,"#ffb878"),(1,"#fff0ba")])
    enamel_image(blue,"Ultramarine kiln atlas", [(0,"#172f7b"),(.23,"#2453a6"),(.42,"#1599cb"),(.64,"#84c9de"),(.81,"#b6adcf"),(1,"#fff1e8")])
    enamel_image(canopy,"Concourse ceiling kiln atlas", [(0,"#19244f"),(.18,"#3f54b1"),(.34,"#5971bb"),(.52,"#ba77b8"),(.67,"#ffd1a8"),(.81,"#ec506b"),(1,"#ac183b")],canopy=True)
    box("Concourse ground underneath joints",(0,3,-.141),(18,19,.24),grout)
    for i in range(20):
        for j in range(21):
            x,y = (i-9.5)*.72,(j-7)*.72
            tile = box("Rectangular dark terrazzo floor tile",(x,y,-.017),(.711,.711,.035),floor)
            points = [((v.co.x+x+7.5)/15,(v.co.y+y+5.5)/16) for v in tile.data.vertices]
            uv_map(tile,[[points[i] for i in panel.vertices] for panel in tile.data.polygons])
    s.section("Carmine and blue column structures")
    glass_tower(s,(-1.93,.71),1.33,4.67,red,metal,plinth,warm_shoe)
    glass_tower(s,(1.78,1.86),1.25,4.60,blue,metal,plinth,blue_shoe)
    s.section("Curved stained canopy")
    nx,ny = 22,22
    def roof(u,v):
        x = 14.4 * (u-.5)
        return (x,-5.25+16.0*v, 6.16-.023*x*x-.84*(v-.57)**2)
    vertices = [roof(i/nx,j/ny) for j in range(ny+1) for i in range(nx+1)]
    faces = [(k,k+1,k+nx+2,k+nx+1) for k in range(len(vertices)) if k%(nx+1)<nx and k//(nx+1)<ny]
    obj = s.mesh("Bent kiln-glazed glass ceiling",vertices,faces,canopy,smooth=True)
    uv_map(obj,[[(i/nx,j/ny),((i+1)/nx,j/ny),((i+1)/nx,(j+1)/ny),(i/nx,(j+1)/ny)]
                for j in range(ny) for i in range(nx)])
    thickness = obj.modifiers.new("Laminated canopy edge", "SOLIDIFY")
    thickness.thickness = .045
    for i in range(19):
        u = i/18
        s.tube("Ceiling longitudinal glazing bar", [tuple(c-(.05 if j==2 else 0) for j,c in enumerate(roof(u,k/14)))
               for k in range(15)], .038 if i%3 else .063,metal,sides=6)
    for i in range(13):
        v = i/12
        s.tube("Ceiling transverse glazing bar",[tuple(c-(.067 if j==2 else 0) for j,c in enumerate(roof(k/26,v))) for k in range(27)],
               .033 if i%3 else .072,metal,sides=6)
    for z,radii in [(4.97,(5.49,3.54)),(5.17,(5.46,3.50)),(5.32,(5.45,3.48))]:
        s.ring("Elliptical lantern soffit",(0,1.38,z),radii,.084 if z!=5.17 else .14,beam,segments=84)
    for i in range(12):
        a = i*tau/12
        p=(5.43*cos(a),1.38+3.49*sin(a),5.20)
        s.beam("Soffit suspension strut",p,(p[0],p[1],5.98-.023*p[0]**2),.066,metal)
    for x in (-5.64,5.64):
        for y in (-1.6,2.8,7.7):
            s.cylinder("Concrete concourse pier",(x,y,2.80),.285,5.58,column,segments=16,bevel=.024)
            s.cylinder("Concrete pier base",(x,y,.16),.39,.30,beam,segments=24,bevel=.036)
    for x in (-7.13,7.13):
        box("Side wall beneath the glass canopy",(x,2.70,2.52),(.23,16,5.04),beam)
        for y in (-3.0,-.7,1.6,3.9,6.2,8.5):
            dx = .14 if x < 0 else -.14
            box("Side concourse stone recess",(x+dx,y,1.94),(.13,1.92,3.54),column,radius=.06)
            box("Side gallery indirect strip",(x+1.51*dx,y,3.6),(.034,1.60,.028),stair,radius=.008)
    s.section("Recessed concourse and risers")
    box("Rear concourse wall",(0,10.14,2.59),(16,.32,5.18),beam)
    box("Frosted central reveal",(.04,9.941,2.14),(2.04,.067,2.45),warm_screen,radius=.047)
    for x in (-1.01,1.09):
        box("Warm reveal jamb",(x,9.86,2.14),(.087,.14,2.54),metal,radius=.018)
    box("Quiet amber underside at the central lintel",(.04,9.819,3.38),(2.12,.097,.095),stair,radius=.019)
    for x in (-4.65,-2.1,2.1,4.65):
        box("Rear light recess", (x,9.92,2.07),(1.77,.13,3.67),distant,radius=.052)
        for z in (.49,3.54):
            box("Recess horizontal strip", (x,9.835,z),(1.55,.058,.05),stair,radius=.011)
    for i in range(7):
        y = 7.08+i*.42
        z = .115 + i*.118
        box("Concourse rear stair",(.05,y,z/2),(2.48,.48,z),column,radius=.018)
        box("Bronze stair nosing",(.05,y-.210,z), (2.49,.031,.034),plinth,radius=.007)
    for x in (-1.2,1.3):
        s.tube("Passenger stair handrail",[(x,6.64,.78),(x,7.25,.87),(x,9.59,1.54)],.031,metal,sides=8)
        for j in range(4):
            y = 7.18+j*.7
            s.beam("Stair rail upright",(x,y,.115+j*.18),(x,y,.87+j*.19),.045,metal)
    box("Entrance wall across the forward hall",(0,-7.54,2.34),(14.2,.23,4.68),beam)
    for x in (-4.6,-2.30,0,2.3,4.6):
        box("Frosted entrance-screen recess",(x,-7.38,2.10),(1.87,.085,3.47),column,radius=.05)
        box("Amber entrance-screen lintel",(x,-7.319,3.52),(1.70,.031,.064),stair,radius=.015)


def station_lights(s):
    s.light("Red column transmitted light", "POINT", (-2.06,-1.28,2.32), "#ff8079", 125, size=.44)
    s.light("Blue column transmitted light", "POINT", (2.05,-.18,2.22), "#79cfff", 155, size=.48)
    s.light("Ceiling color wash", "AREA", (.3,1.7,5.65), "#d3b0d9", 405, target=(.0,1.1,0),size=8.6)
    s.light("Backlit passage", "AREA", (.23,9.34,3.14), "#ffcca1", 485, target=(0,3.6,.2),size=2.2,height=2.4)
    s.light("Faint entrance fill", "AREA", (1,-5.1,3.99), "#b6c4e2", 200, target=(0,.65,2.51),size=5.3)


def heart_outline(n):
    start = (0,.525)
    curves = [
        (start,(.24,1.01),(.79,1.04),(.97,.662)),
        ((.97,.662),(1.19,.235),(.68,-.323),(.21,-.765)),
        ((.21,-.765),(.121,-.842),(.037,-.914),(0,-.914)),
    ]
    right = []
    assert n % 6 == 0
    steps = n // 6
    for points in curves:
        for i in range(steps):
            t = i/steps
            weights = ((1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3)
            right.append(tuple(sum(weights[k]*points[k][axis] for k in range(4)) for axis in (0,1)))
    return [*right,(0,-.914),*[(-x,z) for x,z in reversed(right[1:])]]


def sculpted_heart(s, name, center, size, depth, rot, material, *, n=72, rows=18, faceted=False):
    rim = heart_outline(n)
    basis = Euler(rot).to_matrix()
    origin = Vector(center)
    vertices = [origin+basis @ Vector((0,-depth,.035*size))]
    for j in range(1,rows):
        a = j*pi/rows
        contour = sin(a)**.87
        for i, (x,z) in enumerate(rim):
            if faceted and j%2:
                xx,zz = rim[(i+1)%n]
                x,z = .44*x+.56*xx,.44*z+.56*zz
            vertices.append(origin+basis @ Vector((x*size*contour,-depth*cos(a),(.035+(z-.035)*contour)*size)))
    vertices.append(origin+basis @ Vector((0,depth,.035*size)))
    faces = [(0,1+i,1+(i+1)%n) for i in range(n)]
    for j in range(rows-2):
        for i in range(n):
            a = 1+j*n+i
            b = 1+j*n+(i+1)%n
            c, d = b+n, a+n
            faces.extend([(a,b,d),(b,c,d)] if faceted else [(a,b,c,d)])
    end = len(vertices)-1
    faces.extend((end,end-n+(i+1)%n,end-n+i) for i in range(n))
    return s.mesh(name,vertices,faces,material,smooth=not faceted,recalc=True)


def heart_gallery(s):
    m,box = s.material,s.box
    black = m("Blue-black polished basalt", "#131d30",rough=.20,coat=.55)
    deep = m("Navy niches", "#101b2b",rough=.47)
    frame = m("Blacked-out polished steel", "#203b4a",rough=.32,metal=.53,coat=.28)
    grid = m("Fine teal joint", "#426e76",rough=.38,glow=.18)
    seam = m("Cold light inlaid in stone", "#77ccd9",rough=.28,glow=.82)
    rose_edge = m("Rose light inlaid in stone", "#ee548e",rough=.3,glow=.95)
    rail = m("Dark pink glass ribbon", "#ae406c",rough=.25,metal=.29,coat=.41)
    rose = m("Pale rose polished glass shell", "#ffc1d5",rough=.070,glass=.92,coat=.25)
    teal = m("Pale lake blue polished glass shell", "#a8e7f4",rough=.063,glass=.92,coat=.25)
    inflatable = m("Satin pink air-filled balloon", "#f2a0b8",rough=.32,glass=.09,coat=.22,glow=.20)
    balloon_tether = m("Rose balloon tail and tether", "#d2839c",rough=.58,glow=.31)
    gleam = m("Pearl streak embedded in rose crystal","#fff0dd",rough=.26,glow=1.24)
    cyan_gleam = m("Ice streak embedded in cyan crystal","#cdffff",rough=.29,glow=1.19)
    ruby = m("Faceted raspberry core", "#f568a5",rough=.22,glass=.33,coat=.34,glow=.17)
    water = m("Faceted lake cyan core", "#3eb5c7",rough=.20,glass=.28,coat=.35,glow=.18)
    highlight = [m("Prismatic inclusions",c,rough=.19,glass=.44,coat=.42,glow=.15)
                 for c in ("#ffabca","#ffc3a0","#c94074","#66e5f1","#98e3d7","#257eb7")]
    pad = m("Floating display deck", "#273046",rough=.25,coat=.33,metal=.16)
    box("Deep blue ground", (0,2,-.15),(16,18,.285),black)
    for i in range(-12,13):
        p = i*.54
        box("Grid inlaid in navy ground", (p,2,.001),(.011,14,.014),grid)
        box("Grid inlaid in navy ground", (0,1.6+p,.001),(13,.011,.014),grid)
    for i in range(7):
        x = (i-3)*1.77
        box("Dark glazed rib recess",(x,5.68,2.87),(1.72,.25,5.74),deep,radius=.071)
        box("Vertical shadow seam",(x-.77,5.43,2.88),(.12,.38,5.72),frame,radius=.041)
        box("Incised signal line",(x-.67,5.217,2.86),(.013,.015,5.49),grid)
    for i in range(14):
        z = .35 + i*.33
        box("Dark blue back wall grid",(0,5.24,z),(12,.01,.012),grid)
    s.section("Ring dais and glass ribbons")
    s.cylinder("Dark oval dais foundation",(0,.49,.086),2.23,.173,pad,segments=64,bevel=.041)
    s.ring("Blue luminous seam around the dais",(0,.49,.116),(2.205,2.205),.020,seam,segments=72)
    s.cylinder("Black mirror dais",(0,.49,.183),2.14,.07,black,segments=64,bevel=.015)
    for i,(center,radii,rotation,material) in enumerate([
        ((.39,.45,1.86),(2.59,1.36),(.19,-.55,.52),rail),
        ((.43,.56,1.96),(2.62,1.38),(.19,-.55,.52),rose_edge),
        ((-.40,-.25,1.26),(2.15,1.33),(-.24,.32,-.29),frame),
        ((-.34,-.26,1.34),(2.12,1.30),(-.24,.32,-.29),seam),
    ]):
        s.ring("Sloping orbit-mounted support ribbon",center,radii,.048 if i%2==0 else .012,material,
               segments=96,rotation=rotation)
        if i%2 == 0:
            for a in (2.67,5.25):
                tip = Vector(center)+Euler(rotation).to_matrix() @ Vector((radii[0]*cos(a),radii[1]*sin(a),0))
                x,y = tip.x*.72,.49+(tip.y-.49)*.72
                s.cylinder("Orbit rail anchoring foot",(x,y,.243),.11,.064,frame,segments=16)
                s.beam("Tension stay from the base",(x,y,.253),tip,.017,frame)
    s.section("Rose and lake blue suspended hearts")
    hearts = [
        ((.65,.54,2.55),1.11,.44,(-.10,-.18,-.25),rose,ruby,0),
        ((-.71,-.48,1.43),.84,.335,(.14,.28,.18),teal,water,3),
        ((1.84,1.78,1.88),.43,.18,(.30,-.36,-.03),rose,ruby,0),
        ((-.87,1.72,2.57),.46,.19,(.09,.29,-.46),teal,water,3),
        ((-1.72,.75,2.55),.40,.17,(.05,-.12,-.15),inflatable,None,0),
    ]
    for index,(coords,size,depth,rot,shell,interior,offset) in enumerate(hearts):
        sculpted_heart(s, "Closed polished heart shell",coords,size,depth,rot,shell,n=72 if index<2 else 48,rows=19 if index<2 else 14)
        basis = Euler(rot).to_matrix()
        origin = Vector(coords)
        if interior is None:
            start = origin+basis @ Vector((0,0,-.903*size))
            end = Vector((-1.67,.72,.22))
            knot = start+Vector((-.005,.005,-.045))
            s.orb("Pinched neck of the pink heart balloon",knot,(.046,.040,.044),inflatable,segments=16,rings=10)
            s.tube("High tensile filament above glass",[start,knot,start.lerp(end,.24)+Vector((-.15,0,0)),
                   start.lerp(end,.60)+Vector((.075,.01,0)),end],.011,balloon_tether,sides=8)
            s.cylinder("Balloon tether weight",(-1.67,.72,.245),.088,.068,pad,segments=24,bevel=.014)
            continue
        core_pos = origin + basis @ Vector((0,.08*size,-.032*size))
        core = sculpted_heart(s, "Suspended faceted heart core",core_pos,size*.76,depth*.61,rot,interior,n=30,rows=8,faceted=True)
        for material in highlight[offset:offset+3]:
            core.data.materials.append(material)
        for polygon in core.data.polygons:
            polygon.material_index = s.rng.choices([0,1,2,3],[30,10,4,8])[0]
        if index < 2:
            outline = heart_outline(72)
            for arc, width in ((outline[5:16],.010),(outline[52:66],.007)):
                line = [origin+basis @ Vector((.87*size*x,-depth*.34,.87*size*z+.01*size)) for x,z in arc]
                s.tube("Subsurface gleam along a cut heart edge",line,width,gleam if index==0 else cyan_gleam,sides=7)
        for j in range(6):
            x = s.rng.uniform(-.34,.34)*size
            z = s.rng.uniform(-.23,.32)*size
            loc = origin + basis @ Vector((x,-.47*depth,z))
            radius = s.rng.uniform(.035,.073)*size
            s.orb("Shard in depth inside the glass",loc,(radius,radius*.63,radius*1.64),highlight[offset+j%3],
                  facets=True,rotation=(.20,.4*j,.27*j))
        start = origin + basis @ Vector((.56*size,0,.755*size))
        end = (start.x,start.y,5.40)
        s.tube("High tensile filament above glass", [start,end], .006, frame,sides=5)
        s.beam("Suspension truss at ceiling",(start.x,-1.45,5.41),(start.x,5.5,5.41),.057,frame)
    s.section("Light wells and prism debris")
    for side,material in [(-1,seam),(1,rose_edge)]:
        for i in range(4):
            x = side*(2.26+i*.40)
            s.beam("Light strip down the glass hall",(x,1.90,.017),(x+side*.48,4.86+i*.14,.017),
                   .015,material)
        box("Tall light well in opposite wings",(side*4.76,4.90,2.68),(.068,.093,4.63),material,radius=.024)
    for i in range(38):
        a = i*2.39996
        r = s.rng.uniform(1.1,2.8)
        x,y,z = cos(a)*r, .8+sin(a)*r, s.rng.uniform(.21,3.96)
        if (x-.64)**2+(y-.54)**2+(z-2.55)**2<1.41 or (x+.71)**2+(y+.48)**2+(z-1.43)**2<.78:
            continue
        radius = s.rng.uniform(.018,.055)
        s.orb("Slivers hung along the orbit", (x,y,z), (radius,radius*.51,radius*2.1), highlight[i%6],
              facets=True,rotation=(a,a*.27,a))


def heart_lights(s):
    s.light("White band in the rose shell", "AREA",(-1.57,-3.55,4.72),"#ffe5de",555,target=(.6,.54,2.56),size=.55,height=4.1)
    s.light("White band in the lake shell", "AREA",(2.71,-2.69,3.65),"#d6f8ff",550,target=(-.55,-.42,1.49),size=.37,height=3.61)
    s.light("Rose gallery rim", "AREA",(2.85,2.75,3.28),"#ff76ba",765,target=(.1,.14,1.98),size=2.0,height=3.0)
    s.light("Blue gallery rim", "AREA",(-3.0,1.55,3.55),"#71daff",615,target=(-.5,.0,1.91),size=1.8,height=3.6)
    s.light("Narrow top panel", "AREA",(.0,.52,5.36),"#efe0f1",460,target=(0,.47,.17),size=3.0,height=.72)
    s.light("Lavender from a side entrance", "AREA",(4,1.6,3.7),"#a089d6",185,target=(.5,1.6,2.2),size=2.2)
    s.light("Small honey spotlight between the cut hearts","AREA",(-.21,-1.41,3.44),"#ffcc8d",80,
            target=(.36,.31,2.23),size=.46)


def rooms(frame, look):
    return {
        "2024-55": dict(
            build=print_room,lights=print_lights,world=.33,
            look=look("#acbfbd","#f8f4e9","#dce9f4","#9caaa9",near=9,far=25,energy=2.30,bounce=.95,ambient=1.18),
            views=[
                frame("出紙口","窗下左邊是酒紅文件夾，右邊是深藍影印機和機頂紙疊。", (1.72,-4.86,2.39),(-1.03,-.03,1.76),40,54),
                frame("窗邊側面","沿通風格柵側板看前景紙、文件夾與機頂紙疊的前後距離。",(-3.92,-2.88,2.91),(-.11,.64,1.74),43,55),
            ],
            inspect=frame("窗後側向","",(3.94,3.64,4.88),(.35,1.04,1.32),52),
        ),
        "2024-23": dict(
            build=alley,lights=alley_lights,world=.20,
            look=look("#343f46","#f2d1a0","#a6bfcb","#676b70",near=7,far=21,energy=1.85,bounce=.90,ambient=1.26),
            views=[
                frame("斜望燈巷","左上圓燈與弧棚、右側車窗沿窄月台向後收束。",(.36,-3.05,1.69),(-.12,2.08,1.73),48,51),
                frame("石衣背側","從石塑背後回望，車側、石塑和吊燈之間可讀出通道寬度。", (1.53,4.85,1.92),(-.48,.44,1.56),51,55),
            ],
            inspect=frame("側向俯檢","",(1.42,5.7,6.4),(.10,1.6,1.10),57),
        ),
        "2024-18-4": dict(
            build=flower_stage,lights=flower_lights,world=.30,
            look=look("#c6aebc","#fff1e2","#c3eef4","#c1adb5",near=9,far=25,energy=1.99,bounce=.82,ambient=1.17),
            views=[
                frame("花台前緣","從玫瑰和白花冠掃過交叉白手套，落在右邊的桃青晶泡。",(.0,-6.46,2.67),(-.03,1.10,2.20),40,54),
                frame("晶泡與光盤側面","從側翼分辨前層晶泡、花與手套、後層放射光盤的實體距離。",(4.86,-3.19,3.15),(.06,1.29,2.10),46,58),
            ],
            inspect=frame("舞台後側","",(5.38,3.80,4.39),(.0,1.21,1.91),51),
        ),
        "2024-28": dict(
            build=station,lights=station_lights,world=.22,
            look=look("#222439","#ffe5cf","#b7d8ff","#636674",near=10,far=30,energy=1.80,bounce=.84,ambient=1.06),
            views=[
                dict(frame("紅藍主軸","由紅藍柱基的彩色反照，沿中央暖光望進後方通道。",(.02,-6.60,1.64),(.02,.93,2.78),52,61), orbitDistance=4.8),
                frame("藍柱後仰望","從柱後斜仰看藍柱的弧面、錯位紅柱和跨過兩柱的拱形格棚。",(-2.01,6.66,1.59),(.01,1.10,2.99),58,67),
            ],
            inspect=frame("雙柱與格棚側向","",(6.50,6.78,3.88),(-.24,1.28,2.9),55),
        ),
        "2024-52": dict(
            build=heart_gallery,lights=heart_lights,world=.25,
            look=look("#15233b","#fff1df","#beefff","#394b61",near=8,far=24,energy=1.50,bounce=.80,ambient=.98),
            views=[
                frame("玫紅與湖青","沿粉／青對角看兩枚晶心，左側浮著一顆牽繩的粉色心形氣球。",(.42,-6.06,2.60),(-.11,.44,1.99),40,54),
                frame("晶心與氣球厚度","繞到斜側，比對玻璃晶心的切面、氣球的圓薄側影和後方繫繩。",(4.21,-3.86,3.06),(-.02,.58,2.00),46,57),
            ],
            inspect=frame("查驗玻璃背面","",(4.89,4.67,4.56),(.02,.50,1.77),48),
        ),
    }
