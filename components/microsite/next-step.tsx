"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MicrositeNextStep({ ctaLabel, message }: { ctaLabel: string; message: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-mare-key text-bone-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-[-20%] h-[160%] w-[520px] opacity-[0.15]"
      >
        <Image src="/brand/pictorial-mark.png" alt="" fill sizes="520px" className="object-contain" />
      </div>
      <div className="mx-auto max-w-5xl px-8 py-28">
        <p className="font-display text-[11px] font-medium uppercase tracking-[0.28em] text-water-50/70">
          Next step
        </p>
        <h2 className="mt-6 max-w-3xl font-serif text-4xl font-medium leading-[1.1] tracking-tight text-bone-50 text-balance sm:text-[52px]">
          {message}
        </h2>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-mare-brown text-bone-50 hover:bg-[#4d2e1b] font-display tracking-wide"
              >
                {ctaLabel}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>A quiet reply is enough.</DialogTitle>
                <DialogDescription>
                  Reply to the email you received from the MaRe team.
                </DialogDescription>
              </DialogHeader>
              <p className="text-xs text-mare-dark/60">
                This page is private. It isn't indexed or shared beyond you.
              </p>
            </DialogContent>
          </Dialog>

          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-water-50/60">
            No form · No meeting link · Just a note
          </p>
        </div>
      </div>
    </section>
  );
}
