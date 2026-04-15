import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

export const metadata = {
    title: "Personalliste — Dokumentation",
};

export default function DocsCadetListPage() {
    return (
        <>
            <h1 className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    <span>Personalliste</span>
                </div>
                <span className="badge bg-secondary-subtle text-secondary border align-middle" style={{ fontSize: '0.45em' }}>Übersichtsseite</span>
            </h1>
            <p className="lead">
                Die Personalliste gibt einen Überblick über alle Personen der Organisation.
                Von hier aus gelangt man zur Detailseite jeder Person.
            </p>

            <hr />
            <figure className="my-4">
                <Image src="/docs-screenshots/Personalliste.png" alt="Nutzerverwaltung" className="img-fluid border rounded shadow-sm" width={1200} height={500} />
                <figcaption className="text-muted small mt-1">Nutzerübersicht mit Benutzernamen, Rollen und Status aller Konten der Organisation.</figcaption>
            </figure>
            
            <h2>Suche & Sortierung</h2>
            <p>
                Das Suchfeld filtert die Liste in Echtzeit nach Vor- und Nachname. Es ist immer
                sichtbar, unabhängig davon ob gerade eine Kontrolle aktiv ist.
            </p>
            <p>
                Die Liste kann nach Vor- oder Nachname sortiert werden (aufsteigend/absteigend).
                Die gewählte Sortierung bleibt für die aktuelle Sitzung gespeichert.
            </p>

            <h2>Kontrollfilter</h2>
            <p>
                Ist gerade eine Kontrolle aktiv, erscheinen oberhalb der Liste zusätzliche Filteroptionen.
                Diese sind ausschließlich während einer laufenden Kontrolle sichtbar:
            </p>
            <ul>
                <li><strong>Inkl abgemeldete Personen</strong> — Inkludiert Personen, die für diese Kontrolle abgemeldet wurden. Standardmäßig ist diese Option deaktiviert.</li>
                <li><strong>Inkl kontrollierte Personen</strong> — Inkludiert Personen, die bereits kontrolliert wurden. 
                Standardmäßig ist diese Option deaktiviert, was es erleichtert, noch nicht geprüfte Personen schnell zu finden.</li>
            </ul>

             <figure className="my-4">
                <Image src="/docs-screenshots/Personalliste-filter.png" alt="Nutzerverwaltung" className="img-fluid border rounded shadow-sm" width={800} height={400} />
                <figcaption className="text-muted small mt-1">Nutzerübersicht mit Benutzernamen, Rollen und Status aller Konten der Organisation.</figcaption>
            </figure>

            <h2>Benötigte Rolle</h2>
            <div className="alert alert-info">
                <strong>Anzeigen:</strong> alle angemeldeten Benutzer
            </div>
        </>
    );
}
