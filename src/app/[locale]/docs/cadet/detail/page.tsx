import { faDisplay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const metadata = {
    title: "Personendetail — Dokumentation",
};

export default function DocsCadetDetailPage() {
    return (
        <>
            <h1 className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faDisplay} className="me-2" />
                    <span>Personendetail</span>
                </div>
                <span className="badge bg-secondary-subtle text-secondary border align-middle" style={{ fontSize: '0.45em' }}>Detailseite</span>
            </h1>
            <p className="lead">
                Die Detailseite zeigt alle relevanten Informationen einer Person auf einen Blick:
                persönliche Daten, offene Mängel, ausgegebene Uniformteile und Material.
                Abhängig von der Rolle können die Daten direkt bearbeitet werden.
            </p>

            <hr />


            <h2>Personaldaten</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <img src="/docs-screenshots/cadet-detail-data.png" alt="Ansicht Personaldaten" className="img-fluid border rounded shadow-sm" style={{ maxWidth: "220px" }} />
                    <figcaption className="text-muted small mt-1">Ansicht Personaldaten</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Der oberste Bereich der Seite zeigt Vor- und Nachname, den aktuellen Status
                        (aktiv/inaktiv) sowie das Datum der letzten Kontrolle. Der Kommentar kann
                        für interne Notizen genutzt werden.
                    </p>
                    <p>
                        Inspektoren und höhere Rollen können die Daten über den Bearbeiten-Button
                        direkt inline bearbeiten.
                    </p>
                </div>
            </div>

            <h2>Mängel</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <img src="/docs-screenshots/cadet-detail-deficiency.png" alt="Ansicht Mängel" className="img-fluid border rounded shadow-sm" style={{ maxWidth: "340px" }} />
                    <figcaption className="text-muted small mt-1">Ansicht Mängel</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Direkt unterhalb der Personaldaten werden alle aktuell <strong>offenen Mängel</strong> der
                        Person aufgelistet. Jeder Mangel zeigt Beschreibung, Mängeltyp, Erstellungsdatum
                        und einen optionalen Kommentar.
                    </p>
                    <p>
                        Dieser Bereich ist nur sichtbar, wenn offene Mängel vorhanden sind.
                        Behobene Mängel tauchen hier nicht auf.
                    </p>
                </div>
            </div>

            <h2>Uniformteile</h2>
            <p>
                Zeigt alle aktuell ausgegebenen Uniformteile, gruppiert nach Uniformtyp.
                Für jeden Typ wird die <strong>Soll-Anzahl</strong> (konfiguriert am Typ) der
                tatsächlich ausgegebenen Anzahl gegenübergestellt. Eine abweichende Ist-Anzahl
                wird farblich hervorgehoben.
            </p>
            <p>
                Pro Teil sind Nummer, Generation, Größe und Kommentar sichtbar. Über die Symbole
                rechts/ links lässt sich ein Teil zurücknehmen, tauschen (Rücknahme + neue Ausgabe in
                einem Schritt) oder die Detailansicht des Uniformteils öffnen.
            </p>
            <p>
                Das <strong>+</strong>-Symbol am Typkopf öffnet die Ausgabe eines neuen Uniformteils für diesen Typ.
            </p>

            <div className="alert alert-warning">
                <strong>Anzahl Orange:</strong> Es sind weniger Teile ausgegeben als Soll-Anzahl (z.B. 2 von 3)
            </div>

            <figure className="mb-4 m-0">
                <img src="/docs-screenshots/cadet-detail-uniform.png" alt="Ansicht Uniformteile" className="img-fluid border rounded shadow-sm" />
                <figcaption className="text-muted small mt-1">Ansicht Uniformteile</figcaption>
            </figure>

            <h2>Material</h2>
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start mb-4">
                <figure className="flex-shrink-0 order-2 order-md-1 m-0">
                    <img src="/docs-screenshots/cadet-detail-material.png" alt="Ansicht Material" className="img-fluid border rounded shadow-sm" style={{ maxWidth: "300px" }} />
                    <figcaption className="text-muted small mt-1">Ansicht Material</figcaption>
                </figure>
                <div className="order-1 order-md-2">
                    <p>
                        Zeigt ausgegebenes Material, gruppiert nach Materialgruppe. Pro Gruppe sind
                        alle Materialtypen mit ihrer ausgegebenen Menge sichtbar.
                        Über die Symbole rechts kann die Menge geändert oder das Material zurückgenommen werden.
                    </p>
                    <p>
                        Das <strong>+</strong>-Symbol am Gruppenkopf öffnet die Ausgabe eines neuen Materialtyps
                        aus dieser Gruppe.
                    </p>
                    <div className="alert alert-warning mb-0">
                        <strong>Gruppenname in Rot:</strong> Die Gruppe erlaubt nur die Ausgabe von einem Materialtyp, es ist aber mehr als ein Typ ausgegeben.<br/>
                        <strong>Menge in Orange:</strong> Es ist mehr/ oder weniger als die soll-Menge eines Materialtyps ausgegeben (z.B. 2 statt 4).
                    </div>
                </div>
            </div>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Bearbeiten / Ausgeben / Zurücknehmen:</strong> Inspektor (Stufe 2) oder höher
            </div>
        </>
    );
}
