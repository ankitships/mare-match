import Image from "next/image";

// Outer chrome for the external partner page. Deliberately minimal: a thin
// top bar with the submark + contextual label, then the page, then a quiet
// footer. The page body is served on the Light palette (#e2e2de / off-white).
export function MicrositeFrame({ children, prospectName }: { children: React.ReactNode; prospectName: string }) {
  return (
    <div className="min-h-screen bg-bone-50 text-mare-extra-dark selection:bg-mare-key/15">
      <header className="sticky top-0 z-20 border-b border-mare-light/60 bg-bone-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <Image src="/brand/submark.png" alt="" width={28} height={28} priority />
            <span className="font-serif text-[20px] leading-none tracking-tight text-mare-key">MaRe</span>
            <span className="h-[12px] w-px bg-mare-key/20" />
            <span className="font-display text-[10px] font-medium uppercase tracking-[0.24em] text-mare-dark/70">
              Private
            </span>
          </div>
          <span className="hidden font-display text-[10px] uppercase tracking-[0.24em] text-mare-dark/60 sm:block">
            For {prospectName}
          </span>
        </div>
      </header>

      {children}

      <footer className="mt-32 border-t border-mare-light/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-8 py-12 text-[11px] uppercase tracking-[0.22em] text-mare-dark/60 sm:flex-row sm:items-center sm:justify-between">
          <span>MaRe · A head-spa system</span>
          <span>Small by design · Private to {prospectName}</span>
        </div>
      </footer>
    </div>
  );
}
