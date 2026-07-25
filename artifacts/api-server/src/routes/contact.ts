import { Router } from "express";
import { db } from "@workspace/db";
import { contactMessages } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router = Router();

// POST /contact
router.post("/", async (req, res) => {
  try {
    const { first_name, last_name, email, phone, subject, message } = req.body;
    if (!first_name || !last_name || !email || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    await db.insert(contactMessages).values({
      first_name,
      last_name,
      email,
      phone: phone || null,
      subject: subject || null,
      message,
    });

    return res.json({ message: "Your message has been received. We'll get back to you shortly." });
  } catch (err) {
    logger.error(err, "submit-contact error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
