import Link from "next/link";

export const metadata = {
    title: "Übersicht — Dokumentation",
};

export default function DocsOverviewPage() {
    return (
        <>
            <h1>Dokumentation</h1>
            <p className="lead">
                Willkommen in der Dokumentation der Uniformverwaltungs-App. Hier erfährst du, wie die
                Anwendung aufgebaut ist, was die einzelnen Objekte bedeuten und wie du die App konfigurierst.
            </p>

            <hr />

            <h2>Kernkonzepte</h2>
            <p>
                Die App ist mandantenfähig — jede Organisation verwaltet ihre Daten vollständig getrennt.
                Die App ist unter <code>/app/...</code> erreichbar. Die interne Zuordnung zur Organisation
                erfolgt automatisch anhand des angemeldeten Benutzers.
            </p>

            <div className="table-responsive mb-4">
                <table className="table table-bordered">
                    <thead className="table-light">
                        <tr>
                            <th>Objekt</th>
                            <th>Kurzbeschreibung</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Person</strong></td>
                            <td>Eine Person, der Uniformteile und Material zugewiesen werden können.</td>
                        </tr>
                        <tr>
                            <td><strong>Uniformteil</strong></td>
                            <td>Ein einzelnes, nummeriertes Kleidungsstück, das einem Typ angehört.</td>
                        </tr>
                        <tr>
                            <td><strong>Uniformtyp</strong></td>
                            <td>Kategorie von Uniformteilen (z. B. Jacke, Hose). Definiert Konfiguration und Erwartungsmengen.</td>
                        </tr>
                        <tr>
                            <td><strong>Material</strong></td>
                            <td>Mengenbasierte Ausrüstung (z. B. Handschuhe), die nicht einzeln nummeriert wird.</td>
                        </tr>
                        <tr>
                            <td><strong>Kontrolle</strong></td>
                            <td>Periodische Prüfung, ob Personen ihre vollständige Ausrüstung tragen.</td>
                        </tr>
                        <tr>
                            <td><strong>Mangel</strong></td>
                            <td>Ein bei einer Kontrolle festgestelltes Problem (fehlendes oder beschädigtes Teil).</td>
                        </tr>
                        <tr>
                            <td><strong>Lager</strong></td>
                            <td>Physischer Aufbewahrungsort für nicht ausgegebene Uniformteile.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Rollen & Berechtigungen</h2>
            <p>Jeder Benutzer hat eine Rolle, die bestimmt, welche Aktionen er ausführen darf.</p>
            <div className="table-responsive mb-4">
                <table className="table table-bordered">
                    <thead className="table-light">
                        <tr>
                            <th>Rolle</th>
                            <th>Stufe</th>
                            <th>Berechtigungen</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span className="badge bg-secondary">Benutzer</span></td>
                            <td>1</td>
                            <td>Personalliste, Personendetail, Uniformliste und Lager anzeigen</td>
                        </tr>
                        <tr>
                            <td><span className="badge bg-info text-dark">Inspektor</span></td>
                            <td>2</td>
                            <td>+ Personen anlegen/bearbeiten, Uniformteile ausgeben/zurücknehmen, Kontrollen durchführen</td>
                        </tr>
                        <tr>
                            <td><span className="badge bg-warning text-dark">Manager</span></td>
                            <td>3</td>
                            <td>+ Uniformtypen und Material konfigurieren, Mängeltypen verwalten, Dashboard anzeigen</td>
                        </tr>
                        <tr>
                            <td><span className="badge bg-danger">Admin</span></td>
                            <td>4</td>
                            <td>+ Benutzer verwalten, alle Einstellungen</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Themen</h2>
            <div className="row g-3">
                {[
                    { href: "/docs/cadet", title: "Personen", text: "Personalverwaltung, Uniformzuordnung, Materialliste und Kontrollhistorie." },
                    { href: "/docs/uniform", title: "Uniformteile", text: "Einzelne nummerierte Teile, Ausgabe und Rücknahme, Reservestatus." },
                    { href: "/docs/storage", title: "Lager", text: "Lagereinheiten für Uniformteile, Kapazität und Reservelager." },
                    { href: "/docs/material", title: "Material", text: "Mengenbasierte Ausrüstung in Gruppen, Ausgabe und Rücknahme." },
                    { href: "/docs/inspection", title: "Kontrollen", text: "Kontrollen planen, durchführen und Mängel erfassen." },
                    { href: "/docs/dashboard", title: "Dashboard", text: "Auswertungen und Statistiken zu Uniformbeständen." },
                    { href: "/docs/admin/uniform", title: "Administration", text: "Uniformtypen, Material und Benutzer konfigurieren." },
                ].map(({ href, title, text }) => (
                    <div key={href} className="col-12 col-md-6">
                        <Link href={href} className="text-decoration-none">
                            <div className="card h-100 border-2">
                                <div className="card-body">
                                    <h5 className="card-title text-primary">{title}</h5>
                                    <p className="card-text text-muted small mb-0">{text}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </>
    );
}
