import express from "express";
import { db } from "../db/init.js";

const router = express.Router();

// GET all experiences
router.get("/", (req, res, next) => {
  try {
    const experiences = db.prepare(`
      SELECT 
        id, title, description, image_url, price, 
        duration_hours, location, category, rating, reviews_count
      FROM experiences
      ORDER BY created_at DESC
    `).all();
    res.json({
      success: true,
      data: experiences,
      count: experiences.length
    });
  } catch (error) {
    next(error);
  }
});

// GET single experience with available slots for next 30 days
router.get("/:id", (req, res, next) => {
  try {
    const { id } = req.params;
    // Get experience details
    const experience = db.prepare(`SELECT * FROM experiences WHERE id = ?`).get(id);
    if (!experience) {
      return res.status(404).json({ success: false, error: "Experience not found" });
    }
    // Get available slots for next 30 days (dates as string, calculate date lookahead in JS)
    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + 30);
    const dateStart = today.toISOString().slice(0, 10);
    const dateEnd = end.toISOString().slice(0, 10);
    const slots = db.prepare(`
      SELECT 
        id, date, start_time, end_time, capacity, booked_count,
        (capacity - booked_count) as available_seats
      FROM slots
      WHERE experience_id = ? 
        AND date >= ?
        AND date <= ?
        AND (capacity - booked_count) > 0
      ORDER BY date ASC, start_time ASC
    `).all(id, dateStart, dateEnd);

    res.json({
      success: true,
      data: {
        ...experience,
        slots
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
