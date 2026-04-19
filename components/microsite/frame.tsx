export function MicrositeFrame({ children, prospectName }: { children: React.ReactNode; prospectName: string }) {
  return (
    <div className="min-h-screen bg-bone-50 text-charcoal-900">
      {/* Top hairline nav — minimal */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-bone-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-8">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[20px] leading-none tracking-tight">MaRe</span>
            <span className="h-3 w-px bg-charcoal-900/20" />
            <span className="text-[10px] uppercase tracking-[0.28em] text-charcoal-600">Private</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.28em] text-charcoal-500 hidden sm:block">
            Prepared for {prospectName}
          </span>
        </div>
      </header>

      {children}

      <footer className="mt-24 border-t border-border/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-8 py-10 text-[11px] uppercase tracking-[0.2em] text-charcoal-500 sm:flex-row sm:items-center sm:justify-between">
          <span>MaRe · A selective head-spa system</span>
          <span>Private · Shared with {prospectName}</span>
        </div>
      </footer>
    </div>
  );
}
