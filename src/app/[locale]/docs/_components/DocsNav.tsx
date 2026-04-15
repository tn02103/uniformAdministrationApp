"use client";

import { faBoxOpen, faChartLine, faClipboardCheck, faDisplay, faGear, faMitten, faShirt, faUser } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

type NavItem = {
    label: string;
    href: string;
    icon?: IconDefinition;
    /** Marks pages that document an overview/list screen in the application */
    isOverview?: boolean;
    children?: NavItem[];
};

const navItems: NavItem[] = [
    { label: "Übersicht", href: "/docs" },
    {
        label: "Personen",
        href: "/docs/cadet",
        icon: faUser,
        children: [
            { label: "Personalliste", href: "/docs/cadet/list", isOverview: true },
            { label: "Personendetail", href: "/docs/cadet/detail", isOverview: true },
        ],
    },
    {
        label: "Uniform",
        href: "/docs/uniform",
        icon: faShirt,
        children: [
            { label: "Uniformliste", href: "/docs/uniform/list", isOverview: true },
            { label: "Uniformteil-Panel", href: "/docs/uniform/detail", isOverview: true },
            { label: "Uniformtypen & Generationen", href: "/docs/uniform/type" },
            { label: "Größen & Größenlisten", href: "/docs/uniform/sizes" },
        ],
    },
    {
        label: "Lager",
        href: "/docs/storage",
        icon: faBoxOpen,
        children: [
            { label: "Lagerverwaltung", href: "/docs/storage/overview", isOverview: true },
        ],
    },
    { label: "Material", href: "/docs/material", icon: faMitten },
    {
        label: "Kontrollen",
        href: "/docs/inspection",
        icon: faClipboardCheck,
        children: [
            { label: "Kontrolle durchführen", href: "/docs/inspection/conduct" },
            { label: "Mängel & Mängeltypen", href: "/docs/inspection/deficiencies" },
        ],
    },
    { label: "Dashboard", href: "/docs/dashboard", icon: faChartLine },
    {
        label: "Administration",
        href: "/docs/admin/uniform",
        icon: faGear,
        children: [
            { label: "Uniform-Konfiguration", href: "/docs/admin/uniform", isOverview: true },
            { label: "Material-Konfiguration", href: "/docs/admin/material", isOverview: true },
            { label: "Benutzerverwaltung", href: "/docs/admin/users", isOverview: true },
            { label: "Organisationseinstellungen", href: "/docs/admin/settings", isOverview: true },
        ],
    },
];

export function DocsNav({ onNavigate }: { onNavigate?: () => void } = {}) {
    const pathname = usePathname();
    const params = useParams<{ locale: string }>();
    const locale = params.locale ?? "de";

    function isActive(href: string) {
        const full = `/${locale}${href}`;
        if (href === "/docs") return pathname === full;
        return pathname.startsWith(full);
    }

    return (
        <nav>
            <ul className="list-unstyled mb-0">
                {navItems.map((item) => (
                    <li key={item.href} className="mb-1">
                        <Link
                            href={`/${locale}${item.href}`}
                            className={`d-block px-2 py-1 rounded text-decoration-none ${isActive(item.href) ? "bg-primary text-white fw-semibold" : "text-dark"}`}
                            onClick={() => onNavigate?.()}
                        >
                            {item.icon && (
                                <FontAwesomeIcon icon={item.icon} className="me-2" style={{ width: "1em" }} />
                            )}
                            {item.label}
                        </Link>
                        {item.children && (
                            <ul className="list-unstyled ps-3 mt-1">
                                {item.children.map((child) => (
                                    <li key={child.href} className="mb-1">
                                        <Link
                                            href={`/${locale}${child.href}`}
                                            className={`d-flex align-items-center px-2 py-1 rounded text-decoration-none small ${isActive(child.href) ? "bg-primary text-white fw-semibold" : "text-secondary"}`}
                                            onClick={() => onNavigate?.()}
                                        >
                                            <span className="flex-grow-1">{child.label}</span>
                                            {child.isOverview && (
                                                <FontAwesomeIcon
                                                    icon={faDisplay}
                                                    title="Übersichtsseite"
                                                    className="ms-1 opacity-50"
                                                    style={{ fontSize: "0.75em" }}
                                                />
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
}
