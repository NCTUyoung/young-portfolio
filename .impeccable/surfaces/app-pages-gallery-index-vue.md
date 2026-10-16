---
version: 1
slug: "app-pages-gallery-index-vue"
primary_target: "app/pages/gallery/index.vue"
related_targets: ["app/pages/index.vue", "app/pages/gallery/[category]/[[event]].vue"]
---

# Two exhibition rooms

Mode: Experience. Direction: user-approved compact hall index, 2026-10-16.

## THESIS
Offer two equally clear entrances before the visitor chooses a collection. This is a short wayfinding stop, with warm artwork and cool photography materials.

## STORY AND FORM
One heading, one sentence, two room links. Typographic room names and a hairline carry the hierarchy without additional work previews. Photography then opens its existing circular-photo map; digital artwork opens its existing year rooms. Preserve the homepage's separate visual entrances and do not restore a selected-works section.

## BOUNDARIES AND VERIFICATION
The ordinary index loads neither gallery datasets nor the Leaflet runtime, and remembered filters cannot redirect it. The existing global map stylesheet remains shared. Existing category/event routes and known legacy image links remain usable. Verify both links, SPA return and Back, persisted category, old image query/hash, mobile, light/dark, keyboard focus and reduced motion. Do not clear collection filters from the index.
