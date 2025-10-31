import express from "express";
import { db } from "../db/init.js";

const router = express.Router();

// POST validate promo code
router.post("/validate", (req, res, next) => {
  try {
    const { code, base_price } = req.body;
    if (!code || !base_price) {
      return res.status(400).json({
        success: false,
        error: "Code and base_price are required"
      });
    }
    const promo = db.prepare(`
      SELECT * FROM promo_codes 
      WHERE code = ? AND is_active = 1 
        AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
        AND (max_uses IS NULL OR current_uses < max_uses)
    `).get(code.toUpperCase());
    if (!promo) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired promo code"
      });
    }
    let discountAmount = 0;
    if (promo.discount_type === "percentage") {
      discountAmount = (base_price * promo.discount_value) / 100;
    } else {
      discountAmount = promo.discount_value;
    }
    // Don't increment current_uses unless actually booking, so skip that here.
    res.json({
      success: true,
      data: {
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: discountAmount,
        final_price: base_price - discountAmount,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
