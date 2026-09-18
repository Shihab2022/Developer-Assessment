"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Primitives";
import { ExamShell } from "@/components/exams/ExamShell";
import { QuestionContent } from "@/components/exams/QuestionContent";
import { gradeEntry } from "@/lib/competitions/scoring";
import { resolvePaperRows } from "@/lib/competitions/paper";
import { loadBank } from "@/lib/question-banks/load";
import {
  competitionById,
  entryById,
  useCompetitionsHydrated,
  useCompetitionsStore,
} from "@/store/competitions";
import type { QuestionBank } from "@/lib/question-banks/types";

