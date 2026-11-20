type WorkWithEvent = { event?: { name?: string } }
type GalleryCatalog = { Img?: WorkWithEvent[] }

export function galleryEventPaths (catalog: GalleryCatalog, category: 'digital' | 'photography'): string[] {
  const names = new Set<string>()
  for (const work of catalog.Img ?? []) {
    const name = work.event?.name
    if (typeof name === 'string' && name.length > 0) names.add(name)
  }
  return [...names].map(name => `/gallery/${category}/${name}`)
}
