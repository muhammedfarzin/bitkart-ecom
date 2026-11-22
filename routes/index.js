import express from "express";
import adminRouter from "./admin.js";
import userRouter from "./user.js";
import { pageNotFound } from "../controller/error-controller.js";

const router = express.Router();

router.use(express.static("public"));
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use((req, res, next) => {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});

router.use("/admin", adminRouter);
router.use("/", userRouter);
router.all("*", pageNotFound);

export default router;
