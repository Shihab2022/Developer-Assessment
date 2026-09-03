import express from "express";
import { PaymentController } from "./payments.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  initiatePaymentSchema,
  paymentListQuerySchema,
  paymentParamsSchema,
} from "./payments.validation";
import { paymentRateLimiter } from "../../middlewares/rateLimiter";

const router = express.Router();

router.get("/packages", PaymentController.listPackages);

router.post(
  "/initiate",
  paymentRateLimiter,
  auth(),
  validate(initiatePaymentSchema),
  PaymentController.initiate,
);

// Gateway callbacks (public — called by SSLCommerz)
router.post("/success", PaymentController.success);
router.get("/success", PaymentController.success);
router.post("/fail", PaymentController.fail);
router.get("/fail", PaymentController.fail);
router.post("/cancel", PaymentController.cancel);
router.get("/cancel", PaymentController.cancel);
router.post("/ipn", PaymentController.ipn);

router.get(
  "/",
  auth(),
  validate(paymentListQuerySchema),
  PaymentController.list,
);

router.get(
  "/:id",
  auth(),
  validate(paymentParamsSchema),
  PaymentController.getById,
);

export const PaymentRouter = router;