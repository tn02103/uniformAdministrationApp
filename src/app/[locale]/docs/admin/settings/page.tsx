export const metadata = {
    title: "Organisationseinstellungen — Dokumentation",
};

export default function DocsAdminSettingsPage() {
    return (
        <>  
            <div className="alert alert-danger">
                <strong>In Bearbeitung:</strong> Dieser Abschnitt ist noch nicht vertiggestellt. 
                Einstellungen werden derzeit nur über die Datenbank verwaltet. Eine Benutzeroberfläche zur Verwaltung der Einstellungen wird in Kürze hinzugefügt.
            </div>
            <h1>Organisationseinstellungen</h1>
            <p className="lead">
                In den Organisationseinstellungen werden organisationsweite Konfigurationen verwaltet,
                die das Verhalten der gesamten App beeinflussen.
            </p>

            <hr />

            <h2>Verfügbare Einstellungen</h2>
            <div className="table-responsive mb-4">
                <table className="table table-bordered">
                    <thead className="table-light">
                        <tr>
                            <th>Einstellung</th>
                            <th>Beschreibung</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>E-Mail nach Kontrolle senden</code></td>
                            <td>
                                Wenn aktiviert, wird nach dem Abschluss einer Kontrolle automatisch
                                ein Bericht per E-Mail versendet.
                            </td>
                        </tr>
                        <tr>
                            <td><code>Empfänger-E-Mail-Adressen</code></td>
                            <td>
                                Liste der E-Mail-Adressen, die den Kontrollbericht erhalten sollen.
                                Kann mehrere Adressen enthalten.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Organisationseinstellungen:</strong> Admin (Stufe 4)
            </div>
        </>
    );
}
