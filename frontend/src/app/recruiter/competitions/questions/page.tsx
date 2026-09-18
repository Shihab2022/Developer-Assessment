"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Primitives";
import { OwnQuestionBank } from "@/components/competitions/OwnQuestionBank";
import { QuestionEditorModal } from "@/components/competitions/QuestionEditor";
import { useCompetitionsHydrated, useCompetitionsStore } from "@/store/competitions";
import type { OwnQuestion } from "@/lib/competitions/types";

