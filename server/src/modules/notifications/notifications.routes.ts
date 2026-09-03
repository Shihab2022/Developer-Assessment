import express from "express";
import { NotificationController } from "./notifications.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { notificationQuerySchema, notificationParamsSchema } from "./notifications.validation";

const router = express.Router();

router.get("/", auth(), validate(notificationQuerySchema), NotificationController.list);
router.get("/unread-count", auth(), NotificationController.getUnreadCount);
router.patch("/:id/read", auth(), validate(notificationParamsSchema), NotificationController.markAsRead);
router.post("/read-all", auth(), NotificationController.markAllAsRead);

export const NotificationRouter = router;
