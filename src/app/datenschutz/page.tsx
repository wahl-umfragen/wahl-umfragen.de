import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/i18n";
import { buildMetadata, PAGE_META } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  ...PAGE_META.datenschutz,
  path: "/datenschutz",
  noindex: true,
});

/**
 * Static privacy policy (Datenschutzerklärung) per DSGVO. Single-locale German
 * legal prose lives inline rather than in the i18n catalog.
 *
 * This text describes the *current* data practices: our own cookieless,
 * self-hosted countless analytics (no consent gate, no third party), server
 * logfiles, and the dawum.de data source. If the analytics setup or hosting
 * changes, update this page accordingly.
 * [PLATZHALTER] markers must be filled before going live.
 */
export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div
        aria-hidden="true"
        className="mb-3 h-1 w-12 rounded-full bg-accent"
      />
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("datenschutzPage.title")}
      </h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
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
            <span className="whitespace-pre-line">{`IONOS SE, Elgendorfer Straße 57, 56410 Montabaur`}</span>{" "}
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
            3. Content-Delivery-Network und Sicherheit (Cloudflare)
          </h3>
          <p className="mt-2">
            Zur sicheren und performanten Auslieferung dieser Website nutzen wir
            das Content-Delivery-Network der Cloudflare, Inc., 101 Townsend
            Street, San Francisco, CA 94107, USA. Sämtlicher Datenverkehr wird
            über die Server von Cloudflare geleitet; dabei verarbeitet
            Cloudflare Zugriffsdaten einschließlich der IP-Adresse, um Inhalte
            auszuliefern und Angriffe (etwa DDoS) abzuwehren. Rechtsgrundlage
            ist unser berechtigtes Interesse an einer sicheren und effizienten
            Bereitstellung unseres Angebots (Art. 6 Abs. 1 lit. f DSGVO). Die
            Verarbeitung erfolgt teilweise in den USA; Grundlage der
            Übermittlung in ein Drittland sind die Standardvertragsklauseln der
            EU-Kommission (Art. 46 DSGVO). Mit Cloudflare besteht ein Vertrag
            zur Auftragsverarbeitung gemäß Art. 28 DSGVO.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            4. Server-Logfiles
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
            spätestens 7 Tagen gelöscht.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            5. Reichweitenmessung (countless)
          </h3>
          <p className="mt-2">
            Zur statistischen Auswertung der Besuche nutzen wir{" "}
            <strong className="font-medium text-foreground">countless</strong>,
            eine von uns selbst betriebene, cookielose Analyselösung. Die
            Auswertung erfolgt ausschließlich auf unserer eigenen Infrastruktur
            – es ist{" "}
            <strong className="font-medium text-foreground">
              kein externer Analyse-Dienstleister
            </strong>{" "}
            eingebunden und es werden keine Daten an Dritte weitergegeben.
          </p>
          <p className="mt-2">
            countless arbeitet{" "}
            <strong className="font-medium text-foreground">
              cookielos und ohne personenbezogene Daten
            </strong>
            : Es werden keine Cookies gesetzt, nichts auf Ihrem Endgerät
            gespeichert oder ausgelesen und keine Daten über mehrere Geräte oder
            Websites hinweg zusammengeführt. Zur Zählung tagesbezogener Besuche
            wird aus IP-Adresse, Browserkennung und einem täglich wechselnden,
            danach gelöschten Zufallswert ein nicht umkehrbarer Tageskennwert
            gebildet. IP-Adresse und Browserkennung dienen ausschließlich dieser
            kurzzeitigen Berechnung und werden{" "}
            <strong className="font-medium text-foreground">
              nicht gespeichert
            </strong>
            ; der Tageskennwert lässt sich keiner Person zuordnen und ist über
            Tage hinweg nicht verknüpfbar. Erhoben werden lediglich aggregierte
            Kennzahlen wie Seitenaufrufe, Referrer und ungefähre Herkunftsregion
            (Land).
          </p>
          <p className="mt-2">
            Da hierbei keine personenbezogenen Daten verarbeitet und keine
            Informationen auf Ihrem Endgerät gespeichert oder ausgelesen werden,
            ist hierfür keine Einwilligung erforderlich. Soweit eine
            Verarbeitung erfolgt, beruht sie auf unserem berechtigten Interesse
            an einer datensparsamen Analyse des Nutzungsverhaltens (Art. 6 Abs.
            1 lit. f DSGVO).
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            6. Cookies
          </h3>
          <p className="mt-2">
            Diese Website setzt keine Tracking- oder Marketing-Cookies.
            Lediglich technisch notwendige lokale Einstellungen (z. B. Ihre
            Auswahl des Farbschemas) werden im lokalen Speicher (localStorage)
            Ihres Browsers abgelegt und nicht an uns übertragen.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            7. Ihre Rechte
          </h3>
          <p className="mt-2">
            Sie haben im Rahmen der gesetzlichen Vorgaben jederzeit das Recht
            auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung
            (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO),
            Datenübertragbarkeit (Art. 20 DSGVO) sowie auf Widerspruch gegen die
            Verarbeitung (Art. 21 DSGVO). Wenden Sie sich hierzu an die im
            Impressum genannte Stelle.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            8. Beschwerderecht bei der Aufsichtsbehörde
          </h3>
          <p className="mt-2">
            Unbeschadet anderweitiger Rechtsbehelfe steht Ihnen ein
            Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu, wenn Sie
            der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen
            Daten gegen die DSGVO verstößt.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-foreground">
            9. Datenquelle der Umfragen
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
            . Es handelt sich um aggregierte, nicht personenbezogene Daten. Die
            zum Vergleich dargestellten amtlichen Wahlergebnisse stammen von{" "}
            <a
              href="https://www.bundeswahlleiterin.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Die Bundeswahlleiterin
            </a>{" "}
            (amtliche Daten, Verwendung mit Quellenangabe); auch hierbei handelt
            es sich um nicht personenbezogene Daten.
          </p>
        </section>
      </div>
    </div>
  );
}
