import { faClipboardCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const metadata = {
    title: "Kontrollen — Dokumentation",
};

export default function DocsInspectionPage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faClipboardCheck} className="me-2" />Kontrollen</h1>
            <p className="lead">
                Eine <strong>Kontrolle</strong> ist eine periodische Prüfung, bei der überprüft wird,
                ob Personen der Organisation ihre vollständige Ausrüstung korrekt tragen.
            </p>

            <hr />

            <h2>Eigenschaften</h2>
            <div className="table-responsive mb-4">
                <table className="table table-bordered">
                    <thead className="table-light">
                        <tr>
                            <th>Feld</th>
                            <th>Beschreibung</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>Name</code></td>
                            <td>Bezeichnung der Kontrolle, z.&nbsp;B. &quot;Frühjahrskontrolle 2025&quot;.</td>
                        </tr>
                        <tr>
                            <td><code>Datum</code></td>
                            <td>Das Datum, an dem die Kontrolle stattfindet oder stattgefunden hat.</td>
                        </tr>
                        <tr>
                            <td><code>Startzeit / Endzeit</code></td>
                            <td>Optionaler Zeitrahmen der Kontrolle (HH:MM-Format).</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Relationen</h2>
            <div className="table-responsive mb-4">
                <table className="table table-bordered">
                    <thead className="table-light">
                        <tr>
                            <th>Entität</th>
                            <th>Beziehung</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><Link href="/docs/cadet"><strong>Person</strong></Link></td>
                            <td>
                                Pro Kontrolle wird für jede geprüfte Person gespeichert, ob die Uniform
                                vollständig war, wer geprüft hat, und welche Mängel erfasst oder behoben wurden.
                            </td>
                        </tr>
                        <tr>
                            <td><Link href="/docs/inspection/deficiencies"><strong>Mängel</strong></Link></td>
                            <td>
                                Bei der Durchführung einer Kontrolle können Mängel an Personen oder Uniformteilen
                                erfasst werden. Bestehende Mängel können als behoben markiert werden.
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Abmeldungen</strong></td>
                            <td>
                                Personen können für eine spezifische Kontrolle abgemeldet werden (z.&nbsp;B. Urlaub,
                                Krankheit). Die Abmeldung gilt nur für diese eine Kontrolle.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Kontrollen anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Kontrollen planen &amp; durchführen:</strong> Inspektor (Stufe 2) oder höher<br />
                <strong>Mängeltypen konfigurieren:</strong> Manager (Stufe 3) oder höher
            </div>

            <hr />

            <h2>Ansichten</h2>
            <div className="row g-3">
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                <Link href="/docs/inspection/conduct">Kontrolle durchführen</Link>
                            </h5>
                            <p className="card-text text-muted">
                                Schritt-für-Schritt-Ablauf einer Kontrolle: Personen prüfen, Mängel
                                erfassen, Abmeldungen berücksichtigen und Kontrolle abschließen.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                <Link href="/docs/inspection/deficiencies">Mängel &amp; Mängeltypen</Link>
                            </h5>
                            <p className="card-text text-muted">
                                Wie Mängel strukturiert sind, welche Typen es gibt und wie der
                                Lebenszyklus eines Mangels von Erfassung bis Behebung aussieht.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
