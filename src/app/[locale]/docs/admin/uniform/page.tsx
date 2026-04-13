import Link from "next/link";

export const metadata = {
    title: "Uniform-Konfiguration — Dokumentation",
};

export default function DocsAdminUniformPage() {
    return (
        <>
            <h1>Uniform-Konfiguration</h1>
            <p className="lead">
                In der Uniform-Konfiguration werden <Link href="/docs/uniform/type">Uniformtypen und Generationen</Link> sowie{" "}
                <Link href="/docs/uniform/sizes">Größen und Größenlisten</Link> verwaltet.
                Diese Einstellungen gelten für die gesamte Organisation.
            </p>

            <hr />

            <figure className="mb-4">
                <img src="/docs-screenshots/uniform-config-type-list.png" alt="Uniform-Konfiguration" className="img-fluid border rounded shadow-sm" />
                <figcaption className="text-muted small mt-1">Uniform-Konfigurationsseite mit Uniformtypen und Größenlisten.</figcaption>
            </figure>

            <h2>Uniformtypen verwalten</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <img src="/docs-screenshots/uniform-config-type-details.png" alt="Ansicht Uniformtyp-Details" className="img-fluid border rounded shadow-sm" style={{ maxWidth: "380px" }} />
                    <figcaption className="text-muted small mt-1">Ansicht Uniformtyp-Details</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Die Tabelle zeigt alle bestehenden Uniformtypen. Folgende Aktionen sind möglich:
                    </p>
                    <ul>
                        <li><strong>Neuen Typ anlegen</strong>: Name, Kürzel, Soll-Anzahl, Generationen-Flag, Größen-Flag und optionale Standard-Größenliste angeben.</li>
                        <li><strong>Typ bearbeiten</strong>: Alle Felder können nachträglich geändert werden.</li>
                        <li><strong>Reihenfolge ändern</strong>: Typen können per Drag-and-Drop oder Pfeiltasten umsortiert werden.</li>
                        <li><strong>Typ löschen</strong>: Nur möglich, wenn keine Uniformteile dieses Typs existieren.</li>
                    </ul>
                </div>
            </div>

            <h2>Generationen verwalten</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <img src="/docs-screenshots/uniform-config-generation-list.png" alt="Ansicht Generationsliste" className="img-fluid border rounded shadow-sm" style={{ maxWidth: "380px" }} />
                    <figcaption className="text-muted small mt-1">Ansicht Generationsliste</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Für jeden Uniformtyp, der Generationen verwendet, können Generationen angelegt und
                        verwaltet werden. Klicke auf einen Typ, um dessen Generationen einzusehen.
                    </p>
                    <ul>
                        <li><strong>Neue Generation anlegen</strong>: Name, optionale Größenliste, Reserve-Flag und Reihenfolge festlegen.</li>
                        <li><strong>Generation bearbeiten</strong>: Alle Felder nachträglich änderbar.</li>
                        <li><strong>Generation löschen</strong>: Nur möglich, wenn keine Uniformteile dieser Generation existieren.</li>
                    </ul>
                </div>
            </div>

            <h2>Größenlisten verwalten</h2>
            <p>
                Im Abschnitt <em>Größenlisten</em> derselben Seite können Größenlisten angelegt,
                umbenannt und mit Größen befüllt werden.
            </p>

            <h2>Größen verwalten</h2>
            <p>
                Unter dem Menüpunkt <strong>Größen</strong> werden die globalen Größen der Organisation
                verwaltet (Bezeichnungen und Reihenfolge). Diese Größen können dann zu Größenlisten
                zusammengestellt werden.
            </p>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Uniform-Konfiguration:</strong> Manager (Stufe 3) oder höher
            </div>
        </>
    );
}
