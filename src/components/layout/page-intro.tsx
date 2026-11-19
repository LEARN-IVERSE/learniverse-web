/** Page title block: small eyebrow line, big display heading and a one-line description. */
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold tracking-[.25em] text-blue-600 uppercase">{eyebrow}</p>
      <h1 className="mt-1 font-heading text-4xl leading-tight font-extrabold text-slate-900">{title}</h1>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
  );
}
