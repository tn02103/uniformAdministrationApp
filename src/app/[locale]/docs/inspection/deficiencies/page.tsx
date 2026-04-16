import { faClipboardCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const metadata = {
    title: "Mängel & Mängeltypen — Dokumentation",
};

export default function DocsInspectionDeficienciesPage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faClipboardCheck} className="me-2" />Mängel &amp; Mängeltypen</h1>
            <p className="lead">
                Ein <strong>Mangel</strong> ist ein bei einer Kontrolle festgestelltes Problem —
                ein fehlendes, beschädigtes oder falsches Teil. Mängel werden kontrollübergreifend
                verfolgt, bis sie explizit als behoben markiert werden.
            </p>

            <hr />

            <h2>Eigenschaften eines Mangels</h2>
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
                            <td><code>Mängeltyp</code></td>
                            <td>Klassifizierung des Mangels (konfigurierbar, z.&nbsp;B. &quot;Fehlendes Teil&quot;, &quot;Beschädigung&quot;).</td>
                        </tr>
                        <tr>
                            <td><code>Beschreibung</code></td>
                            <td>Kurze Beschreibung des Mangels (max. 30 Zeichen).</td>
                        </tr>
                        <tr>
                            <td><code>Kommentar</code></td>
                            <td>Optionaler Langtext mit weiteren Details zum Mangel.</td>
                        </tr>
                        <tr>
                            <td><code>Erstellt am / bei Kontrolle</code></td>
                            <td>Datum und Kontrolle, bei der der Mangel erstmals erfasst wurde.</td>
                        </tr>
                        <tr>
                            <td><code>Behoben am / bei Kontrolle</code></td>
                            <td>Datum und Kontrolle, bei der der Mangel als behoben markiert wurde. Leer = noch offen.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Lebenszyklus eines Mangels</h2>
            <ol>
                <li>Mangel wird bei einer Kontrolle <strong>erfasst</strong>.</li>
                <li>Mangel bleibt bei Folgekontrollen <strong>offen</strong> und erscheint auf der Personendetailseite.</li>
                <li>Bei einer späteren Kontrolle wird der Mangel <strong>behoben</strong> — Datum und Kontrolle werden gesetzt.</li>
            </ol>

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
                                Mängel mit Abhängigkeit <em>Person</em> sind direkt der Person zugeordnet.
                                Sie erscheinen auf der Personendetailseite, solange sie offen sind.
                            </td>
                        </tr>
                        <tr>
                            <td><Link href="/docs/uniform"><strong>Uniformteil</strong></Link></td>
                            <td>
                                Mängel mit Abhängigkeit <em>Uniformteil</em> sind dem Teil zugeordnet
                                (z.&nbsp;B. physische Beschädigungen). Sie erscheinen im Einzelteil-Panel.
                            </td>
                        </tr>
                        <tr>
                            <td><Link href="/docs/inspection"><strong>Kontrolle</strong></Link></td>
                            <td>
                                Jeder Mangel referenziert die Kontrolle, bei der er erfasst wurde,
                                und die Kontrolle, bei der er behoben wurde.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Mängeltypen</h2>
            <p>
                <strong>Mängeltypen</strong> sind konfigurierbare Kategorien. Sie bestimmen,
                auf welches Objekt sich ein Mangel bezieht.
            </p>

            <h3>Eigenschaften eines Mängeltyps</h3>
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
                            <td>Bezeichnung des Typs (max. 20 Zeichen).</td>
                        </tr>
                        <tr>
                            <td><code>Abhängigkeit</code></td>
                            <td>
                                Legt fest, ob der Mangel einer <strong>Person</strong> oder einem{" "}
                                <strong>Uniformteil</strong> zugeordnet wird.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Relation</code></td>
                            <td>
                                Optionale genauere Zuordnung bei Personen-Mängeln: <code>Uniform</code> (ein
                                spezifisches Uniformteil der Person ist betroffen) oder <code>Material</code>{" "}
                                (ein Materialtyp ist betroffen).
                            </td>
                        </tr>
                        <tr>
                            <td><code>Deaktiviert</code></td>
                            <td>
                                Deaktivierte Typen können nicht mehr für neue Mängel verwendet werden,
                                bleiben aber für bestehende Mängel im System erhalten.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3>Kombination von Abhängigkeit und Relation</h3>
            <div className="table-responsive mb-4">
                <table className="table table-bordered">
                    <thead className="table-light">
                        <tr>
                            <th>Abhängigkeit</th>
                            <th>Relation</th>
                            <th>Bedeutung</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Person</td>
                            <td>—</td>
                            <td>Allgemeiner Personenmangel ohne Bezug zu einem bestimmten Teil.</td>
                        </tr>
                        <tr>
                            <td>Person</td>
                            <td>Uniform</td>
                            <td>Ein bestimmtes Uniformteil der Person ist betroffen (z.&nbsp;B. fehlendes Abzeichen).</td>
                        </tr>
                        <tr>
                            <td>Person</td>
                            <td>Material</td>
                            <td>Ein bestimmter Materialtyp der Person ist betroffen (z.&nbsp;B. fehlende Handschuhe).</td>
                        </tr>
                        <tr>
                            <td>Uniformteil</td>
                            <td>—</td>
                            <td>Der Mangel liegt am Teil selbst (z.&nbsp;B. Beschädigung), unabhängig von einer Person.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* IMG: Mängeltypen-Übersichtsseite mit Abhängigkeit und Relation */}

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Mängel anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Mängel erfassen / beheben:</strong> Inspektor (Stufe 2) oder höher<br />
                <strong>Mängeltypen konfigurieren:</strong> Manager (Stufe 3) oder höher
            </div>
        </>
    );
}
