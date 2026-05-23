import { Router } from 'express'
import { filterProperties } from '../services/propertyService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : null
    const minBedrooms = req.query.minBedrooms != null ? Number(req.query.minBedrooms) : null
    const location = req.query.location || null

    if (maxPrice != null && Number.isNaN(maxPrice)) {
      return res.status(400).json({ error: 'maxPrice must be a number' })
    }
    if (minBedrooms != null && Number.isNaN(minBedrooms)) {
      return res.status(400).json({ error: 'minBedrooms must be a number' })
    }

    const properties = await filterProperties({ maxPrice, location, minBedrooms })
    res.json(properties)
  } catch (err) {
    next(err)
  }
})

export default router
