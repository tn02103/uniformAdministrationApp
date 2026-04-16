import { faShirt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const metadata = {
    title: "Uniformtypen & Generationen — Dokumentation",
};

export default function DocsUniformTypePage() {
    return (
        <>
            <h1><FontAwesomeIcon icon={faShirt} className="me-2" />Uniformtypen &amp; Generationen</h1>
            <p className="lead">
                Ein <strong>Uniformtyp</strong>&nbsp;ist eine Kategorie von Uniformteilen (z. B. &quot;Jacke&quot;,
                &quot;Hose&quot;, &quot;Mütze&quot;). Es legt fest, wie die zugehörigen Teile verwaltet werden
                und wie viele davon eine Person standardmäßig haben soll.
            </p>

            <hr />

            <h2>Eigenschaften eines Uniformtyps</h2>
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
                            <td>Anzeigename des Typs (max. 10 Zeichen), z. B. &quot;Jacke&quot;.</td>
                        </tr>
                        <tr>
                            <td><code>Kürzel</code></td>
                            <td>Zweistelliges Kürzel (max. 2 Zeichen), das die schnelle Suche nach Teilen dieses Typs erleichtert.</td>
                        </tr>
                        <tr>
                            <td><code>Soll-Anzahl</code></td>
                            <td>
                                Wie viele Teile dieses Typs eine Person standardmäßig haben soll
                                (<code>issuedDefault</code>). Wird auf der Personenseite als Vergleichswert angezeigt.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Generationen verwenden</code></td>
                            <td>
                                Aktiviert die Unterteilung des Typs in Generationen (z. B. nach Produktionsjahr).
                                Wenn aktiviert, muss jedes Teil einer Generation zugeordnet werden.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Größen verwenden</code></td>
                            <td>
                                Aktiviert die Größenzuweisung für einzelne Teile dieses Typs.
                                Wenn aktiviert, kann jedem Teil eine Größe zugeordnet werden.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Standard-Größenliste</code></td>
                            <td>
                                Vordefinierte <Link href="/docs/uniform/sizes">Größenliste</Link>, die für neue Teile
                                dieses Typs als Standard verwendet wird. Nur relevant, wenn Größen aktiviert sind.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Reihenfolge</code></td>
                            <td>Bestimmt die Anzeigereihenfolge des Typs in Listen und Naviagtionsmenüs.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Generationen</h2>
            <p>
                Wenn ein Uniformtyp Generationen verwendet, kann er in mehrere
                <strong> Generationen</strong> unterteilt werden — zum Beispiel verschiedene
                Produktionsjahrgänge oder Schnitte. Jedes Uniformteil gehört dann zu genau einer Generation.
            </p>

            <h3>Eigenschaften einer Generation</h3>
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
                            <td>Anzeigename der Generation (max. 20 Zeichen), z. B. &quot;2022&quot; oder &quot;Modell A&quot;.</td>
                        </tr>
                        <tr>
                            <td><code>Größenliste</code></td>
                            <td>
                                Optionale <Link href="/docs/uniform/sizes">Größenliste</Link> speziell für diese Generation.
                                Überschreibt die Standard-Größenliste des Typs.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Reserve</code></td>
                            <td>
                                Markiert <strong>alle</strong> Teile dieser Generation unwiderruflich als
                                Reserveteile. Dieser Status gilt für die gesamte Generation und kann an
                                einzelnen Teilen nicht überschrieben werden.
                                Nützlich für ältere Generationen, die nicht mehr aktiv ausgegeben werden.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Reihenfolge</code></td>
                            <td>Anzeigereihenfolge der Generation innerhalb des Typs.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Konfiguration</h2>
            <p>
                Uniformtypen und Generationen werden in der{" "}
                <Link href="/docs/admin/uniform">Uniform-Konfiguration</Link> (Administration)
                verwaltet. Dafür ist die Rolle <strong>Manager (Stufe 3)</strong> oder höher erforderlich.
            </p>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Typen &amp; Generationen anzeigen:</strong> alle angemeldeten Benutzer<br />
                <strong>Typen &amp; Generationen konfigurieren:</strong> Manager (Stufe 3) oder höher
            </div>
        </>
    );
}
