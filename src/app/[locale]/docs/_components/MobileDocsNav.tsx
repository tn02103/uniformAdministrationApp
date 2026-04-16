"use client";

import { useState } from "react";
import { DocsNav } from "./DocsNav";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

export default function MobileDocsNav() {
    const [open, setOpen] = useState(false);
    return (
        <div className="d-lg-none">
            <div className="bg-white border rounded mb-3">
                <button
                    type="button"
                    className="w-100 text-start px-3 py-2 border-0 bg-transparent d-flex justify-content-between align-items-center"
                    aria-expanded={open}
                    onClick={() => setOpen((s) => !s)}
                >
                        <strong>Übersicht</strong>
                        <span className="ms-2">
                            <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} />
                        </span>
                </button>

                {open && (
                    <div className="px-3 pb-3 pt-2">
                        <DocsNav onNavigate={() => setOpen(false)} />
                    </div>
                )}
            </div>
        </div>
    );
}
