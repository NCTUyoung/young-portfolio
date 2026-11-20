"""Color the supplied flower-stage and crystal-gallery sculpts."""

from math import cos, radians, sin

import numpy as np

from palette_23 import projection, soft_contour


SOURCE_SHA = {
    "2024-18-4": "91fd8b5c2634f4313b8e8238baecce2a7e33ddd23a5fb68fd5015ca82ac0db75",
    "2024-52": "6183e07daafd26529d4761d3a6a1d91bd25b01f3215fd07e382381d37a057407",
}


def scoped(points, color, slug):
    x,y,z = points.T
    sx,sy = projection(points,3.63,1.18,.98,34)
    colors = np.ones((len(points),4),dtype=np.float32)
    colors[:,:3] = color("#eee0db" if slug=="2024-18-4" else "#ded4d6")

    def lay(weight, hue):
        a = np.clip(weight,0,1)[:,None]
        colors[:,:3] = colors[:,:3]*(1-a)+np.array(color(hue))*a

    def region(points, edge=2.6):
        return soft_contour(sx,sy,points,edge)

    if slug=="2024-18-4":
        hair = (z>1.13)&((y>.02)|(abs(x)>.122))
        hair |= z>1.57
        lay(hair,"#94717b")
        face = region([(294,134),(317,124),(340,131),(354,143),(351,158),
                       (339,174),(323,180),(309,173),(299,159)],3)
        lay(face*np.clip((.085-y)/.045,0,1),"#e0baae")
        shoulders = region([(278,201),(301,207),(307,177),(326,179),(338,173),(353,203),
                            (377,205),(386,222),(360,229),(326,224),(294,229),(267,216)],3.4)
        lay(shoulders*np.clip((.10-y)/.06,0,1),"#dcb2a6")
        arms = np.maximum(region([(254,272),(278,263),(289,279),(280,297),(265,309),(254,303)]),
                          region([(371,264),(388,263),(398,288),(395,305),(371,314),(362,302)]))
        lay(arms*np.clip((.11-y)/.04,0,1),"#d8aca4")
        crown = region([(269,111),(281,99),(302,89),(323,85),(348,88),
                        (373,99),(379,123),(356,117),(331,113),(305,117),(276,133)],2.1)
        lay(crown*np.clip((.15-y)/.11,0,1),"#ece2c5")
        leaf = region([(260,124),(267,113),(283,109),(290,116),(288,130),(268,143)],1.5)
        lay(leaf*np.clip((.13-y)/.08,0,1),"#96a28b")
        ribbon = region([(346,324),(366,312),(396,316),(404,327),(397,339),(371,340),
                         (380,382),(378,430),(363,410),(360,363),(348,346)],2.3)
        lay(ribbon*np.clip((.18-y)/.08,0,1),"#d7a1a8")
        leg = np.clip((sy-575)/12,0,1)*np.clip((z-.095)/.04,0,1)
        lay(leg,"#dfb9ae")
        lay(np.clip((.084-z)/.026,0,1),"#e6dad0")
        return colors, {}

    seat = (z < .44)&(y > -.16)
    lay(seat,"#525261")
    lay((z<.24)&~seat,"#afa6b4")
    hair = (z>1.39)&((y>.01)|(abs(x-.035)>.112))
    hair |= z>1.64
    lay(hair,"#b6a7b4")
    lay(z>1.686,"#eee3e2")
    face = region([(268,183),(292,170),(319,170),(348,180),(349,213),
                   (333,238),(313,250),(291,244),(270,220),(263,202)],3.5)
    lay(face*np.clip((.105-y)/.053,0,1),"#dfb7a9")
    left_arm = region([(203,337),(225,300),(243,276),(255,249),(268,231),(284,248),
                       (274,281),(255,305),(237,346),(214,372),(193,371)],3.1)
    right_arm = region([(335,265),(356,269),(361,320),(356,357),(380,389),
                        (412,419),(445,415),(458,425),(461,443),(437,457),
                        (405,449),(376,427),(345,400),(321,370),(325,319)],3.0)
    lay(np.maximum(left_arm,right_arm)*np.clip((.20-y)/.065,0,1),"#deafa4")
    legs = region([(202,399),(228,379),(259,388),(287,422),(302,471),(306,508),
                   (336,506),(380,484),(433,489),(468,514),(472,542),(452,567),
                   (394,578),(337,571),(309,562),(283,588),(259,568),(242,523),
                   (222,477),(200,447)],3.5)
    lay(legs*np.clip((.22-y)/.07,0,1),"#dcb2aa")
    lay(seat,"#525261")
    base_vertices = points[(y>.015)&(z<.13)]
    contact = {"seatBottom":float(base_vertices[:,2].min())} if len(base_vertices) else {}
    return colors,contact


def paint(studio, objects, anchor, height, yaw, slug):
    from build_2024 import color

    material = studio.material("Sculpted stage pigments", "#ffffff",rough=.58,coat=.09)
    shader = material.node_tree.nodes.get("Principled BSDF")
    tint = material.node_tree.nodes.new("ShaderNodeVertexColor")
    tint.layer_name = "Stage pigments"
    material.node_tree.links.new(tint.outputs["Color"],shader.inputs["Base Color"])
    contact = {}
    for obj in objects:
        mesh = obj.data
        coords = np.empty(len(mesh.vertices)*3,dtype=np.float32)
        mesh.vertices.foreach_get("co",coords)
        points = (coords.reshape(-1,3)-np.array(anchor))*(1.84/height)
        x,y = points[:,0].copy(),points[:,1].copy()
        c,s = cos(radians(yaw)),sin(radians(yaw))
        points[:,0] = c*x+s*y
        points[:,1] = -s*x+c*y
        colors,touch = scoped(points,color,slug)
        contact.update({name:offset*height/1.84 for name,offset in touch.items()})
        if slug=="2024-18-4":
            for side in (-1,1):
                foot = (side*points[:,0]>.035)&(points[:,2]<.14)
                if np.any(foot):
                    contact[f"side{side}"]=float(points[foot,2].min()*height/1.84)
        attribute = mesh.color_attributes.get("Stage pigments")
        if attribute is None:
            attribute = mesh.color_attributes.new(name="Stage pigments",type="BYTE_COLOR",domain="POINT")
        attribute.data.foreach_set("color",colors.ravel())
        mesh.color_attributes.active_color = attribute
        mesh.materials.clear()
        mesh.materials.append(material)
    return {"method":"authored sculpt pigments","contactRegions":contact}
