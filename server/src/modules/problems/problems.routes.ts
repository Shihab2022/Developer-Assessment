import express from "express";
import { ProblemController } from "./problems.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  createProblemSchema,
  problemIdParams,
  problemQuerySchema,
  searchProblemSchema,
  updateProblemSchema,
} from "./problems.validation";

const router = express.Router();

router.post(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(createProblemSchema),
  ProblemController.create,
);

router.get(
  "/",
  auth(),
  validate(problemQuerySchema),
  ProblemController.list,
);

router.get(
  "/search",
  auth(),
  validate(searchProblemSchema),
  ProblemController.search,
);

router.get(
  "/:id",
  auth(),
  validate(problemIdParams),
  ProblemController.getById,
);

router.patch(
  "/:id",
  auth("RECRUITER", "ADMIN"),
  validate(problemIdParams),
  validate(updateProblemSchema),
  ProblemController.update,
);

router.delete(
  "/:id",
  auth("RECRUITER", "ADMIN"),
  validate(problemIdParams),
  ProblemController.remove,
);

export const ProblemRouter = router;