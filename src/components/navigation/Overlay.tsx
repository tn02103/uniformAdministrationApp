"use client";

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faClipboardCheck, faGear, faHome, faPlus, faShirt, faSignOut, faUser } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from "@/lib/locales/client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AuthRole } from '@/lib/AuthRoles';
import { AuthItem } from '@/lib/storageTypes';
import { logout } from '@/actions/auth';
import { mutate } from 'swr';
import "./Overlay.css";
import Nav from './Nav';
import { Assosiation } from '@prisma/client';
import { useInspectionState } from '@/dataFetcher/inspection';
import { toast } from 'react-toastify';
import { startInspection } from "@/actions/controllers/InspectionController";

type SidebarPropType = {
    association: Assosiation;
    username: string;
    children: React.ReactNode;
}

// TODO Sticky columns are positioned higher than dropdowns
const Overlay = ({ association, username, children }: SidebarPropType) => {
    const t = useI18n();
    const { inspectionState } = useInspectionState();
    const pathname = usePathname();
    const { locale } = useParams();
    const router = useRouter();
    const [screenType, setScreenType] = useState<'full' | 'half' | 'mobile'>('full');

    const getScreenType = () => {
        const width = window.innerWidth;
        if (width >= 1000) return 'full';
        if (width >= 600) return 'half';
        return 'mobile';
    };

    function handleLogout() {
        logout().then(() => {
            const authItemString = localStorage.getItem(process.env.NEXT_PUBLIC_LOCAL_AUTH_KEY as string);
            if (authItemString) {
                const item: AuthItem = JSON.parse(authItemString);
                item.authToken = undefined;
                item.lastLogin = undefined;
                localStorage.setItem(process.env.NEXT_PUBLIC_LOCAL_AUTH_KEY as string, JSON.stringify(item));
            }
            router.push('/login');
            mutate(() => true, undefined);
        });
    }

    function startStopInspection() {
        if (inspectionState?.active) {
            // TODO stop inspection
        } else {
            startInspection().then(() => {
                toast.success("Uniformkontrolle erfolgreich gestartet");
                mutate((key: any) => ((typeof key === "string") && /^(\/api\/inspection\/status)|(\/api\/cadet\/[\w\d-]+\/inspection)$/));
            });
        }
    }

    useEffect(() => { // !! TODO / ISSUE !! Find the screen type faster, as this currently always causes the 'full' page to show up briefly when reloading  
        const handleResize = () => setScreenType(getScreenType());
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navData = [
        {
            type: 'link',
            icon: faHome,
            text: t('sidebar.links.home'),
            href: "/app",
            requiredRole: AuthRole.user,
            testId: "lnk_cadet"
        },
        {
            type: 'link',
            icon: faUser,
            text: t('sidebar.links.cadetOverview'),
            href: "/app/cadet",
            requiredRole: AuthRole.user,
            testId: "lnk_cadet"
        },
        {
            type: 'link',
            icon: faShirt,
            text: t('sidebar.links.uniformOverview'),
            href: "/app/uniform/list",
            requiredRole: AuthRole.user,
            testId: "lnk_uniformList"
        },
        {
            type: 'group',
            icon: faPlus,
            text: t('sidebar.links.create.group'),
            requiredRole: AuthRole.inspector,
            childSelected: pathname.endsWith("/cadet/new") || pathname.endsWith("/uniform/new"),
            testId: "btn_createGroup",
            children: [
                {
                    text: t('sidebar.links.create.cadet'),
                    href: "/app/cadet/new",
                    requiredRole: AuthRole.inspector,
                    testId: "lnk_createCadet"
                },
                {
                    text: t('sidebar.links.create.uniform'),
                    href: "/app/uniform/new",
                    requiredRole: AuthRole.inspector,
                    testId: "lnk_createUniform"
                }
            ]
        },
        {
            type: 'group',
            icon: faClipboardCheck,
            text: t('sidebar.links.inspection.group'),
            requiredRole: AuthRole.materialManager,
            childSelected: false,
            testId: "btn_inspectionGroup",
            children: [
                {
                    text: t('sidebar.links.inspection.start'),
                    href: "/app/inspection/start",
                    requiredRole: AuthRole.materialManager,
                    testId: "btn_inspection"
                }
            ]
        },
        {
            type: 'group',
            icon: faGear,
            text: t('sidebar.links.administration.group'),
            requiredRole: AuthRole.materialManager,
            childSelected: /^\/\w{2}\/admin\//.test(pathname),
            testId: "btn_adminGroup",
            children: [
                {
                    text: t('sidebar.links.administration.uniform'),
                    href: "/app/admin/uniform",
                    requiredRole: AuthRole.materialManager,
                    testId: "lnk_adminUniform"
                },
                {
                    text: t('sidebar.links.administration.size'),
                    href: "/app/admin/uniform/sizes",
                    requiredRole: AuthRole.materialManager,
                    testId: "lnk_adminUniformSize"
                },
                {
                    text: t('sidebar.links.administration.material'),
                    href: "/app/admin/material",
                    requiredRole: AuthRole.materialManager,
                    testId: "lnk_adminMaterial"
                },
                {
                    text: t('sidebar.links.administration.deficiency'),
                    href: "/app/admin/deficiency",
                    requiredRole: AuthRole.materialManager,
                    testId: "lnk_adminDeficiency"
                }
            ]
        },
        {
            type: 'link',
            icon: faAddressCard,
            text: t('sidebar.links.userOverview'),
            href: "/app/admin/user",
            requiredRole: AuthRole.admin,
            testId: "lnk_users"
        }
    ];

    return (
        <>
            {screenType === 'mobile' && (
                <div className="d-flex flex-row vw-100 h-100" style={{ flexFlow: "wrap" }}>
                    <div className="px-3 pt-3 flex-grow-1" style={{ height: 50 }}>
                        <h3 className="text-truncate text-white d-flex align-items-center p-3 rounded bg-blue lh-1" style={{ width: '-moz-available', cursor: 'default', height: 40 }}>
                            {association.name}
                        </h3>
                    </div>
                    {children}
                    <div className="overlay bg-blue text-white d-flex flex-grow-1 justify-content-between fixed-bottom p-3" style={{ overflowX: 'scroll', height: 60 }}>
                        <Nav navData={navData} screenType={screenType} />
                    </div>
                </div>
            )}
    
            {screenType === 'half' && (
                <div className="d-flex flex-column h-100">
                    <div className="d-flex px-3 pt-3" style={{ width: '-moz-available', marginLeft: 120, height: 50 }}>
                        <h3 className="m-0 text-truncate text-white d-flex align-items-center px-3 pb-0 rounded bg-blue lh-1" style={{ width: '100%', cursor: 'default', height: 40 }}>
                            {association.name}
                        </h3>
                    </div>
                    <div className="position-fixed h-100">
                        <div className="overlay bg-blue text-white d-flex flex-column h-100" style={{ width: 120 }}>
                            <ul className="flex-column mb-auto w-100 overflow-auto" style={{ padding: 10, paddingTop: 60 }}>
                                <Nav navData={navData} screenType={screenType} />
                            </ul>
                            <div className="border-top border-black border-opacity-25 d-flex align-items-center px-3 justify-content-center" style={{ height: 60 }}>
                                <FontAwesomeIcon icon={faSignOut} onClick={handleLogout} cursor="pointer" />
                            </div>
                        </div>
                    </div>
                    <div style={{ marginLeft: 130 }} className="flex-grow-1">
                        {children}
                    </div>
                </div>
            )}
    
            {screenType === 'full' && (
                <div className="d-flex h-100">
                    <div className="position-fixed h-100">
                        <div className="overlay bg-blue text-white d-flex flex-column h-100" style={{ width: 300 }}>
                            <div className="border-bottom border-black border-opacity-25 px-5 d-flex align-items-center" style={{ height: 60 }}>
                                <h3 className="m-0 text-truncate" style={{ cursor: 'default' }}>
                                    {association.name}
                                </h3>
                            </div>
                            <ul className="flex-column mb-auto w-100 p-4 overflow-auto">
                                <Nav navData={navData} screenType={screenType} />
                            </ul>
                            <div className="border-top border-black border-opacity-25 d-flex align-items-center px-5" style={{ height: 60 }}>
                                <h3 className="m-0 text-truncate me-auto" style={{ cursor: 'default' }}>
                                    {username}
                                </h3>
                                <FontAwesomeIcon icon={faSignOut} onClick={handleLogout} cursor="pointer" />
                            </div>
                        </div>
                    </div>
                    <div style={{ marginLeft: 330 }} className="flex-grow-1">
                        {children}
                    </div>
                </div>
            )}
        </>
    );    
};

export default Overlay;