import express from "express";
import { AdminController } from "./admin.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  adminAuditQuerySchema,
  adminListQuerySchema,
  adminUserParamsSchema,
  adminUserRoleSchema,
  adminUserStatusSchema,
} from "./admin.validation";

const router = express.Router();

// All admin routes require the ADMIN role
router.use(auth("ADMIN"));

router.get("/users", validate(adminListQuerySchema), AdminController.listUsers);

router.get("/users/:id", validate(adminUserParamsSchema), AdminController.getUserById);

router.patch(
  "/users/:id/status",
  validate(adminUserStatusSchema),
  AdminController.updateUserStatus,
);

router.patch(
  "/users/:id/role",
  validate(adminUserRoleSchema),
  AdminController.updateUserRole,
);

router.get("/companies", AdminController.listCompanies);

router.get(
  "/assessments",
  validate(adminListQuerySchema),
  AdminController.listAssessments,
);

router.get("/payments", validate(adminListQuerySchema), AdminController.listPayments);

router.get("/dashboard-stats", AdminController.dashboardStats);

router.get(
  "/audit-logs",
  validate(adminAuditQuerySchema),
  AdminController.listAuditLogs,
);

router.get("/problems", validate(adminListQuerySchema), AdminController.listProblems);

export const AdminRouter = router;
