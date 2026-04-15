import { faShirt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
    title: "Einzelteil-Panel — Dokumentation",
};

export default function DocsUniformDetailPage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faShirt} className="me-2" />Einzelteil-Panel</h1>
            <p className="lead">
                Das Einzelteil-Panel öffnet sich als seitliches Overlay (Offcanvas) und zeigt
                alle Details eines Uniformteils. Es ist von der Uniformliste aus über das
                externe Link-Symbol in jeder Tabellenzeile erreichbar.
            </p>

            <hr />

            <h2>Details</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/uniform-detail-information.png" alt="Ansicht Details" className="img-fluid border rounded shadow-sm" width={380} height={240} />
                    <figcaption className="text-muted small mt-1">Ansicht Details</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Der obere Bereich des Panels zeigt den aktuellen Status des Teils:
                        Reserve-Flag (ja/nein), zugewiesene <Link href="/docs/uniform/type">Generation</Link>,{" "}
                        <Link href="/docs/uniform/sizes">Größe</Link> und Kommentar.
                        Inspektoren und höhere Rollen können die Felder über <strong>Bearbeiten</strong>&nbsp;
                        ändern. Das Reserve-Flag ist nicht editierbar, wenn die <Link href="/docs/uniform/type">Generation</Link> als Reservegeneration
                        konfiguriert ist.
                    </p>
                </div>
            </div>


            <h2>Besitzer</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/uniform-detail-owner.png" alt="Ansicht Besitzer" className="img-fluid border rounded shadow-sm" width={380} height={240} />
                    <figcaption className="text-muted small mt-1">Ansicht Besitzer</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Zeigt, an wen das Teil aktuell ausgegeben ist, inklusive Ausgabedatum.
                        Ein Link führt direkt zur Detailseite der Person.
                        Ist das Teil nicht ausgegeben, wird dieser Bereich durch den Bereich <strong>Lagereinheit</strong> ersetzt.
                    </p>
                </div>
            </div>

            <h2>Lagereinheit</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/uniform-detail-storage.png" alt="Ansicht Lagereinheit" className="img-fluid border rounded shadow-sm" width={380} height={240} />
                    <figcaption className="text-muted small mt-1">Ansicht Lagereinheit</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Ist das Teil nicht ausgegeben, wird hier die zugewiesene <Link href="/docs/storage">Lagereinheit</Link> angezeigt.
                        Inspektoren und höhere Rollen können die Lagereinheit direkt in diesem Bereich ändern oder entfernen.
                        Ist keine Lagereinheit gesetzt, bleibt das Feld leer.
                    </p>
                    <div className="alert alert-secondary mb-0">
                        Ein Teil kann nicht gleichzeitig einer Person <em>und</em> einer Lagereinheit zugewiesen sein.
                        Wird ein Teil ausgegeben, wird die Lagereinheit automatisch entfernt.
                    </div>
                </div>
            </div>
            
            <h2>Mängel</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/uniform-detail-deficiency.png" alt="Ansicht Mängel" className="img-fluid border rounded shadow-sm" width={380} height={240} />
                    <figcaption className="text-muted small mt-1">Ansicht Mängel</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Zeigt alle offenen Mängel, die direkt am Uniformteil erfasst wurden
                        (Abhängigkeit <em>Uniformteil</em>). Neue Mängel können über <strong>Anlegen +</strong>
                        hinzugefügt werden. Behobene Mängel lassen sich über den Schalter einblenden.
                    </p>
                </div>
            </div>

            <h2>Historie</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/uniform-detail-history.png" alt="Ansicht Historie" className="img-fluid border rounded shadow-sm" width={380} height={240} />
                    <figcaption className="text-muted small mt-1">Ansicht Historie</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Die vollständige Ausgabehistorie des Teils: wann es an wen ausgegeben und
                        wann es zurückgegeben wurde. Die aktuell laufende Ausgabe erscheint ohne
                        Rückgabedatum.
                    </p>
                </div>
            </div>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Bearbeiten / Mängel erfassen:</strong> Inspektor (Stufe 2) oder höher
            </div>
        </>
    );
}
