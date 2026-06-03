import { FAQ, faqLd } from "@/lib/seo";
import { JsonLd } from "./json-ld";

/**
 * Visible, indexable explanatory prose under a section. Gives crawlers (and
 * readers) the context that the charts and tables alone don't carry. Rendered
 * server-side so the text is in the static HTML.
 */
export function SeoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-testid="seo-section"
      className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      <div className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

/** Home-page FAQ: visible accordion-free list plus FAQPage JSON-LD. */
export function FaqSection() {
  return (
    <section
      data-testid="faq"
      className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Häufige Fragen
      </h2>
      <dl className="mt-4 max-w-3xl space-y-5">
        {FAQ.map((f) => (
          <div key={f.question}>
            <dt className="font-medium text-foreground">{f.question}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {f.answer}
            </dd>
          </div>
        ))}
      </dl>
      <JsonLd data={faqLd()} />
    </section>
  );
}
