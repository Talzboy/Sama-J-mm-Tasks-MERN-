const serverless = require('serverless-http')
const express = require('express')
const cors = require('cors')
const { connectDatabase } = require('../../backend/src/config/database')

const app = express()

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())

// Routes mounted without /api prefix because Netlify redirect strips it:
// /api/auth/* → function receives /auth/*
// /api/tasks/* → function receives /tasks/*
app.use('/auth', require('../../backend/src/routes/auth'))
app.use('/tasks', require('../../backend/src/routes/tasks'))

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', message: 'Sama Jamm Tasks API is running' })
)

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

let dbReady = false

const serverlessHandler = serverless(app)

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false

  if (!dbReady) {
    try {
      await connectDatabase()
      dbReady = true
    } catch (err) {
      console.error('DB connection failed:', err.message)
      return {
        statusCode: 503,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error:
            'Database unavailable. Set MONGODB_URI in Netlify environment variables.',
        }),
      }
    }
  }

  return serverlessHandler(event, context)
}
