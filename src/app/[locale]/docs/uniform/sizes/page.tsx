import { faShirt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

export const metadata = {
    title: "Größen & Größenlisten — Dokumentation",
};

export default function DocsUniformSizesPage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faShirt} className="me-2" />Größen &amp; Größenlisten</h1>
            <p className="lead">
                Wenn ein Uniformtyp die Größenverwaltung aktiviert hat, kann jedem Uniformteil eine
                <strong> Größe</strong> zugewiesen werden. Größen werden in <strong>Größenlisten</strong> gruppiert,
                die dann Uniformtypen oder Generationen zugeordnet werden.
            </p>

            <hr />

            <figure className="mb-4">
                <Image src="/docs-screenshots/sizelist-overview.png" alt="Ansicht Größen & Größenlisten" className="img-fluid border rounded shadow-sm" width={1000} height={560} />
                <figcaption className="text-muted small mt-1">Ansicht Größen &amp; Größenlisten Konfiguration</figcaption>
            </figure>

            <h2>Größen</h2>
            <p>
                Eine <strong>Größe</strong>&nbsp;ist ein benannter Wert innerhalb einer Organisation,
                z. B. &quot;XS&quot;, &quot;S&quot;, &quot;M&quot;, &quot;L&quot;, &quot;XL&quot; oder auch spezifischere Werte
                wie &quot;48&quot;, &quot;50&quot;, &quot;52&quot;.
            </p>

            <h3>Eigenschaften einer Größe</h3>
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
                            <td>Anzeigename der Größe (max. 10 Zeichen), z. B. &quot;M&quot; oder &quot;52&quot;.</td>
                        </tr>
                        <tr>
                            <td><code>Reihenfolge</code></td>
                            <td>Anzeigereihenfolge der Größe in Dropdowns und Listen.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="alert alert-secondary">
                Größen sind global für die gesamte Organisation definiert. Dieselbe Größe
                (z. B. &quot;M&quot;) kann in mehreren Größenlisten verwendet werden.
            </div>

            <h2>Größenlisten</h2>
            <p>
                Eine <strong>Größenliste</strong> ist eine benannte Auswahl von Größen, die einem
                Uniformtyp oder einer Generation zugewiesen werden kann. Dadurch lässt sich steuern,
                welche Größen für welchen Typ verfügbar sind.
            </p>
            <p>
                Beispiel: Typ &quot;Jacke&quot; verwendet die Liste &quot;Konfektionsgrößen&quot; mit den Werten
                XS, S, M, L, XL; Typ &quot;Stiefel&quot; verwendet &quot;Schuhgrößen EU&quot; mit 38, 39, 40, …, 46.
            </p>

            <h3>Eigenschaften einer Größenliste</h3>
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
                            <td>Eindeutiger Name der Liste innerhalb der Organisation (max. 40 Zeichen).</td>
                        </tr>
                        <tr>
                            <td><code>Größen</code></td>
                            <td>Auswahl der Größen, die in dieser Liste enthalten sind.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Zuweisung</h2>
            <p>Größenlisten können an zwei Stellen zugewiesen werden:</p>
            <ul>
                <li>
                    <strong>Uniformtyp</strong> → Standard-Größenliste: Gilt für alle Teile des Typs,
                    sofern die Generation keine eigene Liste hat.
                </li>
                <li>
                    <strong>Generation</strong> → eigene Größenliste: Überschreibt die Liste des Typs
                    für alle Teile dieser Generation.
                </li>
            </ul>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Größen &amp; Größenlisten konfigurieren:</strong> Manager (Stufe 3) oder höher
            </div>
        </>
    );
}
