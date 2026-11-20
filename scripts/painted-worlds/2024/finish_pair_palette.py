"""Pigment masks traced on the matching 800 px orthographic Tripo clay renders."""

import numpy as np


def region(x, y, outline, feather=4):
    """Raster-style polygon coverage evaluated at the sculpt's actual vertices."""
    inside = np.zeros(len(x), dtype=bool)
    distance = np.full(len(x), np.inf)
    for (ax, ay), (bx, by) in zip(outline, (*outline[1:], outline[0]), strict=True):
        dx, dy = bx - ax, by - ay
        if dy:
            inside ^= ((y > ay) != (y > by)) & (x < ax + (y - ay) * dx / dy)
        t = np.clip(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1)
        distance = np.minimum(distance, np.hypot(x - ax - t * dx, y - ay - t * dy))
    return np.clip(.5 + np.where(inside, distance, -distance) / feather, 0, 1)


def ramp(value, low, high):
    return np.clip((value - low) / (high - low), 0, 1)


def pigments_18(paint, x, depth, v):
    front = lambda polygon, feather=4: region(x, v, polygon, feather)
    side = lambda polygon, feather=4: region(depth, v, polygon, feather)
    facing = 1 - ramp(depth, 412, 438)
    hair = side([(396, 30), (554, 26), (562, 355), (496, 390), (443, 377),
                 (442, 331), (428, 300), (434, 258), (449, 227), (448, 203),
                 (437, 174), (415, 167), (409, 130), (398, 110), (388, 87)], 7)
    hair = np.maximum(hair, front([(318, 31), (465, 32), (480, 206), (464, 199),
                                   (442, 201), (439, 179), (457, 153), (450, 112),
                                   (427, 109), (416, 119), (404, 111), (389, 107),
                                   (370, 94), (358, 135), (354, 164), (371, 178),
                                   (388, 190), (370, 206), (359, 188), (338, 198),
                                   (319, 232), (313, 265), (326, 338), (313, 365),
                                   (258, 350), (253, 227), (300, 159)], 5))
    paint("#9b6a65", hair)
    paint("#be8d81", hair * ramp(v, 120, 355) * (1 - ramp(depth, 472, 526)) * .48)
    face = front([(360, 109), (371, 96), (385, 105), (405, 108), (422, 115),
                  (437, 102), (444, 123), (434, 140), (418, 154), (429, 174),
                  (446, 167), (464, 185), (469, 202), (449, 199), (427, 198),
                  (405, 197), (383, 200), (369, 201), (359, 193), (331, 205),
                  (331, 188), (345, 171), (368, 179), (378, 184), (379, 149),
                  (366, 138)], 5)
    paint("#e6ac93", face * facing)
    left_arm = front([(321, 242), (337, 239), (349, 244), (345, 270), (371, 260),
                      (375, 268), (380, 280), (363, 289), (337, 300), (320, 299), (316, 286)])
    right_arm = front([(458, 241), (472, 239), (478, 257), (490, 282), (486, 295),
                       (450, 302), (445, 282), (459, 277), (457, 260)])
    paint("#e4a78e", np.maximum(left_arm, right_arm) * (1 - ramp(depth, 416, 433)))
    top_glove = front([(371, 262), (390, 254), (404, 242), (413, 229), (432, 227),
                       (435, 234), (451, 226), (448, 239), (444, 254), (431, 266),
                       (410, 277), (393, 287), (377, 282)], 3)
    lower_glove = front([(450, 275), (452, 294), (425, 300), (408, 307), (392, 319),
                         (371, 316), (371, 305), (386, 295), (401, 280), (424, 275)], 3)
    paint("#fff5ef", np.maximum(top_glove, lower_glove) * (1 - ramp(depth, 368, 387)))
    bow = front([(443, 300), (459, 296), (487, 307), (494, 327), (483, 339),
                 (462, 322), (475, 343), (496, 367), (510, 424), (494, 418),
                 (473, 376), (461, 382), (464, 417), (462, 444), (447, 432),
                 (456, 408), (444, 353), (445, 327), (430, 340), (418, 331), (426, 310)], 5)
    paint("#d99a94", bow * (1 - ramp(depth, 402, 430)))
    leg = np.maximum(ramp(v, 601, 619), front([(359, 590), (412, 580), (418, 618),
                                               (383, 637), (356, 615)], 5) * (1 - ramp(depth, 389, 421)))
    paint("#e4ae97", leg)
    shoe_line = np.interp(depth, [330, 363, 390, 429, 470], [711, 704, 721, 740, 744])
    paint("#e4cfc5", ramp(v - shoe_line, -3, 3))
    crown = front([(320, 101), (324, 83), (333, 65), (346, 50), (358, 57), (371, 55),
                   (379, 45), (392, 46), (400, 53), (418, 49), (427, 55), (436, 44),
                   (445, 42), (458, 48), (463, 65), (458, 76), (466, 93),
                   (443, 88), (434, 83), (423, 79), (406, 82), (393, 75),
                   (373, 79), (366, 86), (352, 93), (341, 92), (327, 111)], 4)
    paint("#829567", crown * (1 - ramp(depth, 432, 459)))
    for cx, cy, rx, ry in [(344, 79, 13, 13), (383, 68, 13, 10), (419, 66, 11, 11), (447, 63, 12, 15)]:
        radius = np.hypot((x - cx) / rx, (v - cy) / ry)
        visible = 1 - ramp(depth, 411, 440)
        paint("#fff1da", (1 - ramp(radius, .81, 1.08)) * visible)
        paint("#dfa86b", (1 - ramp(radius, .19, .35)) * visible)
    for cx, cy, bend in [(384, 113, .16), (425, 112, -.12)]:
        line = cy + bend * (x - cx) - .025 * (x - cx) ** 2
        paint("#704949", (1 - ramp(abs(v - line), .7, 2.9))
              * (1 - ramp(abs(x - cx), 8, 13)) * (1 - ramp(depth, 384, 405)) * .76)


