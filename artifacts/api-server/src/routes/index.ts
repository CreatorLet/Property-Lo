import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import listingsRouter from "./listings.js";
import favoritesRouter from "./favorites.js";
import chatsRouter from "./chats.js";
import supportRouter from "./support.js";
import adminRouter from "./admin.js";
import adsRouter from "./ads.js";
import contactRouter from "./contact.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/listings", listingsRouter);
router.use("/favorites", favoritesRouter);
router.use("/chats", chatsRouter);
router.use("/support", supportRouter);
router.use("/admin", adminRouter);
router.use("/ads", adsRouter);
router.use("/contact", contactRouter);

export default router;
