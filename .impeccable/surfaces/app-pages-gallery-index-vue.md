---
version: 1
slug: "app-pages-gallery-index-vue"
primary_target: "app/pages/gallery/index.vue"
related_targets: ["app/layouts/default.vue", "app/pages/gallery/[category]/[[event]].vue"]
---

# Direct exhibition entrance

Mode: Experience. Updated after user feedback, 2026-10-16.

The user rejected the additional room-selection stop after trying it. The global gallery link now opens photography directly. Existing homepage entrances and in-gallery category links provide the two-room navigation.

`/gallery` is only a compatibility redirect. It sends digital image IDs to digital and other visits to photography, preserving query/hash and replacing history. It renders no selection cards, previews or extra explanatory screen. Verify direct header navigation, old links, category switching and browser Back. Keep the existing exhibition layouts.
