"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Unlock, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, LoadingBlock } from "@/components/ui/Misc";
import { formatDateTime, cn } from "@/lib/utils";

export function NotesModal({
  candidateId,
  candidateName,
  assessmentId,
  companyId,
  onClose,
}: {
  candidateId: string;
  candidateName: string;
  assessmentId?: string;
  companyId?: string;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get(`/notes/candidate/${candidateId}`, { params: { limit: 50, assessmentId: assessmentId || undefined } })
      .then((res) => setNotes(res.data?.data ?? []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [candidateId, assessmentId]);

  const add = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await api.post("/notes", {
        candidateId,
        assessmentId: assessmentId || undefined,
        companyId: companyId || undefined,
        content: content.trim(),
        isPrivate,
      });
      toast.success("Note added");
      setContent("");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (n: Note) => {
    try {
      await api.delete(`/notes/${n.id}`);
      setNotes((prev) => prev.filter((x) => x.id !== n.id));
      toast.success("Note deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title={`Notes — ${candidateName}`} width="md">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 p-4">
          <Field label="Add a note">
            <Textarea rows={3} placeholder="e.g. Strong JS fundamentals — recommend for interview" value={content} onChange={(e) => setContent(e.target.value)} />
          </Field>
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
              Private (visible to recruiters only)
            </label>
            <Button size="sm" onClick={add} loading={saving}>Add note</Button>
          </div>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : notes.length === 0 ? (
          <EmptyState title="No notes yet" />
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className={cn("rounded-xl border p-3", n.isPrivate ? "border-amber-200 bg-amber-50/40" : "border-slate-200")}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-800">{n.content}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {n.isPrivate ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Unlock className="h-3.5 w-3.5 text-slate-300" />}
                    <button onClick={() => remove(n)} className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500" aria-label="Delete note">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                                <p className="mt-1 text-xs text-slate-400">{n.author?.name ?? "You"} · {formatDateTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
