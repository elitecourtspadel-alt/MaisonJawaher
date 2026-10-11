'use client';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto mt-16 max-w-lg p-8 text-center">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <p className="mt-2 break-words text-sm text-muted">{error.message}</p>
      <p className="mt-2 text-xs text-muted">If this is a fresh install, make sure you ran the database setup (supabase/schema.sql).</p>
      <button className="btn btn-primary mt-6" onClick={reset}>Try again</button>
    </div>
  );
}
