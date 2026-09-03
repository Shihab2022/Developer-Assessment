import express from "express";
import { DashboardController } from "./dashboard.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/recruiter", auth("RECRUITER", "ADMIN"), DashboardController.recruiterDashboard);
router.get("/candidate", auth("CANDIDATE"), DashboardController.candidateDashboard);

export const DashboardRouter = router;
