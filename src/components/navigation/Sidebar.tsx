"use client"

import { logout } from "@/actions/auth";
import { useInspectionState } from "@/dataFetcher/inspection";
import { useI18n } from "@/lib/locales/client";
import { AuthItem } from "@/lib/storageTypes";
import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Assosiation } from "@prisma/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { mutate } from "swr";
import { useModal } from "../modals/modalProvider";
import Footer from "./Footer";
import Header from "./Header";
import style from "./Sidebar.module.css";
import { SidebarLinks } from "./SidebarLinks";


type SidebarPropType = {
    assosiation: Assosiation;
    username: string;
    children: React.ReactNode;
}
const Sidebar = ({ assosiation, username, children }: SidebarPropType) => {
    const t = useI18n();
    const modal = useModal();
    const [collapsed, setCollapsed] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const { inspectionState } = useInspectionState();
    const pathname = usePathname();
    const router = useRouter();

    // Close sidebar on navigation change (when links are clicked on mobile/tablet)
    useEffect(() => {
        setShowSidebar(false);
    }, [pathname]);

    function handleLogout() {
        logout().then(() => {
            const authItemString = localStorage.getItem(process.env.NEXT_PUBLIC_LOCAL_AUTH_KEY as string);
            if (authItemString) {
                const item: AuthItem = JSON.parse(authItemString);
                item.authToken = undefined;
                item.lastLogin = undefined;
                localStorage.setItem(process.env.NEXT_PUBLIC_LOCAL_AUTH_KEY as string, JSON.stringify(item))
            }
            router.push('/login');
            mutate(() => true, undefined);
        });
    }

    return (
        <div className={`${style.sidebarContainer} ${showSidebar ? style.noScroll : ''}`}>
            {/* Safe area top fill - always present to cover notch area */}
            <div className={`${style.safeAreaTop} ${collapsed ? style.safeAreaTopCollapsed : ''
                } ${showSidebar ? style.safeAreaTopVisible : ''}`}></div>

            {/* Backdrop for mobile/tablet when sidebar is open */}
            {showSidebar && (
                <div
                    className={`${style.backdrop} d-lg-none`}
                    onClick={() => setShowSidebar(false)}
                />
            )}

            <div className='d-lg-none'>
                <Footer />
                <Header showSidebar={() => setShowSidebar(true)} />
            </div>
            <div className={`${collapsed ? style.contentCollapsed : style.content} ${showSidebar ? style.contentOverlay : ''}`} >
                <div className={`container-sm px-3 px-lg-4 py-3 m-auto`}>
                    {children}
                </div>
            </div>
            <div
                className={`bg-navy-secondary ${style.sidebar} ${collapsed
                    ? style.sidebarCollapsed
                    : style.sidebarExpanded
                    } ${showSidebar ? style.sidebarVisible : ''}`}
                role="navigation"
            >
                <div data-testid="div_sidebar" className="d-flex flex-column text-white h-100 bg-navy text-decoration-none">
                    {/* Header section - always visible */}
                    <div className="flex-shrink-0">
                        {/* Close button for mobile */}
                        <div className="d-lg-none w-100 d-flex justify-content-between align-items-center p-2 pb-1">
                            <Link href={"/"} className="text-decoration-none">
                                <p data-testid="lnk_header" className={`${style.sidebarHeaderTitleMobile} text-white m-0`}>
                                    {assosiation.name}
                                </p>
                            </Link>
                            <button
                                className="btn btn-link text-decoration-none text-white fs-4 p-1 btn-lg lh-1"
                                onClick={() => setShowSidebar(false)}
                                aria-label="Close sidebar"
                            >
                                ×
                            </button>
                        </div>

                        {/* Header for desktop */}
                        <div className={`${style.sidebarHeader} d-none d-lg-block`}>
                            <Link href={"/"} className="text-decoration-none">
                                <p data-testid="lnk_header" className={`${style.sidebarHeaderTitle} ${collapsed ? style.sidebarHeaderTitleCollapsed : ''}`}>
                                    {collapsed ? assosiation.acronym : assosiation.name}
                                </p>
                            </Link>
                            <hr className={style.sidebarDivider} />
                        </div>
                        {inspectionState?.active &&
                            <div data-testid="div_inspection" className="text-center d-none d-lg-block text-white-50 small">
                                {collapsed ? "" : 'Kontrolle: '}
                                {inspectionState.inspectedCadets}/{inspectionState.activeCadets - inspectionState.deregistrations}
                            </div>
                        }
                    </div>

                    {/* Scrollable navigation section */}
                    <div className={`${style.sidebarNavigation}`}>
                        <SidebarLinks
                            collapsed={collapsed}
                            setCollapsed={setCollapsed}
                        />
                    </div>

                    {/* Footer section - always visible */}
                    <div className="flex-shrink-0">
                        <div className="w-100">
                            <hr className={`my-1 ${collapsed ? "mx-1" : "mx-3"}`} />
                        </div>
                        <div className={`d-flex flex-row w-100 mb-2 ${collapsed ? "justify-content-center" : "justify-content-between"}`}>
                            {!collapsed &&
                                <div className="p-2 ms-3 fw-bold">
                                    <Dropdown drop="up">
                                        <Dropdown.Toggle variant="primary" className="border-0 text-white bg-navy fw-bold" data-testid={"btn_user_dropdown"}>
                                            {username}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="bg-navy-secondary border-white text-white">
                                            <Dropdown.Item onClick={handleLogout} data-testid="btn_logout" className="text-white bg-navy-secondary">
                                                {t('sidebar.logout')}
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={modal?.changeLanguage} data-testid="btn_changeSize" className="text-white bg-navy-secondary my-2 my-lg-0">
                                                {t('sidebar.changeLanguage')}
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            }
                            <button data-testid="btn_collapse" className="btn text-white btn-lg d-none d-lg-block" onClick={() => setCollapsed(!collapsed)}>
                                <FontAwesomeIcon icon={collapsed ? faAngleRight : faAngleLeft} />
                            </button>
                            <button data-testid="btn_collapse" className="btn text-white btn-lg d-lg-none" onClick={() => setShowSidebar(false)}>
                                <FontAwesomeIcon icon={faAngleLeft} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
