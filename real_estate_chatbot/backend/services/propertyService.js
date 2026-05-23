import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')

let mergedCache = null

async function loadJson(name) {
  const text = await readFile(join(dataDir, name), 'utf8')
  return JSON.parse(text)
}

export async function loadProperties() {
  if (mergedCache) return mergedCache
  const [basics, chars, images] = await Promise.all([
    loadJson('property_basics.json'),
    loadJson('property_characteristics.json'),
    loadJson('property_images.json'),
  ])
  const charsById = new Map(chars.map((c) => [c.id, c]))
  const imagesById = new Map(images.map((i) => [i.id, i]))
  mergedCache = basics.map((b) => ({
    ...b,
    ...(charsById.get(b.id) || {}),
    ...(imagesById.get(b.id) || {}),
  }))
  return mergedCache
}

export async function filterProperties({ maxPrice, location, minBedrooms }) {
  const properties = await loadProperties()
  return properties.filter((p) => {
    if (maxPrice != null && p.price > maxPrice) return false
    if (location && !p.location.toLowerCase().includes(location.toLowerCase())) return false
    if (minBedrooms != null && p.bedrooms < minBedrooms) return false
    return true
  })
}

export async function getPropertiesByIds(ids) {
  const properties = await loadProperties()
  const set = new Set(ids)
  return properties.filter((p) => set.has(p.id))
}
