import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { users, pendingSignups } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth.js";
import { sendOtpEmail, generateOtp } from "../lib/email.js";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { uploadBase64 } from "../lib/storage.js";
import { logger } from "../lib/logger.js";

const router = Router();

function formatUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone ?? null,
    role: u.role,
    status: u.status,
    avatar_base64: u.avatar_base64 ?? null,
    created_at: u.created_at.toISOString(),
  };
}

// POST /auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db
      .insert(pendingSignups)
      .values({ email: email.toLowerCase(), full_name, phone: phone || null, password_hash, otp, otp_expires_at })
      .onConflictDoUpdate({
        target: pendingSignups.email,
        set: { full_name, phone: phone || null, password_hash, otp, otp_expires_at },
      });

    sendOtpEmail(email.toLowerCase(), otp);

    return res.json({ message: "Verification code sent to your email" });
  } catch (err) {
    logger.error(err, "signup error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Missing email or OTP" });
    }

    const [pending] = await db
      .select()
      .from(pendingSignups)
      .where(eq(pendingSignups.email, (email as string).toLowerCase()))
      .limit(1);

    if (!pending) {
      return res.status(400).json({ message: "No pending signup found. Please register again." });
    }
    if (pending.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }
    if (new Date() > pending.otp_expires_at) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email: pending.email,
        full_name: pending.full_name,
        phone: pending.phone,
        password_hash: pending.password_hash,
        is_verified: true,
        role: "user",
        status: "active",
      })
      .returning();

    await db.delete(pendingSignups).where(eq(pendingSignups.email, pending.email));

    const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    return res.json({ token, user: formatUser(newUser) });
  } catch (err) {
    logger.error(err, "verify-otp error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/resend-otp
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const [pending] = await db
      .select()
      .from(pendingSignups)
      .where(eq(pendingSignups.email, (email as string).toLowerCase()))
      .limit(1);

    if (!pending) {
      return res.status(404).json({ message: "No pending signup found for this email" });
    }

    const otp = generateOtp();
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await db
      .update(pendingSignups)
      .set({ otp, otp_expires_at })
      .where(eq(pendingSignups.email, pending.email));

    sendOtpEmail(pending.email, otp);

    return res.json({ message: "Verification code resent" });
  } catch (err) {
    logger.error(err, "resend-otp error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/signin
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const [user] = await db.select().from(users).where(eq(users.email, (email as string).toLowerCase())).limit(1);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Your account has been suspended" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Please use the admin sign-in portal" });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ token, user: formatUser(user) });
  } catch (err) {
    logger.error(err, "signin error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/admin/signin
router.post("/admin/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const [user] = await db.select().from(users).where(eq(users.email, (email as string).toLowerCase())).limit(1);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: not an admin account" });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ message: "This account has been suspended" });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ token, user: formatUser(user) });
  } catch (err) {
    logger.error(err, "admin-signin error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const [user] = await db.select().from(users).where(eq(users.email, (email as string).toLowerCase())).limit(1);
    if (!user) {
      // Don't reveal whether user exists
      return res.json({ message: "If that email is registered, a reset code has been sent" });
    }

    const otp = generateOtp();
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await db
      .insert(pendingSignups)
      .values({
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        password_hash: user.password_hash,
        otp,
        otp_expires_at,
      })
      .onConflictDoUpdate({
        target: pendingSignups.email,
        set: { otp, otp_expires_at },
      });

    sendOtpEmail(user.email, otp);

    return res.json({ message: "If that email is registered, a reset code has been sent" });
  } catch (err) {
    logger.error(err, "forgot-password error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) {
      return res.status(400).json({ message: "Email, OTP and new password are required" });
    }
    if (typeof new_password !== "string" || new_password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const [pending] = await db
      .select()
      .from(pendingSignups)
      .where(eq(pendingSignups.email, (email as string).toLowerCase()))
      .limit(1);

    if (!pending || pending.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }
    if (new Date() > pending.otp_expires_at) {
      return res.status(400).json({ message: "Reset code has expired. Please request a new one." });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await db.update(users).set({ password_hash }).where(eq(users.email, pending.email));
    await db.delete(pendingSignups).where(eq(pendingSignups.email, pending.email));

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    logger.error(err, "reset-password error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(formatUser(user));
  } catch (err) {
    logger.error(err, "get-me error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /auth/profile
router.patch("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { full_name, phone } = req.body;
    if (!full_name) return res.status(400).json({ message: "full_name required" });

    const [updated] = await db
      .update(users)
      .set({ full_name, phone: phone ?? null })
      .where(eq(users.id, req.user!.id))
      .returning();
    return res.json(formatUser(updated));
  } catch (err) {
    logger.error(err, "update-profile error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /auth/password
router.patch("/password", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: "Both passwords required" });
    }
    if (typeof new_password !== "string" || new_password.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    if (!user || !(await bcrypt.compare(current_password, user.password_hash))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await db.update(users).set({ password_hash }).where(eq(users.id, req.user!.id));
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    logger.error(err, "update-password error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /auth/avatar
router.patch("/avatar", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { avatar_base64 } = req.body;
    if (!avatar_base64) return res.status(400).json({ message: "avatar_base64 required" });

    const avatarValue = await uploadBase64(
      avatar_base64,
      "avatars",
      `avatars/${req.user!.id}`
    );

    const [updated] = await db
      .update(users)
      .set({ avatar_base64: avatarValue })
      .where(eq(users.id, req.user!.id))
      .returning();
    return res.json(formatUser(updated));
  } catch (err) {
    logger.error(err, "update-avatar error");
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
