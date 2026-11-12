interface LegalPlaceholderProps {
  title: string;
  message: string;
}

/** Temporary body for legal pages until their reviewed text is written (PLANO.md, Phase 8). */
export function LegalPlaceholder({ title, message }: LegalPlaceholderProps) {
  return (
    <article className="flex max-w-3xl flex-col gap-3">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted">{message}</p>
    </article>
  );
}
