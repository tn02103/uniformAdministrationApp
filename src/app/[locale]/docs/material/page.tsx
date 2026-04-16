import { faMitten } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const metadata = {
    title: "Material — Dokumentation",
};

export default function DocsMaterialPage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faMitten} className="me-2" />Material</h1>
            <p className="lead">
                <strong>Material</strong> ist mengenbasierte Ausrüstung, die Personen zugewiesen wird.
                Im Gegensatz zu Uniformteilen wird Material nicht individuell nummeriert,
                sondern in Stückzahlen verfolgt.
            </p>

            <hr />

            <div className="table-responsive mb-4">
                <table className="table table-bordered">
                    <thead className="table-light">
                        <tr>
                            <th></th>
                            <th>Uniformteil</th>
                            <th>Material</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Identifikation</td>
                            <td>Individuelle Nummer</td>
                            <td>Typ + Menge</td>
                        </tr>
                        <tr>
                            <td>Verfolgung</td>
                            <td>Jedes Teil einzeln</td>
                            <td>Mengenbasiert</td>
                        </tr>
                        <tr>
                            <td>Beispiele</td>
                            <td>Jacke Nr.&nbsp;47, Hose Nr.&nbsp;12</td>
                            <td>3× Handschuhe, 2× Abzeichen</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Struktur: Materialgruppen & Materialtypen</h2>
            <p>
                Material ist in zwei Ebenen gegliedert: <strong>Materialgruppen</strong> fassen verwandte
                Materialarten zusammen; <strong>Materialtypen</strong> sind die konkreten Artikel darin.
            </p>
            <p>
                Beispiel: Gruppe <em>Rückenklett</em> → Typen <em>Kadett</em>, <em>Presse</em>, <em>Ausbilder</em>.
            </p>

            <h2>Eigenschaften einer Materialgruppe</h2>
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
                            <td><code>Bezeichnung</code></td>
                            <td>Name der Gruppe (max. 20 Zeichen), z.&nbsp;B. &quot;Kopfbedeckung&quot;.</td>
                        </tr>
                        <tr>
                            <td><code>Soll-Anzahl</code></td>
                            <td>
                                Optionaler Standardwert, wie viele Einheiten jeder Person ausgegeben werden sollen.
                                Wird auf der Personenseite als Vergleichswert angezeigt.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Mehrere Typen erlaubt</code></td>
                            <td>
                                Steuert, ob einer Person gleichzeitig mehrere verschiedene Typen dieser Gruppe
                                ausgegeben sein dürfen. Wenn deaktiviert und trotzdem mehrere Typen ausgegeben sind,
                                wird der Gruppenname auf der Personenseite rot hervorgehoben — eine technische
                                Sperre gibt es nicht.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Reihenfolge</code></td>
                            <td>Anzeigereihenfolge der Gruppe auf der Personenseite.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Eigenschaften eines Materialtyps</h2>
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
                            <td><code>Bezeichnung</code></td>
                            <td>Name des Typs (max. 20 Zeichen).</td>
                        </tr>
                        <tr>
                            <td><code>Ist-Menge</code></td>
                            <td>Aktuell vorhandene Stückzahl im Lager.</td>
                        </tr>
                        <tr>
                            <td><code>Soll-Menge</code></td>
                            <td>Angestrebte Vorratsmenge — Hinweis für Nachbestellungen.</td>
                        </tr>
                        <tr>
                            <td><code>Reihenfolge</code></td>
                            <td>Anzeigereihenfolge des Typs innerhalb der Gruppe.</td>
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
                                Material wird einer Person über die Personendetailseite zugewiesen.
                                Ausgabe und Rücknahme werden datiert protokolliert. Pro Materialgruppe
                                wird Soll- und Ist-Menge gegenübergestellt.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Ausgeben / Zurücknehmen:</strong> Inspektor (Stufe 2) oder höher<br />
                <strong>Gruppen &amp; Typen konfigurieren:</strong> Manager (Stufe 3) oder höher —
                siehe <Link href="/docs/admin/material">Material-Konfiguration</Link>
            </div>
        </>
    );
}