def pigments_52(paint, x, depth, v):
    front = lambda polygon, feather=4: region(x, v, polygon, feather)
    hair = front([(248, 253), (239, 170), (273, 132), (288, 102), (319, 80),
                  (353, 72), (381, 76), (441, 99), (463, 126), (464, 184),
                  (492, 210), (478, 249), (446, 257), (421, 249), (405, 238),
                  (382, 237), (337, 248)], 6)
    paint("#c6b39b", hair)
    paint("#ead7b8", hair * (1 - ramp(depth, 511, 602)) * .56)
    bow = front([(335, 34), (354, 36), (378, 49), (394, 71), (409, 77), (427, 79),
                 (475, 79), (478, 98), (464, 130), (449, 132), (429, 114),
                 (408, 102), (391, 91), (366, 93), (336, 90)], 5)
    paint("#f6e8d7", bow * (1 - ramp(depth, 538, 584)))
    face = front([(331, 152), (343, 138), (355, 156), (379, 151), (393, 165),
                  (406, 162), (421, 157), (425, 177), (422, 191), (403, 217),
                  (386, 232), (379, 255), (354, 270), (326, 283), (308, 275),
                  (321, 248), (316, 227), (330, 209), (348, 205), (340, 189)], 5)
    paint("#e9b59e", face * (1 - ramp(depth, 473, 495)))
    near_arm = front([(245, 273), (261, 250), (276, 246), (297, 247), (308, 229),
                      (313, 213), (338, 203), (356, 207), (354, 237), (361, 250),
                      (344, 265), (325, 284), (318, 307), (295, 336), (266, 373),
                      (248, 384), (231, 367), (233, 343)], 4)
    far_arm = front([(398, 263), (420, 241), (436, 252), (446, 277), (443, 315),
                     (438, 352), (437, 380), (455, 404), (495, 446), (520, 435),
                     (550, 423), (567, 432), (572, 462), (550, 478), (533, 472),
                     (510, 486), (484, 477), (453, 450), (427, 422), (405, 398),
                     (393, 359), (381, 311), (387, 281)], 6)
    paint("#e3aa94", np.maximum(near_arm * (1 - ramp(depth, 464, 512)),
                                far_arm * (1 - ramp(depth, 514, 575))))
    raised_leg = front([(259, 405), (275, 380), (302, 374), (329, 389), (344, 413),
                        (364, 440), (379, 471), (382, 492), (362, 523), (355, 540),
                        (368, 570), (350, 581), (322, 587), (310, 564), (289, 522),
                        (270, 475), (253, 440)], 5)
    folded_leg = front([(394, 556), (426, 546), (452, 532), (507, 498),
                        (549, 504), (571, 522), (575, 550), (551, 576), (507, 592),
                        (467, 603), (421, 600), (393, 597)], 6)
    paint("#e1ab97", np.maximum(raised_leg, folded_leg) * (1 - ramp(depth, 481, 515)))
    socks = front([(304, 578), (351, 567), (365, 566), (388, 556), (401, 563),
                   (402, 595), (370, 598), (388, 630), (369, 642), (335, 650),
                   (321, 624), (302, 607)], 6)
    paint("#b6b2b4", socks * (1 - ramp(depth, 382, 420)))
    paint("#e7ceac", front([(392, 245), (410, 242), (402, 263), (389, 289), (385, 315),
                           (398, 350), (397, 378), (416, 419), (450, 451), (458, 479),
                           (480, 498), (474, 510), (458, 504), (443, 485), (433, 458),
                           (402, 432), (385, 402), (388, 376), (382, 345), (376, 311),
                           (378, 285)], 5) * (1 - ramp(depth, 491, 526)))
    paint("#ded2c2", front([(227, 595), (263, 568), (303, 582), (318, 601),
                           (320, 634), (285, 653), (232, 662), (219, 642)], 5)
          * (1 - ramp(depth, 406, 449)))
    paint("#e5dbce", front([(335, 628), (368, 614), (392, 629), (416, 654),
                           (432, 701), (448, 761), (330, 770), (326, 711)], 6)
          * (1 - ramp(depth, 292, 328)))
    seat = region(x, depth, [(226, 395), (496, 296), (575, 547), (300, 642)], 7)
    paint("#29334a", ramp(v, 591, 608) * seat)
    for cx, cy, radius in [(374, 168, 10), (413, 180, 9)]:
        eye = np.hypot((x - cx), (v - cy) * 1.60)
        paint("#666167", (1 - ramp(eye, radius * .68, radius)) * (1 - ramp(depth, 473, 494)))
        iris = np.hypot((x - cx + 1), v - cy)
        paint("#817b84", (1 - ramp(iris, 3, 5)) * (1 - ramp(depth, 473, 491)))
    for cx, cy in [(359, 185), (410, 202)]:
        heart = front([(cx, cy - 2), (cx - 4, cy - 6), (cx - 8, cy - 4), (cx - 7, cy + 1),
                       (cx, cy + 7), (cx + 7, cy + 1), (cx + 7, cy - 4), (cx + 3, cy - 6)], 3)
        paint("#db8c98", heart * (1 - ramp(depth, 466, 485)))


