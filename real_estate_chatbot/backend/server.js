import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import propertiesRouter from './routes/properties.js'
import savedRouter from './routes/saved.js'
import chatRouter from './routes/chat.js'
import { loadProperties } from './services/propertyService.js'
import { isNlpEnabled } from './services/nlpService.js'

const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mongoConnected: mongoose.connection.readyState === 1,
    nlpEnabled: isNlpEnabled(),
  })
})

app.use('/api/properties', propertiesRouter)
app.use('/api/saved', savedRouter)
app.use('/api', chatRouter)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

async function start() {
  await loadProperties()
  console.log('Property data loaded and merged.')

  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI)
      console.log('Connected to MongoDB.')
    } catch (err) {
      console.warn('MongoDB connection failed — falling back to in-memory saved store.', err.message)
    }
  } else {
    console.warn('MONGO_URI not set — using in-memory saved store (not persistent).')
  }

  console.log(`NLP chat: ${isNlpEnabled() ? 'enabled (OpenAI)' : 'disabled (state-machine fallback on frontend)'}`)

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

start()
