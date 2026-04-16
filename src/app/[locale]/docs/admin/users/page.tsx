export const metadata = {
    title: "Benutzerverwaltung — Dokumentation",
};

import Image from "next/image";

export default function DocsAdminUsersPage() {
    return (
        <>
            <h1>Benutzerverwaltung</h1>
            <p className="lead">
                In der Benutzerverwaltung können Administratoren die Benutzerkonten der Organisation
                anlegen, bearbeiten und deaktivieren.
            </p>

            <hr />

            <figure className="mb-4">
                <Image src="/docs-screenshots/user-page.png" alt="Nutzerverwaltung" className="img-fluid border rounded shadow-sm" width={1200} height={500} />
                <figcaption className="text-muted small mt-1">Nutzerübersicht mit Benutzernamen, Rollen und Status aller Konten der Organisation.</figcaption>
            </figure>

            <h2>Eigenschaften eines Benutzers</h2>
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
                            <td><code>Benutzername</code></td>
                            <td>Eindeutiger Anmeldename innerhalb der Organisation (max. 10 Zeichen).</td>
                        </tr>
                        <tr>
                            <td><code>Name</code></td>
                            <td>Anzeigename des Benutzers (max. 20 Zeichen).</td>
                        </tr>
                        <tr>
                            <td><code>Rolle</code></td>
                            <td>Berechtigungsstufe (1–4, siehe unten).</td>
                        </tr>
                        <tr>
                            <td><code>Aktiv</code></td>
                            <td>Inaktive Benutzer können sich nicht anmelden.</td>
                        </tr>
                        <tr>
                            <td><code>Fehlversuche</code></td>
                            <td>
                                Anzahl aufeinanderfolgender fehlgeschlagener Anmeldeversuche.
                                Bei zu vielen Fehlversuchen kann das Konto gesperrt werden.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Rollen</h2>
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
                            <td>+ Personen verwalten, Uniform/Material ausgeben und zurücknehmen, Kontrollen durchführen</td>
                        </tr>
                        <tr>
                            <td><span className="badge bg-warning text-dark">Manager</span></td>
                            <td>3</td>
                            <td>+ Uniformtypen & Generationen konfigurieren, Material konfigurieren, Mängeltypen verwalten, Dashboard</td>
                        </tr>
                        <tr>
                            <td><span className="badge bg-danger">Admin</span></td>
                            <td>4</td>
                            <td>+ Benutzerverwaltung, Organisationseinstellungen</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Benutzer anlegen</h2>
            <p>
                Über den &quot;Neu anlegen&quot;-Button kann ein neues Benutzerkonto erstellt werden.
                Das initiale Passwort wird beim Anlegen gesetzt. Der Benutzer sollte es bei der
                ersten Anmeldung ändern.
            </p>

            <h2>Benutzer bearbeiten</h2>
            <p>
                Benutzername, Name und Rolle können nachträglich geändert werden. Das Passwort kann
                durch einen Admin zurückgesetzt werden.
            </p>

            <h2>Benutzer deaktivieren</h2>
            <p>
                Benutzer werden nicht gelöscht, sondern deaktiviert. Dadurch bleiben Protokolleinträge
                (z. B. wer eine Kontrolle durchgeführt hat) erhalten.
            </p>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Benutzerverwaltung:</strong> Admin (Stufe 4)
            </div>
        </>
    );
}
