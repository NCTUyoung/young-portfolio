# Young Portfolio

<!-- impeccable:product-schema 1 -->

## Platform

Web. A Nuxt portfolio deployed as a static site on GitHub Pages under `/young-portfolio/`.

## Purpose

Present Young's digital artwork and photography as two distinct, connected bodies of work. Visitors can explore the portfolio from its homepage, browse artwork by year, locate photographic activities on a map, and inspect individual images.

## Content and workflows

- Real artwork and photography come from `public/galleryList.json` and `public/photographyList.json`; preserve their titles, dates, metadata, and image identities.
- The gallery supports category, activity, year, and search filters.
- Photography has an overview map and directory, individual activity pages, and a complete photo series.
- The existing image viewer supports large-image inspection, previous/next navigation, and `?image=<id>` sharing links.

## Constraints

- Preserve the current routes, GitHub Pages base path, image-path helpers, and responsive thumbnail pipeline.
- Support desktop, tablet, mobile, keyboard operation, light and dark themes, and reduced motion.
- Keep global viewer scroll locking and gallery URL synchronization with their existing single owners.
- Use the author's actual images in the website. Generated concept images illustrate composition and do not replace portfolio works or supply factual metadata.

## Confirmed scope

The October 2026 design work covers the homepage entries and both gallery experiences. The approved presentation directions are a museum exhibition for digital artwork and a photographer's print-selection light table for photography, while retaining the map and activity structure.
