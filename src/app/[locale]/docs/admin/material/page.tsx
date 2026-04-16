import Link from "next/link";
import Image from "next/image";

export const metadata = {
    title: "Material-Konfiguration — Dokumentation",
};

export default function DocsAdminMaterialPage() {
    return (
        <>
            <h1>Material-Konfiguration</h1>
            <p className="lead">
                In der Material-Konfiguration werden <Link href="/docs/material">Materialgruppen und Materialtypen</Link> verwaltet.
                Diese Einstellungen gelten für die gesamte Organisation.
            </p>

            <hr />

            <figure className="mb-4">
                <Image src="/docs-screenshots/material-config-page.png" alt="Material-Konfiguration" className="img-fluid border rounded shadow-sm" width={1200} height={500} />
                <figcaption className="text-muted small mt-1">Material-Konfigurationsseite mit Materialgruppen und Sortierungs-Schiebereglern.</figcaption>
            </figure>

            <h2>Aufbau der Seite</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/material-config-group-detail.png" alt="Ansicht Gruppendetails" className="img-fluid border rounded shadow-sm" width={320} height={200} />
                    <figcaption className="text-muted small mt-1">Ansicht Gruppendetails</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>Die Seite ist in drei Bereiche unterteilt:</p>
                    <ol>
                        <li><strong>Gruppenauswahl</strong>: Alle Materialgruppen im Überblick. Per Klick wird eine Gruppe ausgewählt.</li>
                        <li><strong>Gruppendetails</strong>: Einstellungen der ausgewählten Gruppe (Name, Soll-Anzahl, Mehrere-Typen-Flag).</li>
                        <li><strong>Typenliste</strong>: Alle Materialtypen innerhalb der ausgewählten Gruppe.</li>
                    </ol>
                </div>
            </div>

            <h2>Materialgruppen verwalten</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/material-config-groups.png" alt="Ansicht Materialgruppen" className="img-fluid border rounded shadow-sm" width={260} height={170} />
                    <figcaption className="text-muted small mt-1">Ansicht Materialgruppen</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <ul>
                        <li><strong>Neue Gruppe anlegen</strong>: Bezeichnung, optionale Soll-Anzahl und &quot;Mehrere Typen erlaubt&quot;-Einstellung festlegen.</li>
                        <li><strong>Gruppe bearbeiten</strong>: Alle Felder nachträglich änderbar.</li>
                        <li><strong>Reihenfolge ändern</strong>: Gruppen können umsortiert werden.</li>
                        <li><strong>Gruppe löschen</strong>: Nur möglich, wenn die Gruppe keine Materialtypen mehr enthält.</li>
                    </ul>
                    <div className="alert alert-warning mb-0">
                        <strong>Hinweis:</strong> Eine Gruppe ohne Materialtypen wird auf der Personenseite als
                        Konfigurationsfehler angezeigt. Stelle sicher, dass jede Gruppe mindestens einen aktiven
                        Materialtyp enthält.
                    </div>
                </div>
            </div>

            <h2>Materialtypen verwalten</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <Image src="/docs-screenshots/material-config-type-list.png" alt="Ansicht Materialtypen" className="img-fluid border rounded shadow-sm" width={380} height={240} />
                    <figcaption className="text-muted small mt-1">Ansicht Materialtypen</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <ul>
                        <li><strong>Neuen Typ anlegen</strong>: Bezeichnung, Ist-Menge, Soll-Menge und Reihenfolge angeben.</li>
                        <li><strong>Typ bearbeiten</strong>: Alle Felder nachträglich änderbar.</li>
                        <li><strong>Typ deaktivieren</strong>: Deaktivierte Typen erscheinen nicht mehr bei der Ausgabe, bleiben aber für historische Daten erhalten.</li>
                        <li><strong>Reihenfolge ändern</strong>: Typen innerhalb einer Gruppe umsortieren.</li>
                    </ul>
                </div>
            </div>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Material-Konfiguration:</strong> Manager (Stufe 3) oder höher
            </div>
        </>
    );
}
