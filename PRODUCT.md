# Young Portfolio

<!-- impeccable:product-schema 1 -->

## Platform

Web. A Nuxt portfolio deployed as a static site on GitHub Pages under `/young-portfolio/`.

## Purpose

Present Young's digital artwork and photography. Visitors can go directly to paintings, photo activities, or the 3D corridor from the primary navigation.

## Content and workflows

- Real artwork and photography come from `public/galleryList.json` and `public/photographyList.json`; preserve their titles, dates, metadata, and image identities.
- The gallery supports category, activity, year, and search filters.
- Photography has an overview map and directory, individual activity pages, and a complete photo series.
- The existing image viewer supports large-image inspection, previous/next navigation, and `?image=<id>` sharing links.
- The homepage opens the 3D corridor. Painted worlds also open from the relevant artwork. Closing the in-page viewer returns to the same artwork or browse position. Shared standalone links retain their return destinations.

## Constraints

- Preserve the current routes, GitHub Pages base path, image-path helpers, and responsive thumbnail pipeline.
- Support desktop, tablet, mobile, keyboard operation, light and dark themes, and reduced motion.
- Keep global viewer scroll locking and gallery URL synchronization with their existing single owners.
- Use the author's actual images in the website. Generated concept images illustrate composition and do not replace portfolio works or supply factual metadata.

## Confirmed scope

The homepage introduces the portfolio with the sculpture of 《唯一真神》. The primary navigation is 繪畫, 攝影, and 3D 迴廊. The author section and footer link to 手記. The original 《光落之處》 URL and gallery index remain available for existing links.
