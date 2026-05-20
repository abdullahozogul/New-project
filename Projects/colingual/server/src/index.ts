import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import scrapeRouter from './routes/scrape'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET'],
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'colingual-scrape' })
})

app.use('/api/scrape', scrapeRouter)

app.listen(PORT, () => {
  console.log(`Colingual scraping API: http://localhost:${PORT}`)
})
