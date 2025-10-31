import express from "express";
import { db } from "../db/init.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// POST create booking
router.post("/", (req, res, next) => {
  try {
    const { slot_id, experience_id, user_name, user_email, user_phone, number_of_guests, promo_code } = req.body;

    // Validation
    if (!slot_id || !experience_id || !user_name || !user_email || !number_of_guests) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Run everything in a transaction
    const transaction = db.transaction(() => {
      // Slot lookup & lock (lock simulated by transaction)
      const slot = db.prepare(`SELECT * FROM slots WHERE id = ?`).get(slot_id);
      if (!slot) {
        throw { status: 404, message: "Slot not found" };
      }
      // Check availability
      if ((slot.booked_count + Number(number_of_guests)) > slot.capacity) {
        throw { status: 400, message: "Not enough seats available" };
      }
      // Get experience price
      const experience = db.prepare("SELECT price FROM experiences WHERE id = ?").get(experience_id);
      if (!experience) throw { status: 404, message: "Experience not found" };
      const basePrice = Number(experience.price) * Number(number_of_guests);
      let discountAmount = 0;

      // Promo code logic
      let promo = null;
      if (promo_code) {
        promo = db.prepare(`SELECT * FROM promo_codes WHERE code = ? AND is_active = 1 AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP) AND (max_uses IS NULL OR current_uses < max_uses)`).get(promo_code.toUpperCase());
        if (!promo) {
          throw { status: 400, message: "Invalid or expired promo code" };
        }
        if (promo.discount_type === "percentage") {
          discountAmount = (basePrice * promo.discount_value) / 100;
        } else {
          discountAmount = promo.discount_value;
        }
        db.prepare(`UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?`).run(promo.id);
      }
      const totalPrice = basePrice - discountAmount;

      // Create booking
      const bookingId = uuidv4();
      db.prepare(`
        INSERT INTO bookings (
          id, slot_id, experience_id, user_name, user_email, user_phone,
          number_of_guests, base_price, promo_code, discount_amount, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        bookingId,
        slot_id,
        experience_id,
        user_name,
        user_email,
        user_phone,
        number_of_guests,
        basePrice,
        promo_code ? promo_code.toUpperCase() : null,
        discountAmount,
        totalPrice
      );
      // Update slot booked count
      db.prepare(`UPDATE slots SET booked_count = booked_count + ? WHERE id = ?`).run(number_of_guests, slot_id);
      return {
        booking_id: bookingId,
        user_name,
        user_email,
        number_of_guests,
        base_price: basePrice,
        discount_amount: discountAmount,
        total_price: totalPrice,
        status: "confirmed"
      };
    });

    try {
      const result = transaction();
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      if (err && err.status && err.message) {
        res.status(err.status).json({ success: false, error: err.message });
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
});

// GET booking confirmation
router.get("/:id", (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = db.prepare(`
      SELECT b.*, e.title as experience_title, s.date, s.start_time
      FROM bookings b
      JOIN experiences e ON b.experience_id = e.id
      JOIN slots s ON b.slot_id = s.id
      WHERE b.id = ?
    `).get(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

export default router;
