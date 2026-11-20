"""Material regions on the supplied archivist, including the folio and papers in hand."""

from math import cos, radians, sin

import numpy as np

from palette_23 import projection, soft_contour


SOURCE_SHA = "ca98fd0926b962401923a8450cc68bdbaffbdd0fd4b3e4becf07e8d1c71143f1"


def paint(studio, objects, anchor, height, yaw):
    from build_2024 import color

    material = studio.material("55 | ink, ivory linen and oxblood bookcloth", "#ffffff",rough=.58,coat=.10)
    shader = material.node_tree.nodes.get("Principled BSDF")
    tint = material.node_tree.nodes.new("ShaderNodeVertexColor")
    tint.layer_name = "Archivist pigments"
    material.node_tree.links.new(tint.outputs["Color"], shader.inputs["Base Color"])
    contact = {}
    for obj in objects:
        mesh = obj.data
        coords = np.empty(len(mesh.vertices)*3,dtype=np.float32)
        mesh.vertices.foreach_get("co",coords)
        points = (coords.reshape(-1,3)-np.array(anchor))*(1.84/height)
        yaw_cos,yaw_sin = cos(radians(yaw)),sin(radians(yaw))
        x,y = points[:,0].copy(),points[:,1].copy()
        points[:,0] = yaw_cos*x+yaw_sin*y
        points[:,1] = -yaw_sin*x+yaw_cos*y
        x,y,z = points.T
        x0,y0 = projection(points,3.63,1.18,.98,34)
        x1,y1 = projection(points,2.3,1.48,1.41,27)
        colors = np.ones((len(points),4),dtype=np.float32)
        colors[:,:3] = color("#353843")
        legs = np.clip((y0-611)/8,0,1)*np.clip((.44-z)/.026,0,1)
        colors[:,:3] = colors[:,:3]*(1-legs[:,None])+np.array(color("#b7a29d"))*legs[:,None]
        colors[z<.154,:3] = color("#302c33")
        colors[(z>1.172) | ((x<-.185)&(z>.974)),:3] = color("#dfd8cd")
        colors[z>1.554,:3] = color("#38363c")
        scarf = (z>1.433)&(z<1.575)&(y>-.30)
        bands = np.clip(.48+.50*np.cos((z[scarf]-1.44)*138+.7*y[scarf]),0,1)
        colors[scarf,:3] = np.array(color("#736d72"))*(1-bands[:,None])+np.array(color("#a19b9d"))*bands[:,None]

        def lay(weight, hue):
            weights = weight[:,None]
            colors[:,:3] = colors[:,:3]*(1-weights)+np.array(color(hue))*weights

        folder = soft_contour(x0,y0,[(224,337),(244,327),(266,321),(280,329),(279,408),
                                     (273,419),(220,436),(213,420)],2.6)
        lay(folder*np.clip((.20-y)/.045,0,1),"#854451")
        spine = soft_contour(x0,y0,[(264,327),(275,327),(278,411),(269,420),(264,412)],1.8)
        lay(spine*np.clip((.20-y)/.04,0,1),"#a66b69")
        paper = soft_contour(x0,y0,[(359,332),(365,316),(390,274),(420,255),(442,245),
                                    (458,257),(451,270),(418,291),(397,316),(369,342)],2.0)
        lay(paper*np.clip((.12-y)/.04,0,1),"#f4eee0")
        left_hand = soft_contour(x0,y0,[(210,394),(228,392),(232,410),(229,433),(215,433),(207,425)],2.3)
        right_hand = soft_contour(x0,y0,[(376,313),(384,300),(394,294),(408,293),(420,301),
                                         (416,313),(407,324),(388,325),(375,324)],2.6)
        lay(np.maximum(left_hand,right_hand)*np.clip((.15-y)/.04,0,1),"#d3b6a7")
        face = soft_contour(x1,y1,[(304,175),(324,163),(347,169),(368,181),(389,184),(410,202),
                                   (408,226),(391,237),(377,252),(352,277),(334,266),
                                   (320,254),(307,236),(298,211),(299,190)],3.4)
        lay(face*np.clip((.036-y)/.044,0,1),"#d4b7a5")
        for gx,gy,rx,ry in ((326,192,25,20),(387,212,30,20)):
            rim = np.sqrt(((x1-gx)/rx)**2+((y1-gy)/ry)**2)
            lay(np.clip((.16-abs(1-rim))/.13,0,1)*np.clip((.01-y)/.041,0,1)*.70,"#5f585f")
        lanyard = soft_contour(x0,y0,[(323,229),(328,229),(333,311),(328,314),
                                      (325,275),(326,256)],1.8)
        lay(lanyard*np.clip((.03-y)/.05,0,1),"#44566b")
        badge = soft_contour(x0,y0,[(318,313),(349,316),(348,341),(317,337)],2)
        lay(badge*np.clip((.068-y)/.04,0,1),"#e5ddd2")
        attribute = mesh.color_attributes.get("Archivist pigments")
        if attribute is None:
            attribute = mesh.color_attributes.new(name="Archivist pigments",type="BYTE_COLOR",domain="POINT")
        attribute.data.foreach_set("color",colors.ravel())
        mesh.color_attributes.active_color = attribute
        mesh.materials.clear()
        mesh.materials.append(material)
        for name,region in (("nearShoe",y<-.04),("farShoe",y>.07)):
            if np.any(region & (z<.22)):
                contact[name] = float(z[region & (z<.22)].min()*height/1.84)
    return {"method":"authored sculpt pigments", "groundRegionOffsets":contact}
