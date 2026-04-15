import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

export const metadata = {
    title: "Dashboard — Dokumentation",
};

export default function DocsDashboardPage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faChartLine} className="me-2" />Dashboard &amp; Auswertungen</h1>
            <p className="lead">
                Das Dashboard bietet grafische Auswertungen über den Uniformbestand der Organisation.
                Es ist über den Menüpunkt <strong>Dashboard</strong> erreichbar.
            </p>

            <hr />

            <figure className="my-4">
                <Image src="/docs-screenshots/ss-dashboard.png" alt="Dashboard" className="img-fluid border rounded shadow-sm" width={1200} height={500} />
                <figcaption className="text-muted small mt-1">Dashboard mit Balkendiagramm zur Verteilung der Uniformteile nach Typ.</figcaption>
            </figure>

            <h2>Uniformbestand nach Typ</h2>
            <p>
                Das erste Diagramm zeigt eine Gesamtübersicht aller Uniformtypen: Wie viele Teile
                gibt es pro Typ, und wie viele davon sind aktuell ausgegeben vs. im Lager?
                Dies ermöglicht eine schnelle Einschätzung der Verfügbarkeit.
            </p>

            <h2>Uniformbestand nach Größe</h2>
            <p>
                Das zweite Diagramm zeigt für einen ausgewählten Uniformtyp die Verteilung der
                Teile nach Größe. Über ein Dropdown kann der Typ gewechselt werden. So lässt sich
                erkennen, ob bestimmte Größen unterversorgt sind.
            </p>

            <h2>Export</h2>
            <p>
                Über die Export-Links auf dem Dashboard können Bestandsdaten als Datei heruntergeladen
                werden (z. B. für externe Auswertungen oder Berichte).
            </p>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Dashboard anzeigen:</strong> Manager (Stufe 3) oder höher
            </div>
        </>
    );
}
