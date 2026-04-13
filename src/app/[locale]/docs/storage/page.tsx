import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const metadata = {
    title: "Lager — Dokumentation",
};

export default function DocsStoragePage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faBoxOpen} className="me-2" />Lager</h1>
            <p className="lead">
                Eine <strong>Lagereinheit</strong> repräsentiert einen physischen Aufbewahrungsort
                für Uniformteile, die keiner Person zugewiesen sind. Damit lässt sich der Lagerbestand
                strukturiert verwalten und schnell auffinden.
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
                            <td>Eindeutiger Name der Lagereinheit innerhalb der Organisation (max. 20 Zeichen), z.&nbsp;B. &quot;Regal A1&quot; oder &quot;Kiste 3&quot;.</td>
                        </tr>
                        <tr>
                            <td><code>Beschreibung</code></td>
                            <td>Optionale Beschreibung des Lagerorts (max. 100 Zeichen), z.&nbsp;B. Standort oder Inhaltsbeschreibung.</td>
                        </tr>
                        <tr>
                            <td><code>Kapazität</code></td>
                            <td>Optionale maximale Anzahl an Uniformteilen in dieser Einheit. Dient nur als informativer Hinweis.</td>
                        </tr>
                        <tr>
                            <td><code>Für Reserven</code></td>
                            <td>
                                Markiert die Einheit als Reservelager. Alle Uniformteile, die dieser
                                Einheit zugeordnet werden, werden <strong>automatisch</strong> als Reserveteile markiert.
                            </td>
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
                                Nicht ausgegebene Uniformteile können einer Lagereinheit zugewiesen werden.
                                Die Zuweisung erfolgt entweder direkt über das Lagerpanel oder über das
                                Uniformteil-Panel des betreffenden Teils.
                                Ein ausgegebenes Teil kann keiner Lagereinheit zugewiesen werden.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Lagereinheiten verwalten &amp; Teile zuweisen:</strong> Inspektor (Stufe 2) oder höher
            </div>

            <hr />

            <h2>Ansichten</h2>
            <div className="row g-3">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">
                                <Link href="/docs/storage/overview">Lagerverwaltung</Link>
                            </h5>
                            <p className="card-text text-muted">
                                Übersicht aller Lagereinheiten mit Belegung und Reserve-Status.
                                Über ein seitliches Panel lassen sich Details einsehen und Uniformteile
                                direkt zuweisen oder entfernen.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
