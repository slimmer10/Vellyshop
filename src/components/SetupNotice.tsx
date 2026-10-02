export function SetupNotice({ detail }: { detail: string }) {
  return (
    <div className="mx-auto my-20 max-w-xl rounded-lg border border-line bg-paper-raised p-8">
      <div className="eyebrow text-clay">Setup needed</div>
      <h2 className="display mt-3 text-2xl text-ink">
        The catalogue could not be loaded.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        This is almost always one of three things: the Supabase keys are missing
        from <code className="font-mono text-xs">.env.local</code>,{" "}
        <code className="font-mono text-xs">supabase/schema.sql</code> has not
        been run yet, or <code className="font-mono text-xs">supabase/seed.sql</code>{" "}
        has not been run. The README walks through all three.
      </p>
      <pre className="mt-5 overflow-x-auto rounded border border-line bg-paper p-3 font-mono text-xs text-muted">
        {detail}
      </pre>
    </div>
  );
}
