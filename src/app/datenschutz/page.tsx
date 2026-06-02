import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("datenschutzPage.metaTitle"),
};

/**
 * Static privacy policy (Datenschutzerklärung) per DSGVO. Single-locale German
 * legal prose lives inline rather than in the i18n catalog.
 *
 * This text describes the *current* data practices: cookieless Plausible
 * analytics (no consent gate), server logfiles, and the dawum.de data source.
 * If the analytics provider or hosting changes, update this page accordingly.
 * [PLATZHALTER] markers must be filled before going live.
 */
export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h2 className="text-2xl font-semibold tracking-tight">
        {t("datenschutzPage.title")}
      </h2>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <section>
          <h3 className="text-base font-semibold text-foreground">
            1. Verantwortlicher
          </h3>
          <p className="mt-2">
            Verantwortlich für die Datenverarbeitung auf dieser Website ist die
            im{" "}
            <Link href="/impressum" className="underline">
              Impressum
            </Link>{" "}
            genannte Stelle.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            2. Hosting
          </h3>
          <p className="mt-2">
            Diese Website wird bei{" "}
            <span className="whitespace-pre-line">{`[PLATZHALTER: Hosting-Anbieter, Anschrift]`}</span>{" "}
            gehostet. Der Anbieter verarbeitet in unserem Auftrag
            personenbezogene Daten (insbesondere Zugriffsdaten, siehe
            Server-Logfiles) auf Grundlage eines Vertrags zur
            Auftragsverarbeitung gemäß Art. 28 DSGVO. Rechtsgrundlage ist unser
            berechtigtes Interesse an einer sicheren und effizienten
            Bereitstellung unseres Angebots (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            3. Server-Logfiles
          </h3>
          <p className="mt-2">
            Beim Aufruf dieser Website erhebt der Hosting-Anbieter automatisch
            Informationen, die Ihr Browser übermittelt (Server-Logfiles): u. a.
            Browsertyp und -version, verwendetes Betriebssystem, Referrer-URL,
            Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage und
            IP-Adresse. Diese Daten werden nicht mit anderen Datenquellen
            zusammengeführt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; das
            berechtigte Interesse liegt in der technisch fehlerfreien
            Darstellung und Sicherheit der Website. Die Logfiles werden nach
            spätestens [PLATZHALTER: z. B. 7] Tagen gelöscht.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            4. Reichweitenmessung mit Plausible Analytics
          </h3>
          <p className="mt-2">
            Zur statistischen Auswertung der Besuche nutzen wir Plausible
            Analytics. Plausible arbeitet{" "}
            <strong className="font-medium text-foreground">
              cookielos und ohne personenbezogene Daten
            </strong>
            : Es werden keine Cookies gesetzt und keine Daten über mehrere
            Geräte oder Websites hinweg zusammengeführt. IP-Adressen werden
            ausschließlich kurzzeitig und anonymisiert zur Generierung eines
            tagesbezogenen, nicht zurückverfolgbaren Zählwerts verarbeitet und
            nicht gespeichert. Es werden lediglich aggregierte Kennzahlen wie
            Seitenaufrufe, Referrer und ungefähre Herkunftsregion erhoben.
          </p>
          <p className="mt-2">
            Da hierbei keine personenbezogenen Daten verarbeitet und keine
            Informationen auf Ihrem Endgerät gespeichert oder ausgelesen werden,
            ist hierfür keine Einwilligung erforderlich. Soweit eine Verarbeitung
            erfolgt, beruht sie auf unserem berechtigten Interesse an einer
            datensparsamen Analyse des Nutzungsverhaltens (Art. 6 Abs. 1 lit. f
            DSGVO). Weitere Informationen finden Sie in der{" "}
            <a
              href="https://plausible.io/data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Datenschutzrichtlinie von Plausible
            </a>
            .
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            5. Cookies
          </h3>
          <p className="mt-2">
            Diese Website setzt keine Tracking- oder Marketing-Cookies. Lediglich
            technisch notwendige lokale Einstellungen (z. B. Ihre Auswahl des
            Farbschemas sowie die Bestätigung des Hinweisbanners) werden im
            lokalen Speicher (localStorage) Ihres Browsers abgelegt und nicht an
            uns übertragen.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            6. Ihre Rechte
          </h3>
          <p className="mt-2">
            Sie haben im Rahmen der gesetzlichen Vorgaben jederzeit das Recht auf
            Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung
            (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO),
            Datenübertragbarkeit (Art. 20 DSGVO) sowie auf Widerspruch gegen die
            Verarbeitung (Art. 21 DSGVO). Wenden Sie sich hierzu an die im
            Impressum genannte Stelle.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            7. Beschwerderecht bei der Aufsichtsbehörde
          </h3>
          <p className="mt-2">
            Unbeschadet anderweitiger Rechtsbehelfe steht Ihnen ein
            Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu, wenn Sie
            der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten
            gegen die DSGVO verstößt.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            8. Datenquelle der Umfragen
          </h3>
          <p className="mt-2">
            Die dargestellten Umfragedaten stammen von{" "}
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
            . Es handelt sich um aggregierte, nicht personenbezogene Daten.
          </p>
        </section>
      </div>
    </div>
  );
}
