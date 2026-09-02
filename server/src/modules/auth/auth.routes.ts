import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/forget-password", AuthController.forgetPassword);
router.patch("/update-password", AuthController.updatePassword);
router.patch("/reset-password", AuthController.resetPassword);
router.get("/me", auth(), AuthController.getMe);
router.put("/me", auth(), AuthController.updateMe);

export const AuthRouter = router;
