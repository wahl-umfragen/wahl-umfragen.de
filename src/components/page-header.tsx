/**
 * The civic-bold page hero: a short accent kicker rule above a heavy display
 * title, with an optional lead paragraph. Shared by every top-level route so
 * the headline treatment stays consistent. Renders the page's single `<h1>`:
 * the wordmark in the header is intentionally not a heading, so this stays the
 * unique, descriptive heading that identifies each view to search engines.
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
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-2xl text-muted sm:text-lg">{subtitle}</p>
      ) : null}
    </header>
  );
}
