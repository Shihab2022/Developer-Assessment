import express from "express";
import { UserController } from "./users.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { changePasswordSchema, updateMeSchema } from "./users.validation";
import { passwordRateLimiter } from "../../middlewares/rateLimiter";

const router = express.Router();

router.get("/me", auth(), UserController.getMe);
router.patch("/me", auth(), validate(updateMeSchema), UserController.updateMe);
router.patch(
  "/me/password",
  passwordRateLimiter,
  auth(),
  validate(changePasswordSchema),
  UserController.changePassword,
);
router.get("/me/activity", auth(), UserController.activity);

export const UserRouter = router;