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
      className="mt-12 border-t border-border pt-8"
    >
      <h2 className="eyebrow">{title}</h2>
      <div className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
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
      className="mt-12 border-t border-border pt-8"
    >
      <h2 className="eyebrow">Häufige Fragen</h2>
      <dl className="mt-4 max-w-3xl space-y-5">
        {FAQ.map((f) => (
          <div key={f.question}>
            <dt className="font-semibold text-foreground">{f.question}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">
              {f.answer}
            </dd>
          </div>
        ))}
      </dl>
      <JsonLd data={faqLd()} />
    </section>
  );
}
