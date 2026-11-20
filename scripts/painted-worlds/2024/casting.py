"""Placement notes in Blender Z-up units. Incoming meshes face -Y before yaw."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Casting:
    anchor: tuple[float, float, float]
    height: float
    yaw: float
    landmarks: dict
    keep_visible: dict
    collision_groups: tuple[str, ...]
    support: tuple[str, ...]


CASTING = {
    "2024-23": Casting(
        anchor=(-.57, 1.20, -.003), height=1.84, yaw=10,
        landmarks={"eyes": (0, -.11, 1.66), "forwardPalm": (.35, -.51, 1.36),
                   "coat": (0, -.20, .91), "shoes": (0, -.10, .10)},
        keep_visible={"leftLampInDepth": ("Warm opal pendant", (-1.59, 3.82, 2.79)),
                      "leftLampAtEntry": ("Warm opal pendant", (-1.59, .46, 2.79)),
                      "railWindowInDepth": ("Amber slit window", (2.564, 5.40, 2.17)),
                      "railWindowAtEntry": ("Amber slit window", (2.004, -2.72, 2.17))},
        collision_groups=("Dark carriage", "Dark carriage side", "Stone bench", "Pavement curb",
                          "Platform edge", "Projecting masonry"),
        support=("Damp setts", "Street paving bed"),
    ),
    "2024-55": Casting(
        anchor=(-1.55, .20, -.001), height=3.04, yaw=12,
        landmarks={"eyes": (0, -.13, 2.77), "whiteShoulder": (.15, -.20, 2.39),
                   "nearHand": (.30, -.32, 1.71), "shoes": (0, -.06, .10)},
        keep_visible={"burgundyFolio": ("Oxblood folio front board", (-1.52, -.15, 1.37)),
                      "copier": ("Copier", (.52, -.35, 2.16)),
                      "paperStack": ("Newsprint stack", (.30, .52, 2.66))},
        collision_groups=("Filing stand", "Oxblood folio", "Rounded bookcloth", "Copier",
                          "Scanner", "Castor", "Loose sheet in the window draft"),
        support=("Glazed floor tile", "Ground tile bed"),
    ),
    "2024-18-4": Casting(
        anchor=(-1.36, .10, .2875), height=2.95, yaw=8,
        landmarks={"flowerCrown": (0, -.10, 2.83), "closedEyes": (0, -.18, 2.59),
                   "crossedGloves": (.10, -.31, 1.74), "skirtHem": (0, -.23, .42)},
        keep_visible={"pinkRose": ("Cupped coral rose petal", (-1.98, 1.20, 2.56)),
                      "aquaGlass": ("Closed opaline globe", (.84, -.82, 1.72)),
                      "lightDisc": ("Pearl light disc rim", (2.44, 2.95, 2.08))},
        collision_groups=("Cupped coral rose petal", "Curved stem", "Closed opaline globe",
                          "Pearl light disc rim", "Opal light disc"),
        support=("Pearl stage surface",),
    ),
    "2024-52": Casting(
        anchor=(-.75, .66, .218), height=2.65, yaw=7,
        landmarks={"eyes": (0, -.12, 2.46), "bow": (0, -.11, 2.60),
                   "torso": (.10, -.24, 1.57), "seatedLeg": (0, -.44, .71)},
        keep_visible={"pinkCrystal": ("Closed polished heart shell", (1.14, .05, 2.68)),
                      "cyanCrystal": ("Closed polished heart shell", (-1.38, -.84, 1.26)),
                      "pinkBalloon": ("Closed polished heart shell", (-1.72, .59, 2.56))},
        collision_groups=("Closed polished heart shell", "Sloping orbit-mounted support ribbon",
                          "High tensile filament above glass", "Orbit rail anchoring foot",
                          "Tension stay from the base", "Balloon tether weight"),
        support=("Black mirror dais",),
    ),
}


def clear_seat_space(studio):
    import bpy
    from mathutils import Vector

    def parts(prefix):
        return sorted((obj for obj in studio.scene.objects if obj.name.startswith(prefix)),
                      key=lambda obj:obj.name)

    rings = parts("Sloping orbit-mounted support ribbon")
    feet = parts("Orbit rail anchoring foot")
    stays = parts("Tension stay from the base")
    assert len(rings)==len(feet)==len(stays)==4, "Expected two ribbons, their highlights and four anchored stays."
    for obj in (*rings,*feet,*stays):
        obj.location.y += .32
    for ring in rings[2:]:
        ring.location.z += .32
    feet[0].location.x -= .32
    bpy.context.view_layer.update()
    current = studio.group
    for index,(foot,stay) in enumerate(zip(feet,stays,strict=True)):
        if index==1:
            continue
        end = stay.matrix_world @ Vector((0,0,max(corner[2] for corner in stay.bound_box)))
        if index>=2:
            end.z += .32
        name,material = stay.name,stay.data.materials[0]
        studio.group = stay.users_collection[0]
        bpy.data.objects.remove(stay,do_unlink=True)
        studio.beam(name,(foot.location.x,foot.location.y,.253),end,.017,material)
    studio.group = current


def open_crystal_sightline(studio):
    from mathutils import Vector

    def append_index(name,index):
        return name if not index else f"{name}.{index:03d}"

    for index,delta in enumerate(((.44,-.01,.04),(-.69,-.05,-.19))):
        names = [
            append_index(name,index)
            for name in ("Closed polished heart shell", "Suspended faceted heart core",
                         "High tensile filament above glass", "Suspension truss at ceiling")
        ]
        names.extend(append_index("Shard in depth inside the glass",index*6+j) for j in range(6))
        names.extend(append_index("Subsurface gleam along a cut heart edge",index*2+j) for j in range(2))
        for name in names:
            studio.scene.objects[name].location += Vector(delta)


def remove_stand_ins(bpy, slug, held_folio=False):
    if slug == "2024-23":
        collection = bpy.data.collections["Basalt cloak and snow"]
        obsolete = [obj for obj in collection.objects if not obj.name.startswith("Wind-carried flake")]
        collection.name = "Snow above the platform"
    elif slug == "2024-18-4":
        collection = bpy.data.collections["White flower crown and crossed gloves"]
        obsolete = list(collection.objects)
    elif slug == "2024-55" and held_folio:
        collection = bpy.data.collections["Left-hand filing stand and oxblood folio"]
        obsolete = list(collection.objects)
    else:
        return []
    names = sorted(obj.name for obj in obsolete)
    assert names, f"No stand-in geometry found in {slug}"
    for obj in obsolete:
        bpy.data.objects.remove(obj, do_unlink=True)
    return names
