"use client"

import { useBreakpoint } from "@/lib/useBreakpoint";
import { initViewportHeight } from "@/lib/viewportUtils";
import { Assosiation } from "@prisma/client";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSessionStorage } from "usehooks-ts";
import Footer from "./Footer";
import Header from "./Header";
import style from "./Sidebar.module.css";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarLinks } from "./SidebarLinks";

// Sidebar Context
type SidebarContextType = {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    setShowSidebar: (show: boolean) => void;
    isSidebarFixed: boolean;
    isMobile: boolean;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarContext = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebarContext must be used within a SidebarProvider');
    }
    return context;
};

type SidebarPropType = {
    assosiation: Assosiation;
    username: string;
    children: React.ReactNode;
}

const Sidebar = ({ assosiation, username, children }: SidebarPropType) => {

    const collapseButtonRef = useRef<HTMLButtonElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [collapsed, setCollapsed] = useState(true);
    const [isSidebarFixed] = useSessionStorage("sidebarFixed", true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isOverCollapseButton, setIsOverCollapseButton] = useState(false);

    const { match: isMobile } = useBreakpoint("lg", "lt");
    const pathname = usePathname();

    // Close sidebar on navigation change (when links are clicked on mobile/tablet)
    useEffect(() => {
        setShowSidebar(false);
    }, [pathname]);

    // Initialize viewport height handling for mobile browser compatibility
    useEffect(() => {
        const cleanup = initViewportHeight();
        return cleanup;
    }, []);

    useEffect(() => {
        if (isMobile) {
            setShowSidebar(false);
            setCollapsed(false);
        }
    }, [isMobile]);

    // Sidebar context value
    const sidebarContextValue: SidebarContextType = {
        collapsed: collapsed && !isSidebarFixed,
        setCollapsed,
        isSidebarFixed,
        isMobile: !!isMobile,
        setShowSidebar,
    };

    function handleMouseEnter(e: React.MouseEvent) {
        // Only for large screens
        if (isMobile) return;

        const children = (e.target as HTMLDivElement).childNodes;
        const collapseButton = collapseButtonRef.current === e.target || Array.from(children).includes(collapseButtonRef.current as ChildNode);

        if (collapseButton) {
            setIsOverCollapseButton(true);
        } else if (!isSidebarFixed && !isOverCollapseButton) {
            setCollapsed(false);
        }
    }

    function handleCollapseButtonMouseLeave(e: React.MouseEvent) {
        if (isMobile) return;

        const relatedTarget = e.relatedTarget as Node;
        const isLeavingToSidebar = sidebarRef.current && sidebarRef.current.contains(relatedTarget);

        setIsOverCollapseButton(false);

        if (isLeavingToSidebar && !isSidebarFixed) {
            setCollapsed(false);
        }
    }

    function handleMouseLeave(e: React.MouseEvent) {
        // Only for large screens
        if (isMobile) return;

        const relatedTarget = e.relatedTarget as Node;
        const isLeavingToCollapseButton = collapseButtonRef.current && collapseButtonRef.current.contains(relatedTarget);

        if (isLeavingToCollapseButton) {
            setIsOverCollapseButton(true);
            return;
        }

        setIsOverCollapseButton(false);
        if (!isSidebarFixed) {
            setCollapsed(true);
        }
    }

    function handleSidebarClick(e: React.MouseEvent) {
        // Only for large screens
        if (isMobile) return;

        // If sidebar is not fixed and collapsed, open it and prevent default actions
        if (!isSidebarFixed && collapsed) {
            e.preventDefault();
            e.stopPropagation();
            setCollapsed(false);
            return;
        }
    }

    function handleContentClick() {
        // Only for large screens
        if (isMobile) return;

        // If sidebar is not fixed and not collapsed, collapse it and prevent other actions
        if (!isSidebarFixed && !collapsed) {
            setCollapsed(true);
            return true; // Indicate that the click was handled
        }
        return false;
    }

    const isCollapsed = collapsed && !isSidebarFixed;

    return (
        <SidebarContext.Provider value={sidebarContextValue}>
            <div className={`${style.sidebarContainer} ${showSidebar ? style.noScroll : ''}`}>
                {/* Safe area top fill - always present to cover notch area */}
                <div className={`${style.safeAreaTop} ${isCollapsed ? style.safeAreaTopCollapsed : ''
                    } ${showSidebar ? style.safeAreaTopVisible : ''}`}>
                </div>

                {/* Backdrop for mobile/tablet when sidebar is open */}
                {(showSidebar && isMobile) && (
                    <div
                        className={`${style.backdrop} d-lg-none`}
                        onClick={() => setShowSidebar(false)}
                    />
                )}

                <div className='d-lg-none'>
                    <Footer />
                    <Header showSidebar={() => setShowSidebar(true)} />
                </div>
                <div className={`${style.content} ${!isSidebarFixed ? style.contentCollapsed : ""} ${showSidebar ? style.contentOverlay : ''}`}
                    onClick={(e) => {
                        const handled = handleContentClick();
                        if (handled) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                >
                    <div className={`container-lg px-3 px-lg-4 py-3 m-auto`}>
                        {children}
                    </div>
                </div>
                <div
                    ref={sidebarRef}
                    className={`bg-navy-secondary ${style.sidebar} ${(isCollapsed)
                        ? style.sidebarCollapsed
                        : style.sidebarExpanded
                        } ${showSidebar ? style.sidebarVisible : ''}`}
                    role="navigation"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleSidebarClick}
                >
                    <div data-testid="div_sidebar" className="d-flex flex-column text-white h-100 bg-navy text-decoration-none">
                        {/* Header section - always visible */}
                        <SidebarHeader assosiation={assosiation} />
                        {/* Scrollable navigation section */}
                        <SidebarLinks />
                        {/* Footer section - always visible */}
                        <SidebarFooter
                            username={username} 
                            collapseButtonRef={collapseButtonRef}
                            handleCollapseButtonMouseLeave={handleCollapseButtonMouseLeave}
                        />
                    </div>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}

export default Sidebar;
