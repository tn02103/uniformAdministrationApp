import { faClipboardCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const metadata = {
    title: "Kontrolle durchführen — Dokumentation",
};

export default function DocsInspectionConductPage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faClipboardCheck} className="me-2" />Kontrolle durchführen</h1>
            <p className="lead">
                Die Kontroll-Durchführungsansicht führt eine Inspektionskraft durch die Prüfung
                aller anwesenden Personen. Der Ablauf gliedert sich in drei Schritte.
            </p>

            <hr />

            {/* IMG: Gesamtansicht der Kontroll-Durchführungsseite */}

            <h2>Schritt 1: Kontrolle öffnen</h2>
            <p>
                Auf der <Link href="/docs/inspection">Kontrollübersicht</Link> wird eine geplante
                Kontrolle ausgewählt. Nur Inspektoren (Stufe 2) oder höher können eine Kontrolle
                starten. Nach dem Start wechselt die Kontrolle in den Status <em>aktiv</em>.
            </p>
            <p>
                Sobald eine Kontrolle aktiv ist, erscheinen auf der{" "}
                <Link href="/docs/cadet/list">Personalliste</Link> zusätzliche Filteroptionen.
            </p>

            {/* IMG: Kontrollübersicht mit "aktiver" Kontrolle */}

            <h2>Schritt 2: Personen prüfen</h2>
            <p>
                Die Kontrollansicht zeigt alle Personen der Organisation. Pro Person kann der Inspektor:
            </p>
            <ul>
                <li>
                    <strong>Uniform vollständig</strong> bestätigen — wenn die Person alle Teile korrekt trägt.
                </li>
                <li>
                    <strong>Mängel erfassen</strong> — fehlende, beschädigte oder falsche Teile werden mit
                    einem <Link href="/docs/inspection/deficiencies">Mängeltyp</Link>, einer Beschreibung und
                    einem optionalen Kommentar dokumentiert.
                </li>
                <li>
                    <strong>Bestehende Mängel als behoben markieren</strong> — wenn ein vorheriger Mangel bei
                    dieser Kontrolle korrigiert wurde.
                </li>
            </ul>

            {/* IMG: Personenzeile während einer Kontrolle mit Aktionsbuttons */}
            {/* IMG: Formular zum Erfassen eines neuen Mangels */}

            <h2>Abmeldungen</h2>
            <p>
                Personen, die für diese Kontrolle abgemeldet sind, werden als <em>abwesend</em>{" "}
                gekennzeichnet. Sie können nicht geprüft werden und erscheinen separat in der Liste.
                Abgemeldete Personen werden beim Kontrollfortschritt nicht als fehlend gewertet.
            </p>

            {/* IMG: Abgemeldete Person in der Liste */}

            <h2>Schritt 3: Kontrolle abschließen</h2>
            <p>
                Nach der Prüfung aller Personen kann die Kontrolle abgeschlossen werden.
                Der Status wechselt auf <em>abgeschlossen</em>. Ist in den{" "}
                <Link href="/docs/admin/settings">Organisationseinstellungen</Link> eine E-Mail-Adresse
                hinterlegt, wird nach dem Abschluss automatisch ein Bericht versandt.
            </p>

            {/* IMG: Abschluss-Dialog */}

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Kontrolle durchführen:</strong> Inspektor (Stufe 2) oder höher
            </div>
        </>
    );
}
