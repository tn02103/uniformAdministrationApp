import { faShirt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const metadata = {
    title: "Uniformteile — Dokumentation",
};

export default function DocsUniformPage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faShirt} className="me-2" />Uniformteile</h1>
            <p className="lead">
                Ein <strong>Uniformteil</strong> ist ein einzelnes, nummeriertes Kleidungsstück oder
                Ausrüstungsgegenstand. Im Gegensatz zu Material wird jedes Teil individuell verfolgt
                und trägt eine eindeutige Nummer.
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
                            <td><code>Nummer</code></td>
                            <td>Eindeutige numerische Kennung innerhalb eines Uniformtyps.</td>
                        </tr>
                        <tr>
                            <td><code>Uniformtyp</code></td>
                            <td>Zu welchem <Link href="/docs/uniform/type">Uniformtyp</Link> dieses Teil gehört (z.&nbsp;B. Jacke, Hose). Pflichtfeld.</td>
                        </tr>
                        <tr>
                            <td><code>Generation</code></td>
                            <td>Optionale Untergruppe des Typs — siehe <Link href="/docs/uniform/type">Uniformtypen &amp; Generationen</Link>. Nur verfügbar wenn der Typ Generationen aktiviert hat.</td>
                        </tr>
                        <tr>
                            <td><code>Größe</code></td>
                            <td>Optionale Größenangabe — siehe <Link href="/docs/uniform/sizes">Größen &amp; Größenlisten</Link>. Nur verfügbar wenn der Typ Größen aktiviert hat.</td>
                        </tr>
                        <tr>
                            <td><code>Reserve</code></td>
                            <td>
                                Markiert das Teil als Reserveteil — vorhanden, aber nicht für die reguläre Ausgabe
                                vorgesehen. Wenn die zugewiesene <Link href="/docs/uniform/type">Generation</Link> als
                                Reserve markiert ist, wird dieses Flag automatisch gesetzt und kann am einzelnen Teil
                                nicht überschrieben werden.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Kommentar</code></td>
                            <td>Optionales Freitextfeld für interne Notizen zu diesem spezifischen Teil.</td>
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
                                Ein Uniformteil kann einer Person ausgegeben werden. Ausgabe und
                                Rücknahme werden datiert. Ein Teil kann immer nur einer Person
                                gleichzeitig zugewiesen sein.
                            </td>
                        </tr>
                        <tr>
                            <td><Link href="/docs/storage"><strong>Lagereinheit</strong></Link></td>
                            <td>
                                Nicht ausgegebene Teile können einer Lagereinheit zugewiesen werden,
                                um den physischen Aufbewahrungsort zu verfolgen. Ein ausgegebenes
                                Teil kann keiner Lagereinheit zugewiesen werden.
                            </td>
                        </tr>
                        <tr>
                            <td><Link href="/docs/inspection/deficiencies"><strong>Mängel</strong></Link></td>
                            <td>
                                An einem Uniformteil können Mängel erfasst werden (z.&nbsp;B. Beschädigungen),
                                unabhängig davon, ob es gerade ausgegeben ist.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="alert alert-secondary">
                <strong>Soft-Delete:</strong> Uniformteile werden nicht dauerhaft gelöscht.
                Ein gelöschtes Teil verschwindet aus der Liste, historische Ausgaben bleiben erhalten.
            </div>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Anlegen / Bearbeiten / Ausgeben:</strong> Inspektor (Stufe 2) oder höher
            </div>

            <hr />

            <h2>Ansichten</h2>
            <div className="row g-3">
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                <Link href="/docs/uniform/list">Uniformliste</Link>
                            </h5>
                            <p className="card-text text-muted">
                                Alle Teile eines Uniformtyps auf einen Blick. Filterbar nach Generation,
                                Größe, Reserve-Status und Ausgabe-Status. Direktsuche über Nummer oder Kürzel.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                <Link href="/docs/uniform/detail">Einzelteil-Panel</Link>
                            </h5>
                            <p className="card-text text-muted">
                                Detailansicht eines einzelnen Uniformteils mit Status, aktuellem Besitzer,
                                erfassten Mängeln und der vollständigen Ausgabehistorie.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-3">
                <p className="text-muted small">
                    Konfiguration von Typen und Generationen: <Link href="/docs/uniform/type">Uniformtypen &amp; Generationen</Link><br />
                    Konfiguration von Größenlisten: <Link href="/docs/uniform/sizes">Größen &amp; Größenlisten</Link>
                </p>
            </div>
        </>
    );
}
