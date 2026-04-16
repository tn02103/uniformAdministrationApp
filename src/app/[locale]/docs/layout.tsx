import { ReactNode } from "react";
import { DocsNav } from "./_components/DocsNav";
import MobileDocsNav from "./_components/MobileDocsNav";

export const metadata = {
    title: 'Dokumentation — Uniformverwaltung',
    description: 'Dokumentation der Uniformverwaltungs-App: Funktionen, Konzepte und Konfigurationsanleitung für Uniformteile, Material, Kontrollen und mehr.',
};

export default function DocsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="container-xl py-4">
            <div className="row g-4">
                {/* Sidebar */}
                <aside className="col-12 col-lg-3">
                    {/* Mobile: collapsible nav */}
                    <MobileDocsNav />

                    {/* Desktop: always-visible sidebar */}
                    <div className="d-none d-lg-block">
                        <div className="bg-white border rounded p-3 sticky-top" style={{ top: "1rem" }}>
                            <h6 className="text-uppercase text-muted fw-bold mb-3 small">Dokumentation</h6>
                            <DocsNav />
                        </div>
                    </div>
                </aside>

                {/* Main content */}
                <main className="col-12 col-lg-9">
                    <div className="bg-white border rounded p-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
