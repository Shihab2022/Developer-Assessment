"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, ListOrdered, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Primitives";
import { LeaderboardTable } from "@/components/competitions/LeaderboardTable";
import { CompetitionJoinCard } from "@/components/competitions/CompetitionJoinCard";
import { CompetitionMetaCards } from "@/components/competitions/CompetitionMetaCards";
import {
  competitionById,
  entriesFor,
  useCompetitionsHydrated,
  useCompetitionsStore,
} from "@/store/competitions";
import { isJoinable } from "@/lib/competitions/paper";
import { formatDateTime, pluralize } from "@/lib/utils";

