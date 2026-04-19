export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bone-50 px-6">
      <div className="max-w-md text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-charcoal-500">Private · MaRe</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight">This page isn't available.</h1>
        <p className="mt-3 text-sm text-charcoal-600">
          The partnership page you are looking for may have been moved or is not yet prepared. If you received a link in
          error, please reply to the email you received from the MaRe team.
        </p>
      </div>
    </div>
  );
}
