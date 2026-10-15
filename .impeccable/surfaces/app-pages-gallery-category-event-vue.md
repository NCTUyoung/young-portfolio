---
version: 1
slug: "app-pages-gallery-category-event-vue"
primary_target: "app/pages/gallery/[[category]]/[[event]].vue"
related_targets: ["app/pages/index.vue","app/components/gallery/GalleryPhotoLightTable.vue","app/components/gallery/GalleryAtelierTimeline.vue","app/components/EventMap.vue"]
---

# Gallery exhibition and print-selection light table

Mode: Experience. Direction seed: user-approved-exhibition-light-table-2026-10-15.

## THESIS
The artwork is encountered as a museum exhibition; photography is encountered as prints being chosen from a photographer's light table. Both are visible as separate entries on the homepage.

## OWN-WORLD
Keep the existing Japanese editorial identity: warm ivory exhibition walls, cool silver photography work surfaces, original-color works, sparse stone-colored type, hairlines, and limited terracotta accents. The October 2026 museum concept and the user-approved generated light-table image are directional references. Use the original portfolio images and their actual metadata rather than generated image content or invented dates.

## STORY
Homepage offers the two distinct viewing experiences. Digital gallery opens with a single prominent framed work, then complete year rooms. Photography opens with a full-width map of always-visible circular activity photos and a remote-region inset, followed by the activity directory. Entering an activity opens a light table, followed by its complete contact sheet and existing large-image viewer.

## FIRST VIEWPORT
The homepage shows framed art and loose photo prints together. The digital gallery makes a single artwork physically prominent on a warm wall. With no saved view, the photography overview fits nearby activities with a maximum zoom of `10`, using `[100, 100]` map padding on desktop and `[32, 70]` on mobile; the remote inset fit is capped at zoom `8`. “顯示全部活動” fits every location, including Tokyo, and hides the inset. The current collection places 12 activities near the main region and two Tokyo activities in the inset. A photography activity immediately presents its name, small neighboring prints, one enlarged selected print, and a selection strip at a coherent scale. Mobile keeps the complete main image and uses smaller neighbors without horizontal page overflow.

## FORM
Museum: original-ratio artwork, quiet wood-tone frame, mat, wash light, small plaque, breathing room. Photography activity: original-ratio selected print on warm-white paper, three unique smaller neighbors, soft offset shadows, bottom contact strip. Selecting a strip frame changes the local selection; clicking the main print opens the existing viewer with the current activity's images. Viewer changes update the table underneath, including deep links. Closing retains selection. No autoplay, additional modal, or duplicated route/body-scroll ownership.

Photography overview map: every nearby activity has its own circular cropped representative photograph, 48px on desktop and 44px on mobile; selection grows it to 64px or 56px. Close or shared coordinates form always-open local fans rather than a count badge. A separate inset shows remote activities until all-locations mode is chosen. Real coordinates remain the line anchors: short leaders update during pan, hide during animated zoom, and disappear when an anchor is offscreen even if its circle remains visible. Each circle group has one Tab stop; Arrow keys and Home/End move within it, so the activity path is main circle group → inset circle group → selected-activity footer. The footer gives title, location, accuracy, time range, and image count and opens the activity gallery. Before opening, it stops map animation and records the visible viewport. The circles may crop the thumbnail; the activity series retains the original photograph. “近景” returns from all-locations mode to the nearby region; mode changes are recorded immediately. Returning from a gallery restores viewport, selected activity, and all-locations mode. The map keeps the single 1px film edge, light/dark treatment, reduced-motion behavior, and tile-failure retry while allowing photo selection when tiles fail. Only the main map renders OpenStreetMap attribution for the shared tile source.

## BOUNDARIES AND VERIFICATION
Preserve category/year/search, map state and activity routing, URL sharing, complete image counts, SEO hero sources, and keyboard/reduced-motion/light/dark behavior. The map uses the public OpenStreetMap tile service and contributor attribution. Keep the legacy cover's unconnected technique/topic chips as descriptive metadata rather than pretending to filter. Verify before/after captures, selection/viewer/deep-link/event-reset flows, 0/1/2 images, existing gallery/map/overview checks, lint, typecheck, unit tests, and a production build.
