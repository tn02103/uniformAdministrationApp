import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const metadata = {
    title: "Lagerverwaltung — Dokumentation",
};

export default function DocsStorageOverviewPage() {
    return (
        <>
            <h1>
                <FontAwesomeIcon icon={faBoxOpen} className="me-2" />
                Lagerverwaltung
                <span className="badge bg-secondary-subtle text-secondary border ms-2 align-middle" style={{ fontSize: '0.45em' }}>Übersichtsseite</span>
            </h1>
            <p className="lead">
                Die Lagerverwaltungsseite zeigt alle Lagereinheiten der Organisation auf einen Blick
                und ermöglicht die Verwaltung der darin enthaltenen Uniformteile.
            </p>

            <hr />

            <figure className="mb-4">
                <img src="/docs-screenshots/storage-page.png" alt="Ansicht Lagerverwaltungsseite" className="img-fluid border rounded shadow-sm" />
                <figcaption className="text-muted small mt-1">Ansicht Lagerverwaltungsseite</figcaption>
            </figure>

            <h2>Übersichtstabelle</h2>
            <p>
                Die Tabelle listet alle Lagereinheiten mit Name, Beschreibung, Kapazität,
                Reserve-Flag (<em>Für Reserven</em>) und der aktuellen Anzahl zugewiesener Uniformteile.
                Über das externe Link-Symbol am Zeilenende öffnet sich das Detailpanel der Einheit.
            </p>
            <p>
                Eine neue Lagereinheit kann über das <strong>+</strong>-Symbol im Tabellenkopf angelegt werden.
            </p>

            <h2>Detailpanel</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <img src="/docs-screenshots/storage-panel-details.png" alt="Ansicht Detailpanel" className="img-fluid border rounded shadow-sm" style={{ maxWidth: "380px" }} />
                    <figcaption className="text-muted small mt-1">Ansicht Detailpanel</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Das Detailpanel öffnet sich als seitliches Overlay. Es zeigt Beschreibung,
                        Kapazität und das Reserve-Flag der Einheit. Über <strong>Bearbeiten</strong>
                        &nbsp;können alle Felder geändert werden.
                    </p>
                    <p>
                        Im unteren Teil des Panels befinden sich alle aktuell in dieser Einheit gelagerten
                        Uniformteile, die nach Uniformtyp und Generation angezeigt werden.
                    </p>
                </div>
            </div>

            <h2>Uniformteile zuweisen</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <img src="/docs-screenshots/storage-panel-items.png" alt="Ansicht Uniformteile" className="img-fluid border rounded shadow-sm" style={{ maxWidth: "380px" }} />
                    <figcaption className="text-muted small mt-1">Ansicht Uniformteile der Lagereinheit</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Im Detailpanel gibt es ein Eingabefeld <em>Uniformteil(e) hinzufügen</em>.
                        Zur Suche kann neben der reinen Nummer auch eine Kombination aus
                        Organisations-Kürzel, Typname und Nummer verwendet werden. Die einzelnen
                        Teile werden durch ein <strong>Leerzeichen</strong> oder einen <strong>Bindestrich</strong> getrennt
                        und können in beliebiger Reihenfolge eingegeben werden:
                    </p>
                    <ul>
                        <li><code>125</code> — nur Nummer</li>
                        <li><code>AA-125</code> oder <code>AA 125</code> — Kürzel und Nummer</li>
                        <li><code>Typ2 25</code> oder <code>25 Typ2</code> — Typname und Nummer</li>
                        <li><code>AA-Typ2-25</code> oder <code>AA Typ2 25</code> — Kürzel, Typname und Nummer</li>
                    </ul>
                    <p>
                        Nach Bestätigung wird das gefundene Teil der Einheit zugewiesen — vorausgesetzt es ist nicht ausgegeben.
                    </p>
                    <p>
                        Alternativ lässt sich die Lagereinheit direkt am Uniformteil setzen: im
                        Einzelteil-Panel des Teils gibt es ein entsprechendes Feld.
                    </p>
                </div>
            </div>
           
            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Verwalten &amp; Teile zuweisen:</strong> Inspektor (Stufe 2) oder höher
            </div>
        </>
    );
}
