"""Color regions authored from the supplied 23 Tripo sculpt's head and hand views."""

from math import cos, radians, sin, tan

import numpy as np


SOURCE_SHA = "6a2fa7bad9b1ed5f9f5af76a3161dfa8efb8b6ac3888a537e5feb66c0e102cf4"


def projection(points, distance, height, target_z, fov):
    # The two inspection cameras face the unrotated GLB at its 1.84-unit height.
    forward = np.array([0,distance,target_z-height])
    forward /= np.linalg.norm(forward)
    up = np.array([0,-forward[2],forward[1]])
    delta = points - [0,-distance,height]
    length = delta @ forward
    focal = 375/tan(radians(fov)/2)
    return 325+focal*delta[:,0]/length,375-focal*(delta @ up)/length


def contour(x, y, outline):
    inside = np.zeros(len(x), dtype=bool)
    for (a,b),(c,d) in zip(outline,outline[1:]+outline[:1],strict=True):
        if b != d:
            inside ^= ((b>y)!=(d>y)) & (x<(c-a)*(y-b)/(d-b)+a)
    return inside


def soft_contour(x, y, outline, edge):
    distance2 = np.full(len(x), np.inf)
    for (a,b),(c,d) in zip(outline,outline[1:]+outline[:1],strict=True):
        dx,dy = c-a,d-b
        portion = np.clip(((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy),0,1)
        distance2 = np.minimum(distance2,(x-a-dx*portion)**2+(y-b-dy*portion)**2)
    signed = np.where(contour(x,y,outline),1,-1)*np.sqrt(distance2)
    return np.clip(.5+signed/(2*edge),0,1)


def paint(studio, objects, anchor, height, yaw):
    from build_2024 import color

    mat = studio.material("23 | slate cloth and warm plaster pigments", "#ffffff",rough=.67,coat=.06)
    tree = mat.node_tree
    attribute = tree.nodes.new("ShaderNodeVertexColor")
    attribute.layer_name = "Portrait pigments"
    tree.links.new(attribute.outputs["Color"],tree.nodes.get("Principled BSDF").inputs["Base Color"])
    shoes = []
    for obj in objects:
        mesh = obj.data
        coords = np.empty(len(mesh.vertices)*3,dtype=np.float32)
        mesh.vertices.foreach_get("co",coords)
        points = (coords.reshape(-1,3)-np.array(anchor))*(1.84/height)
        angle = radians(yaw)
        x,y = points[:,0].copy(),points[:,1].copy()
        points[:,0] = cos(angle)*x+sin(angle)*y
        points[:,1] = -sin(angle)*x+cos(angle)*y
        z = points[:,2]
        y = points[:,1]
        x0,y0 = projection(points,3.63,1.18,.98,34)
        x1,y1 = projection(points,2.3,1.48,1.41,27)
        colors = np.full((len(points),4),1,dtype=np.float32)
        colors[:,:3] = color("#3c484e")
        colors[z<.35,:3] = color("#383d43")
        colors[z<.158,:3] = color("#272c31")
        colors[z>1.22,:3] = color("#3c4549")
        colors[z>1.57,:3] = color("#2b2b30")
        colors[(z>1.64)&(y>.085),:3] = color("#24282c")
        face = soft_contour(x1,y1,[(290,156),(307,138),(321,136),(338,145),(353,160),(369,174),
                                   (374,194),(372,211),(361,229),(351,239),(346,252),(332,267),
                                   (315,270),(301,263),(290,249),(280,228),(277,207),(276,183)],3.2)
        face *= np.clip((.035-y)/.038,0,1)
        colors[:,:3] = colors[:,:3]*(1-face[:,None])+np.array(color("#c7aa9b"))*face[:,None]
        collar = contour(x1,y1,[(299,258),(323,274),(343,275),(328,314),(298,353),(281,367),
                                (284,344),(298,308),(287,287)]) & (y<.025)
        colors[collar,:3] = color("#b4aaa0")
        palm = contour(x1,y1,[(396,256),(446,251),(462,284),(476,317),(470,370),(451,404),
                              (403,397),(382,371),(330,363),(320,339),(349,317),(387,293)]) & (y<-.168)
        lowered_hand = contour(x0,y0,[(223,399),(238,392),(247,398),(249,422),(244,436),(238,449),(218,435)]) & (y<.13)
        colors[palm | lowered_hand,:3] = color("#ceb3a5")
        flower = (((x1-396)/11)**2+((y1-147)/12)**2<1) & (y<-.025)
        colors[flower,:3] = color("#d9ccc0")
        attribute = mesh.color_attributes.get("Portrait pigments")
        if attribute is None:
            attribute = mesh.color_attributes.new(name="Portrait pigments",type="BYTE_COLOR",domain="POINT")
        attribute.data.foreach_set("color",colors.ravel())
        mesh.color_attributes.active_color = attribute
        mesh.materials.clear()
        mesh.materials.append(mat)
        for side in (-1,1):
            valid = (points[:,0]*side>.045)&(z<.20)
            if np.any(valid):
                shoes.append(float(z[valid].min()*height/1.84))
    return {"method":"hand-authored regions on the supplied sculpt", "soleOffsets":shoes}
