"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function MicrositeNextStep({ ctaLabel, message }: { ctaLabel: string; message: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="border-t border-border/60 bg-charcoal-900 text-bone-50">
      <div className="mx-auto max-w-5xl px-8 py-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent-500">Next step</p>
        <h2 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.1] tracking-tight text-balance">
          {message}
        </h2>

        <div className="mt-10">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="accent">
                {ctaLabel}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book a conversation with MaRe</DialogTitle>
                <DialogDescription>
                  A short, private exchange with the partnerships team. No obligation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-charcoal-700">
                <p>Reply directly to the email you received from the MaRe team.</p>
                <p className="text-xs text-charcoal-500">
                  This page is private and prepared specifically for you. It is not indexed or shared more broadly.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
