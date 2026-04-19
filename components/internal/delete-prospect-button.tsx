"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusNotice } from "@/components/ui/status-notice";

interface DeleteProspectButtonProps {
  prospectId: string;
  prospectName: string;
  /** Where to navigate after a successful delete. Default: /prospects */
  redirectTo?: string;
  /** Visual variant. "full" = labeled outline button. "icon" = trash icon only (for list rows). */
  variant?: "full" | "icon";
}

export function DeleteProspectButton({
  prospectId,
  prospectName,
  redirectTo = "/prospects",
  variant = "full",
}: DeleteProspectButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/prospect", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Delete failed");
        setDeleting(false);
        return;
      }
      setOpen(false);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(String(err));
      setDeleting(false);
    }
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          aria-label={`Delete ${prospectName}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-charcoal-500/60 opacity-0 transition-all hover:bg-charcoal-900/5 hover:text-amber-700 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-charcoal-500 hover:text-amber-700"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => !deleting && setOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {prospectName}?</DialogTitle>
            <DialogDescription>
              This removes the prospect, its analysis, microsite, outreach drafts, and approval state.
              It can't be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md border border-amber-600/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <LoadingButton
              size="sm"
              loading={deleting}
              loadingText="Deleting"
              onClick={confirmDelete}
              className="bg-amber-700 text-bone-50 hover:bg-amber-800"
            >
              Delete prospect
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      <StatusNotice
        open={!!error && !open}
        onClose={() => setError(null)}
        tone="error"
        message={error ?? ""}
      />
    </>
  );
}
