import express from 'express'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import identify from './identify'

dotenv.config()
const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.post('/identify', (req, res) => identify(req, res, prisma))

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
