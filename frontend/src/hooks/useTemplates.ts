"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage, templatesApi } from "@/lib/api";
import type {
  CreateAssessmentFromTemplatePayload,
  CreateTemplatePayload,
  ListParams,
  UpdateTemplatePayload,
} from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";

export function useTemplates(params?: ListParams & { companyId?: string }) {
  return useQuery({
    queryKey: qk.templates.list(params),
    queryFn: () => templatesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: qk.templates.detail(id ?? ""),
    queryFn: () => templatesApi.byId(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateTemplates() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: qk.templates.all });
}

export function useCreateTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => templatesApi.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Template created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateTemplate(id: string) {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (payload: UpdateTemplatePayload) => templatesApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Template updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (id: string) => templatesApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Template deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Creates a DRAFT assessment from a template and opens it. */
export function useUseTemplate() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: CreateAssessmentFromTemplatePayload }) =>
      templatesApi.use(id, payload),
    onSuccess: (assessment) => {
      queryClient.invalidateQueries({ queryKey: qk.assessments.all });
      queryClient.invalidateQueries({ queryKey: qk.templates.all });
      toast.success("Assessment created from template");
      router.push(`/recruiter/assessments/${assessment.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}