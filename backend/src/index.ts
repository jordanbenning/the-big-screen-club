import path from 'path'

import { PrismaClient } from '@prisma/client'
import connectPgSimple from 'connect-pg-simple'
import cors from 'cors'
import dotenv from 'dotenv'
import express, { type Request, type Response } from 'express'
import session from 'express-session'

import './types/session'
import authRoutes from './routes/authRoutes'
import clubRoutes from './routes/clubRoutes'
import movieRoutes from './routes/movieRoutes'
import notificationRoutes from './routes/notificationRoutes'
import userRoutes from './routes/userRoutes'

// Load environment variables
dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT =
  process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 3000

// Session configuration
const PgStore = connectPgSimple(session)

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

// Serve static files (club profile pictures)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Session middleware
app.use(
  session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET ?? 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    },
  })
)

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'The Big Screen Club API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/clubs', clubRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/movies', movieRoutes)

// Graceful shutdown
process.on('SIGINT', () => {
  void (async () => {
    await prisma.$disconnect()
    process.exit(0)
  })()
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
