import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { initializeDatabase } from "./db/init.js"
import experiencesRouter from "./routes/experiences.js"
import bookingsRouter from "./routes/bookings.js"
import promoRouter from "./routes/promo.js"
import { errorHandler } from "./middleware/errorHandler.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())

// Initialize database
initializeDatabase()

// Routes
app.use("/api/experiences", experiencesRouter)
app.use("/api/bookings", bookingsRouter)
app.use("/api/promo", promoRouter)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Error handling
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 BookIt Backend running on http://localhost:${PORT}`)
})
