import express from "express";
import { NoteController } from "./notes.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createNoteSchema, updateNoteSchema, noteParamsSchema, candidateNotesQuerySchema } from "./notes.validation";

const router = express.Router();

router.post("/", auth("RECRUITER", "ADMIN"), validate(createNoteSchema), NoteController.create);
router.get("/candidate/:candidateId", auth(), validate(candidateNotesQuerySchema), NoteController.listForCandidate);
router.patch("/:noteId", auth("RECRUITER", "ADMIN"), validate(noteParamsSchema), validate(updateNoteSchema), NoteController.update);
router.delete("/:noteId", auth("RECRUITER", "ADMIN"), validate(noteParamsSchema), NoteController.remove);

export const NoteRouter = router;
