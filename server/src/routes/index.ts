import express from "express";
import { AuthRouter } from "../modules/auth/auth.routes";
// import { ServicesTechniciansRouter } from "../modules/servicesTechnicians/services.routes";
// import { TechniciansRouter } from "../modules/servicesTechnicians/technicians.route";
// import { CategoriesRouter } from "../modules/servicesTechnicians/categoriesRouter.route";
// import { BookingsRouter } from "../modules/bookings/bookings.routes";
// import { PaymentsRouter } from "../modules/payments/payments.route";
// import { TechnicianRouter } from "../modules/technician/technician.route";
// import { ReviewsRouter } from "../modules/reviews/reviews.route";
// import { AdminRouter } from "../modules/admin/admin.route";
const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    endPoint: AuthRouter,
  },
  //   {
  //     path: "/services",
  //     endPoint: ServicesTechniciansRouter,
  //   },
  //   {
  //     path: "/technicians",
  //     endPoint: TechniciansRouter,
  //   },
  //   {
  //     path: "/categories",
  //     endPoint: CategoriesRouter,
  //   },
  //   {
  //     path: "/bookings",
  //     endPoint: BookingsRouter,
  //   },
  //   {
  //     path: "/payments",
  //     endPoint: PaymentsRouter,
  //   },
  //   {
  //     path: "/technician",
  //     endPoint: TechnicianRouter,
  //   },
  //   {
  //     path: "/reviews",
  //     endPoint: ReviewsRouter,
  //   },
  //   {
  //     path: "/admin",
  //     endPoint: AdminRouter,
  //   },
];

moduleRoutes.forEach((route) => router.use(route.path, route.endPoint));
export const rootRouter = router;
