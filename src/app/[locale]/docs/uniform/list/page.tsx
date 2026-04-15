import { faShirt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
    title: "Uniformliste — Dokumentation",
};

export default function DocsUniformListPage() {
    return (
        <>
            <h1>
                <FontAwesomeIcon icon={faShirt} className="me-2" />
                Uniformliste
                <span className="badge bg-secondary-subtle text-secondary border ms-2 align-middle" style={{ fontSize: '0.45em' }}>Übersichtsseite</span>
            </h1>
            <p className="lead">
                Die Uniformliste zeigt alle Teile eines bestimmten Uniformtyps.
                Über Filter und Suche lässt sich der Bestand schnell eingrenzen.
            </p>

            <hr />
            <figure className="mb-4">
                <Image src="/docs-screenshots/uniform-list-page.png" alt="Ansicht Uniformliste" className="img-fluid border rounded shadow-sm" width={1200} height={500} />
                <figcaption className="text-muted small mt-1">Ansicht Uniformliste</figcaption>
            </figure>


            <h2 className="text-center">Filterpanel</h2>
            <h3>Typauswahl</h3>
            <p>
                Über das Dropdown oben links wird der anzuzeigende Uniformtyp ausgewählt.
                Nach der Auswahl lädt die Tabelle automatisch die Teile dieses Typs.
                Die aktuelle Typauswahl ist auch in der URL sichtbar.
            </p>

            <h3>Suche</h3>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/uniform-list-search.png" alt="Ansicht Suchfeld" className="img-fluid border rounded shadow-sm" width={250} height={160} />
                    <figcaption className="text-muted small mt-1">Ansicht Suchfeld</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Das Suchfeld akzeptiert drei Eingabeformate:
                    </p>
                    <ul>
                        <li><strong>Nur Nummer</strong> — z.&nbsp;B. <code>1100</code></li>
                        <li><strong>Kürzel + Bindestrich | Leerzeichen + Nummer</strong> — z.&nbsp;B. <code>AA-1100</code> oder <code>AA 1100</code></li>
                        <li><strong>Kürzel direkt vor der Nummer</strong> — z.&nbsp;B. <code>AA1100</code></li>
                    </ul>
                    <p>
                        Das Kürzel ist das zweistellige Kürzel des Uniformtyps und ermöglicht
                        eine typübergreifende Suche ohne vorherige Typauswahl.
                    </p>
                </div>
            </div>

            <h3>Filter</h3>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/uniform-list-filter.png" alt="Ansicht Filterpanel" className="img-fluid border rounded shadow-sm" width={280} height={180} />
                    <figcaption className="text-muted small mt-1">Ansicht Filterpanel</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Die Filterpanel sind ausklappbar und ermöglichen die Eingrenzung nach:
                    </p>
                    <ul>
                        <li><strong>Generation</strong> — mehrere auswählbar, nur sichtbar wenn der Typ Generationen verwendet</li>
                        <li><strong>Größe</strong> — mehrere auswählbar, nur sichtbar wenn der Typ Größen verwendet</li>
                        <li><strong>Weitere Filter:</strong> Reserve-Status (nur Reserveteile / keine Reserveteile) und Ausgabe-Status (ausgegeben / nicht ausgegeben / in einer Lagereinheit)</li>
                    </ul>
                    <p>
                        Die Filter werden erst nach Klick auf <strong>Laden</strong> angewendet.
                    </p>
                </div>
            </div>

            <h2 className="text-center">Tabelle</h2>
            <p>
                Jede Tabellenzeile zeigt Nummer, Generation, Größe, aktuellen Besitzer und Kommentar.
                Das <strong>R</strong>-Badge an der Nummer kennzeichnet Reserveteile.
                Ein Besitzer-Link führt direkt zur Detailseite der Person.
            </p>
                <p>
                Das externe Link-Symbol am Zeilenende öffnet das{" "}
                <Link href="/docs/uniform/detail">Einzelteil-Panel</Link> für dieses Teil.
            </p>

            <figure className="mb-4">
                <Image src="/docs-screenshots/uniform-list-table.png" alt="Ansicht Tabelle" className="img-fluid border rounded shadow-sm" width={800} height={400} />
                <figcaption className="text-muted small mt-1">Ansicht Tabelle</figcaption>
            </figure>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer
            </div>
        </>
    );
}
