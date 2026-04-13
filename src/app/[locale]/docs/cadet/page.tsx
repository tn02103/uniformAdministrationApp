import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const metadata = {
    title: "Personen — Dokumentation",
};

export default function DocsCadetPage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faUser} className="me-2" />Personen</h1>
            <p className="lead">
                Eine <strong>Person</strong> ist die zentrale Entität der App. Uniformteile und
                Material werden Personen zugewiesen, und Kontrollen werden pro Person durchgeführt.
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
                            <td><code>Vorname</code></td>
                            <td>Vorname der Person (max. 30 Zeichen).</td>
                        </tr>
                        <tr>
                            <td><code>Nachname</code></td>
                            <td>Nachname der Person (max. 30 Zeichen).</td>
                        </tr>
                        <tr>
                            <td><code>Kommentar</code></td>
                            <td>Freitextfeld für interne Notizen zur Person.</td>
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
                            <td><Link href="/docs/uniform"><strong>Uniformteile</strong></Link></td>
                            <td>
                                Einer Person können ein oder mehrere Uniformteile ausgegeben werden.
                                Jede Ausgabe wird mit Datum gespeichert und historisch protokolliert.
                            </td>
                        </tr>
                        <tr>
                            <td><Link href="/docs/material"><strong>Material</strong></Link></td>
                            <td>
                                Material wird einer Person mengenbasiert zugewiesen (z.&nbsp;B. 2×&nbsp;Handschuhe).
                                Ausgabe und Rücknahme werden datiert erfasst.
                            </td>
                        </tr>
                        <tr>
                            <td><Link href="/docs/inspection/deficiencies"><strong>Mängel</strong></Link></td>
                            <td>
                                Bei einer Kontrolle können Mängel an einer Person oder einem zugewiesenen
                                Uniformteil erfasst werden. Mängel bleiben offen bis sie explizit behoben werden.
                            </td>
                        </tr>
                        <tr>
                            <td><Link href="/docs/inspection"><strong>Kontrollen</strong></Link></td>
                            <td>
                                Kontrollen prüfen Personen. Pro Kontrolle wird gespeichert, ob die Uniform
                                vollständig war, wer geprüft hat, und welche Mängel erfasst oder behoben wurden.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="alert alert-secondary">
                <strong>Soft-Delete:</strong> Personen werden nicht dauerhaft gelöscht, sondern nur als
                gelöscht markiert. Historische Ausgaben und Kontrolldaten bleiben erhalten.
            </div>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Anlegen / Bearbeiten:</strong> Inspektor (Stufe 2) oder höher
            </div>

            <hr />

            <h2>Ansichten</h2>
            <div className="row g-3">
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                <Link href="/docs/cadet/list">Personalliste</Link>
                            </h5>
                            <p className="card-text text-muted">
                                Alle Personen der Organisation auf einen Blick. Suche nach Name,
                                Sortierung, und während einer aktiven Kontrolle zusätzliche Filteroptionen
                                für den Kontrollablauf.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                <Link href="/docs/cadet/detail">Personendetail</Link>
                            </h5>
                            <p className="card-text text-muted">
                                Die Detailseite einer einzelnen Person mit Personaldaten, offenen Mängeln,
                                ausgegebenen Uniformteilen und Material — alles auf einen Blick, direkt bearbeitbar.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
