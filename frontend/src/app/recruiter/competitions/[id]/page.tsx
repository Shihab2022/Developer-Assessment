"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Copy, Download, Pencil, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Primitives";
import { LeaderboardTable } from "@/components/competitions/LeaderboardTable";
import { CompetitionDetailCards } from "@/components/competitions/CompetitionDetailCards";
import {
  accessCodeMatches,
  competitionById,
  entriesFor,
  useCompetitionsHydrated,
  useCompetitionsStore,
} from "@/store/competitions";
import { leaderboardCsv } from "@/lib/competitions/scoring";
import { copyToClipboard, downloadBlob, formatDateTime } from "@/lib/utils";

