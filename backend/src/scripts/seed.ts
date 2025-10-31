import { db } from "../db/init.js";
import { v4 as uuidv4 } from "uuid";

const experiences = [
  {
    title: "Mountain Hiking Adventure",
    description: "Experience breathtaking views on a guided mountain hike through pristine trails.",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=400&fit=crop",
    price: 89.99,
    duration_hours: 4,
    location: "Colorado Rockies",
    category: "Adventure",
    rating: 4.8,
    reviews_count: 245,
  },
  {
    title: "Sunset Beach Yoga",
    description: "Relax and rejuvenate with a peaceful yoga session on the beach at sunset.",
    image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=400&fit=crop",
    price: 45.0,
    duration_hours: 1.5,
    location: "Malibu Beach",
    category: "Wellness",
    rating: 4.9,
    reviews_count: 189,
  },
  {
    title: "Culinary Food Tour",
    description: "Discover local cuisine and hidden gems with a guided food tour through the city.",
    image_url: "https://images.unsplash.com/photo-1504674900967-a8f32de4a645?w=500&h=400&fit=crop",
    price: 75.0,
    duration_hours: 3,
    location: "San Francisco",
    category: "Food & Drink",
    rating: 4.7,
    reviews_count: 312,
  },
  {
    title: "Scuba Diving Expedition",
    description: "Explore vibrant coral reefs and marine life in crystal clear waters.",
    image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=400&fit=crop",
    price: 120.0,
    duration_hours: 5,
    location: "Great Barrier Reef",
    category: "Water Sports",
    rating: 4.9,
    reviews_count: 428,
  },
  {
    title: "Hot Air Balloon Ride",
    description: "Float above stunning landscapes in a hot air balloon at sunrise.",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=400&fit=crop",
    price: 250.0,
    duration_hours: 3,
    location: "Cappadocia",
    category: "Adventure",
    rating: 4.95,
    reviews_count: 567,
  },
];

const promoCodes = [
  {
    code: "SAVE10",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: 100,
  },
  {
    code: "FLAT100",
    discount_type: "fixed",
    discount_value: 100,
    max_uses: 50,
  },
  {
    code: "WELCOME20",
    discount_type: "percentage",
    discount_value: 20,
    max_uses: 200,
  },
];

function seed() {
  try {
    console.log("🌱 Seeding database...");

    // Insert experiences
    for (const exp of experiences) {
      const expId = uuidv4();
      db.prepare(
        `INSERT INTO experiences (id, title, description, image_url, price, duration_hours, location, category, rating, reviews_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        expId,
        exp.title,
        exp.description,
        exp.image_url,
        exp.price,
        exp.duration_hours,
        exp.location,
        exp.category,
        exp.rating,
        exp.reviews_count
      );
      // Create slots for each experience (next 7 days, 3 slots per day)
      const today = new Date();
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);
        const dateStr = date.toISOString().split("T")[0];
        const times = ["09:00", "12:00", "15:00"];
        for (const time of times) {
          const endHour = Math.floor(Number(time.split(":")[0]) + Number(exp.duration_hours));
          const endTime = `${String(endHour).padStart(2, "0")}:00`;
          db.prepare(
            `INSERT INTO slots (id, experience_id, date, start_time, end_time, capacity)
            VALUES (?, ?, ?, ?, ?, ?)`
          ).run(uuidv4(), expId, dateStr, time, endTime, 20);
        }
      }
    }

    // Insert promo codes
    for (const promo of promoCodes) {
      db.prepare(
        `INSERT INTO promo_codes (id, code, discount_type, discount_value, max_uses)
        VALUES (?, ?, ?, ?, ?)`
      ).run(uuidv4(), promo.code, promo.discount_type, promo.discount_value, promo.max_uses);
    }

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seed();
