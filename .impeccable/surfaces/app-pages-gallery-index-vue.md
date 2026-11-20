---
version: 1
slug: "app-pages-gallery-index-vue"
primary_target: "app/pages/gallery/index.vue"
related_targets: ["app/layouts/default.vue", "app/pages/gallery/[category]/[[event]].vue"]
---

# Collection index

Mode: Experience.

The global 館藏 link opens a collection index with real artwork and photography previews. Each collection has a clearly named direct entrance. The location map belongs inside the photography collection.

`/gallery?image=<id>` and `/gallery/all` preserve the legacy shared-image redirect, query, and hash. Verify a plain direct entry before and after hydration, legacy links, category switching, and browser Back.
