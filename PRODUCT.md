# Young Portfolio

<!-- impeccable:product-schema 1 -->

## Platform

Web. A Nuxt portfolio deployed as a static site on GitHub Pages under `/young-portfolio/`.

## Purpose

Present Young's digital artwork and photography through a current exhibition and a browsable collection. Visitors can follow the exhibition from the homepage or go directly to the collection to find a work, a year, or a photographic activity.

## Content and workflows

- Real artwork and photography come from `public/galleryList.json` and `public/photographyList.json`; preserve their titles, dates, metadata, and image identities.
- The gallery supports category, activity, year, and search filters.
- Photography has an overview map and directory, individual activity pages, and a complete photo series.
- The existing image viewer supports large-image inspection, previous/next navigation, and `?image=<id>` sharing links.
- The homepage links directly to the 3D corridor. Painted worlds also open from the relevant artwork or exhibition stop and link back to that source.

## Constraints

- Preserve the current routes, GitHub Pages base path, image-path helpers, and responsive thumbnail pipeline.
- Support desktop, tablet, mobile, keyboard operation, light and dark themes, and reduced motion.
- Keep global viewer scroll locking and gallery URL synchronization with their existing single owners.
- Use the author's actual images in the website. Generated concept images illustrate composition and do not replace portfolio works or supply factual metadata.

## Confirmed scope

The homepage introduces 《光落之處》 with 《唯一真神》 as the first exhibit. The primary navigation is 當期展, 館藏, and 手記. 館藏 opens the two-collection index. Each collection keeps its established browsing tools and display materials.
