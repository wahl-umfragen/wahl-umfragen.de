/**
 * The civic-bold page hero: a short accent kicker rule above a heavy display
 * title, with an optional lead paragraph. Shared by every top-level route so
 * the headline treatment stays consistent. Renders an `<h2>` to preserve the
 * existing document outline (the site name in the header is the page `<h1>`).
 */
export function PageHeader({
  title,
  subtitle,
  className = "mb-10",
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={className}>
      <div
        aria-hidden="true"
        className="mb-3 h-1 w-12 rounded-full bg-accent"
      />
      <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 max-w-2xl text-muted sm:text-lg">{subtitle}</p>
      ) : null}
    </header>
  );
}
