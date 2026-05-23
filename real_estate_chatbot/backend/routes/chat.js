import { Router } from 'express'
import { isNlpEnabled, runChatTurn } from '../services/nlpService.js'
import { filterProperties } from '../services/propertyService.js'

const router = Router()

router.get('/config', (_req, res) => {
  res.json({ nlpEnabled: isNlpEnabled() })
})

router.post('/chat', async (req, res, next) => {
  try {
    if (!isNlpEnabled()) {
      return res.status(503).json({ error: 'NLP chat is not configured on this server.' })
    }

    const { messages, criteria } = req.body || {}
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' })
    }
    const safeCriteria = {
      location: criteria?.location ?? null,
      maxPrice: criteria?.maxPrice ?? null,
      minBedrooms: criteria?.minBedrooms ?? null,
    }

    const turn = await runChatTurn(messages, safeCriteria)

    let results
    if (turn.ready && turn.criteria.location && turn.criteria.maxPrice != null && turn.criteria.minBedrooms != null) {
      results = await filterProperties({
        location: turn.criteria.location,
        maxPrice: turn.criteria.maxPrice,
        minBedrooms: turn.criteria.minBedrooms,
      })
    }

    res.json({ ...turn, results })
  } catch (err) {
    next(err)
  }
})

export default router
