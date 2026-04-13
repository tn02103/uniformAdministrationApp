import { ReactNode } from "react";
import { DocsNav } from "./_components/DocsNav";

export const metadata = {
    title: "Dokumentation — Uniformverwaltung",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="container-xl py-4">
            <div className="row g-4">
                {/* Sidebar */}
                <aside className="col-12 col-lg-3">
                    <div className="bg-white border rounded p-3 sticky-top" style={{ top: "1rem" }}>
                        <h6 className="text-uppercase text-muted fw-bold mb-3 small">Dokumentation</h6>
                        <DocsNav />
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
