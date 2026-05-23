import { Router } from 'express'
import SavedProperty from '../models/SavedProperty.js'
import { getPropertiesByIds } from '../services/propertyService.js'

const router = Router()

// In-memory fallback when MongoDB is not connected — useful for local dev / demos.
const memStore = new Map() // userId -> Set<propertyId>

function isMongoReady() {
  // 1 = connected
  return SavedProperty.db.readyState === 1
}

router.post('/', async (req, res, next) => {
  try {
    const { userId, propertyId } = req.body
    if (!userId || typeof propertyId !== 'number') {
      return res.status(400).json({ error: 'userId and numeric propertyId required' })
    }

    if (isMongoReady()) {
      await SavedProperty.updateOne(
        { userId, propertyId },
        { $setOnInsert: { userId, propertyId } },
        { upsert: true }
      )
    } else {
      if (!memStore.has(userId)) memStore.set(userId, new Set())
      memStore.get(userId).add(propertyId)
    }
    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    let ids
    if (isMongoReady()) {
      const docs = await SavedProperty.find({ userId }).sort({ savedAt: -1 }).lean()
      ids = docs.map((d) => d.propertyId)
    } else {
      ids = Array.from(memStore.get(userId) || [])
    }
    const properties = await getPropertiesByIds(ids)
    // Preserve order of `ids` (most-recently-saved first when from Mongo)
    const byId = new Map(properties.map((p) => [p.id, p]))
    res.json(ids.map((id) => byId.get(id)).filter(Boolean))
  } catch (err) {
    next(err)
  }
})

router.delete('/:userId/:propertyId', async (req, res, next) => {
  try {
    const { userId } = req.params
    const propertyId = Number(req.params.propertyId)
    if (Number.isNaN(propertyId)) {
      return res.status(400).json({ error: 'propertyId must be a number' })
    }

    if (isMongoReady()) {
      await SavedProperty.deleteOne({ userId, propertyId })
    } else {
      memStore.get(userId)?.delete(propertyId)
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