def paint_actor(studio, actor, config, color):
    is_flower = config["slug"] == "2024-18-4"
    obj, = actor
    obj.name = "Tripo | Flower crowned performer" if is_flower else "Tripo | Seated performer and original seat"
    mesh = obj.data
    coordinates = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
    mesh.vertices.foreach_get("co", coordinates)
    unit = 800 / (config["height"] * 1.10)
    x, depth, z = (coordinates.reshape(-1, 3) - config["anchor"]).T * unit
    x, depth, v = 400 + x, 400 + depth, 400 + 400 / 1.10 - z
    rgba = np.ones((len(mesh.vertices), 4), dtype=np.float32)
    rgba[:, :3] = color("#f8eee3" if is_flower else "#f5e9da")

    def paint(hex_color, coverage):
        mix = np.asarray(coverage, dtype=np.float32)[:, None]
        rgba[:, :3] += (np.asarray(color(hex_color)) - rgba[:, :3]) * mix

    pigments = pigments_18 if is_flower else pigments_52
    pigments(paint, x, depth, v)
    material = studio.material("Painted Tripo sculpt", "#ffffff", rough=.55, coat=.12)
    mesh.materials.clear()
    mesh.materials.append(material)
    for uv in list(mesh.uv_layers):
        mesh.uv_layers.remove(uv)
    for attribute in list(mesh.color_attributes):
        mesh.color_attributes.remove(attribute)
    attribute = mesh.color_attributes.new(name="Authored pigments", type="BYTE_COLOR", domain="POINT")
    mesh.color_attributes.active_color = attribute
    attribute.data.foreach_set("color", rgba.ravel())
    shader = material.node_tree.nodes.new("ShaderNodeVertexColor")
    shader.layer_name = attribute.name
    material.node_tree.links.new(shader.outputs["Color"], material.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
