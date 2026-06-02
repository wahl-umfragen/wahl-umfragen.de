import type { Metadata } from "next";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("impressumPage.metaTitle"),
};

/**
 * Static legal notice (Impressum) per § 5 DDG (Digitale-Dienste-Gesetz, the
 * successor of § 5 TMG) and § 18 Abs. 2 MStV. The content is single-locale
 * German legal prose, so it lives inline here rather than in the i18n catalog.
 *
 * [PLATZHALTER] markers must be filled with the real responsible party's data
 * before going live — an incomplete Impressum is an Abmahnung risk.
 */
export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h2 className="text-2xl font-semibold tracking-tight">
        {t("impressumPage.title")}
      </h2>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <section>
          <h3 className="text-base font-semibold text-foreground">
            Angaben gemäß § 5 DDG
          </h3>
          <p className="mt-2 whitespace-pre-line">
            {`[PLATZHALTER: Vor- und Nachname / Firma]
[PLATZHALTER: Straße und Hausnummer]
[PLATZHALTER: PLZ und Ort]
[PLATZHALTER: Land]`}
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">Kontakt</h3>
          <p className="mt-2 whitespace-pre-line">
            {`E-Mail: [PLATZHALTER: E-Mail-Adresse]
Telefon: [PLATZHALTER: optional]`}
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h3>
          <p className="mt-2 whitespace-pre-line">
            {`[PLATZHALTER: Vor- und Nachname]
[PLATZHALTER: Straße und Hausnummer]
[PLATZHALTER: PLZ und Ort]`}
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            Haftung für Inhalte
          </h3>
          <p className="mt-2">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte
            auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
            §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
            überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung
            oder Sperrung der Nutzung von Informationen nach den allgemeinen
            Gesetzen bleiben hiervon unberührt.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            Haftung für Links
          </h3>
          <p className="mt-2">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren
            Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
            fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
            der Seiten verantwortlich.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            Urheberrecht und Daten
          </h3>
          <p className="mt-2">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
            diesen Seiten unterliegen dem deutschen Urheberrecht. Die
            dargestellten Umfragedaten stammen von{" "}
            <a
              href="https://dawum.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              dawum.de
            </a>{" "}
            und stehen unter der{" "}
            <a
              href="https://opendatacommons.org/licenses/odbl/1-0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Open Database License (ODbL)
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
