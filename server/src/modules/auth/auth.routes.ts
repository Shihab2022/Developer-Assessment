import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from "./auth.validation";
import { loginRateLimiter, registerRateLimiter } from "../../middlewares/rateLimiter";

const router = express.Router();

router.post("/register", registerRateLimiter, validate(registerSchema), AuthController.register);
router.post("/login", loginRateLimiter, validate(loginSchema), AuthController.login);
router.post("/refresh-token", validate(refreshTokenSchema), AuthController.refreshToken);
router.post("/logout", AuthController.logout);
router.get("/me", auth(), AuthController.getMe);

export const AuthRouter = router;