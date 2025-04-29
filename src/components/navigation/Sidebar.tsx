"use client"

import { logout } from "@/actions/auth";
import { startInspection } from "@/dal/inspection/start";
import { stopInspection } from "@/dal/inspection/stop";
import { useInspectionState } from "@/dataFetcher/inspection";
import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";
import { useI18n } from "@/lib/locales/client";
import { AuthItem } from "@/lib/storageTypes";
import { faAddressCard, faAngleLeft, faAngleRight, faClipboardCheck, faGear, faLink, faPlus, faShirt, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Assosiation } from "@prisma/client";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Col, Dropdown } from "react-bootstrap";
import { toast } from "react-toastify";
import { mutate } from "swr";
import { useModal } from "../modals/modalProvider";
import Footer from "./Footer";
import Header from "./Header";
import NavButton from "./NavButton";
import NavGroup from "./NavGroup";
import NavLink from "./NavLink";


type SidebarPropType = {
    assosiation: Assosiation;
    username: string;
    children: React.ReactNode;
}
const Sidebar = ({ assosiation, username, children }: SidebarPropType) => {
    const t = useI18n();
    const modal = useModal();
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [showSidebar, setShowSidebar] = useState<boolean>(false);
    const { inspectionState } = useInspectionState();
    const pathname = usePathname();
    const { locale } = useParams();
    const router = useRouter();

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
    function startStopInspection() {
        if (inspectionState?.active || inspectionState?.state === "unfinished") {
            modal?.simpleFormModal({
                header: 'Uniformkontrolle Beenden',
                elementLabel: 'Endzeit:',
                elementValidation: {},
                defaultValue: {
                    input: inspectionState.active ? dayjs().format('HH:mm') : "",
                },
                type: "time",
                async save({ input }) {
                    stopInspection({
                        time: input,
                        id: inspectionState.id,
                    }).then(() => {
                        toast.success('');
                    }).catch((e) => {
                        console.error(e);
                    });
                },
                abort() { },
            });
        } else {
            if (inspectionState?.state === "planned") {
                startInspection().then(() => {
                    toast.success("Uniformkontrolle erfolgreich gestartet");
                    mutate((key: any) => ((typeof key === "string") && /^(\/api\/inspection\/status)|(\/api\/cadet\/[\w\d-]+\/inspection)$/));
                });
            }
        }
    }


    return (
        <div className="row p-0 m-0">
            <div className="p-0 w-auto navbar">
                <div className='d-lg-none'>
                    <Footer />
                    <Header showSidebar={setShowSidebar} />
                </div>
                <div className={`navbar-small ${showSidebar ? "show2" : ""}`}>
                    <div data-testid="div_sidebar" className="d-flex flex-column align-items-start pt-2 text-white min-vh-100 bg-navy text-decoration-none sticky-top z-3">
                        <div className="p-0 m-0 align-self-center d-none d-md-block">
                            <Link href={"/"}>
                                <p data-testid="lnk_header" className={`fw-bold ${collapsed ? "fs-5" : "fs-4"}`}>
                                    {collapsed ? assosiation.acronym : assosiation.name}
                                </p>
                            </Link>
                            <hr className="text-white fw-bold" />
                        </div>
                        {inspectionState?.active &&
                            <div data-testid="div_inspection" className=" align-self-center d-none d-lg-inline">
                                {collapsed ? "" : 'Kontrolle: '}
                                {inspectionState.inspectedCadets}/{inspectionState.activeCadets - inspectionState.deregistrations}
                            </div>
                        }

                        <div className="d-md-none" style={{ height: "20px" }}>
                        </div>
                        <ul className="flex-column mb-auto w-100 mt-5 px-2  overflow-y-auto">
                            <NavLink
                                text={t('sidebar.links.cadetOverview')}
                                icon={faUser}
                                href={"/app/cadet"}
                                collapsed={collapsed}
                                requiredRole={AuthRole.user}
                                isRoute={(!pathname.endsWith("cadet/new") && pathname.startsWith(`/${locale}/app/cadet`))}
                                testId="lnk_cadet" />
                            <NavLink
                                text={t('sidebar.links.uniformOverview')}
                                icon={faShirt}
                                href={"/app/uniform/list"}
                                collapsed={collapsed}
                                requiredRole={AuthRole.user}
                                isRoute={pathname.startsWith(`/${locale}/app/uniform/list`)}
                                testId="lnk_uniformList" />
                            <NavGroup
                                title={t('sidebar.links.create.group')}
                                icon={faPlus}
                                childSelected={(pathname.endsWith("/cadet/new") || pathname.endsWith("/uniform/new"))}
                                collapsed={collapsed}
                                requiredRole={AuthRole.inspector}
                                setCollapsed={setCollapsed}
                                testId="btn_createGroup">
                                <ul>
                                    <NavLink
                                        text={t('sidebar.links.create.cadet')}
                                        href="/app/cadet/new"
                                        isRoute={pathname.endsWith("/cadet/new")}
                                        level={2}
                                        collapsed={collapsed}
                                        requiredRole={AuthRole.inspector}
                                        testId="lnk_createCadet" />
                                    <NavLink
                                        text={t('sidebar.links.create.uniform')}
                                        href="/app/uniform/new"
                                        isRoute={pathname.endsWith("/uniform/new")}
                                        level={2}
                                        collapsed={collapsed}
                                        requiredRole={AuthRole.inspector}
                                        testId="lnk_createUniform" />
                                </ul>
                            </NavGroup>
                            <NavGroup
                                title={t('sidebar.links.inspection.group')}
                                icon={faClipboardCheck}
                                childSelected={false}
                                collapsed={collapsed}
                                requiredRole={AuthRole.materialManager}
                                setCollapsed={setCollapsed}
                                testId="btn_inspectionGroup">
                                <ul>
                                    <NavLink
                                        text={t('sidebar.links.inspection.inspection')}
                                        href="/app/inspection"
                                        isRoute={pathname.endsWith("/app/inspection")}
                                        level={2}
                                        collapsed={collapsed}
                                        requiredRole={AuthRole.inspector}
                                        testId="lnk_inspection" />
                                    {(inspectionState?.active || inspectionState?.state === "unfinished" || inspectionState?.state === "planned") &&
                                        <NavButton
                                            text={inspectionState?.active
                                                ? t('sidebar.links.inspection.stop')
                                                : (inspectionState?.state === "planned")
                                                    ? t('sidebar.links.inspection.start')
                                                    : t('sidebar.links.inspection.unfinished')}
                                            onClick={startStopInspection}
                                            isRoute={false}
                                            level={2}
                                            collapsed={collapsed}
                                            testId="btn_inspection" />
                                    }
                                </ul>
                            </NavGroup>
                            <NavGroup
                                title={t('sidebar.links.administration.group')}
                                icon={faGear}
                                childSelected={/^\/\w{2}\/admin\//.test(pathname)}
                                collapsed={collapsed}
                                requiredRole={AuthRole.materialManager}
                                setCollapsed={setCollapsed}
                                testId="btn_adminGroup">
                                <ul>
                                    <NavLink
                                        text={t('sidebar.links.administration.uniform')}
                                        href="/app/admin/uniform"
                                        isRoute={pathname.endsWith("/app/admin/uniform")}
                                        level={2}
                                        collapsed={collapsed}
                                        requiredRole={AuthRole.materialManager}
                                        testId="lnk_adminUniform"
                                    />
                                    <NavLink
                                        text={t('sidebar.links.administration.size')}
                                        href="/app/admin/uniform/sizes"
                                        isRoute={pathname.endsWith("/app/admin/uniform/sizes")}
                                        level={2}
                                        requiredRole={AuthRole.materialManager}
                                        collapsed={collapsed}
                                        testId="lnk_adminUniformSize"
                                    />
                                    <NavLink
                                        text={t('sidebar.links.administration.material')}
                                        href="/app/admin/material"
                                        isRoute={pathname.endsWith("/app/admin/material")}
                                        level={2}
                                        requiredRole={AuthRole.materialManager}
                                        collapsed={collapsed}
                                        testId="lnk_adminMaterial"
                                    />
                                    <NavLink
                                        text={t('sidebar.links.administration.deficiency')}
                                        href="/app/admin/deficiency"
                                        isRoute={pathname.endsWith("/app/admin/deficiency")}
                                        level={2}
                                        requiredRole={AuthRole.materialManager}
                                        collapsed={collapsed}
                                        testId="lnk_adminDeficiency"
                                    />
                                </ul>
                            </NavGroup>
                            <NavLink
                                text={t('sidebar.links.userOverview')}
                                icon={faAddressCard}
                                href={"/app/admin/user"}
                                collapsed={collapsed}
                                requiredRole={AuthRole.admin}
                                isRoute={pathname.startsWith("/users")}
                                testId="lnk_users" />
                            <NavLink
                                text={t('sidebar.links.redirects')}
                                icon={faLink}
                                href={"/app/redirects"}
                                collapsed={collapsed}
                                requiredRole={AuthRole.admin}
                                isRoute={pathname.startsWith("/redirects")}
                                testId="lnk_redirects" />
                        </ul>
                        <div className="w-100">
                            <hr className={`my-0 ${collapsed ? "mx-1" : "mx-3"}`} />
                        </div>
                        <div className={`d-flex flex-row  w-100 mb-2 ${collapsed ? "justify-content-center" : "justify-content-between"}`}>
                            {!collapsed &&
                                <div className={"p-2 ms-3 fw-bold"}>
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
                            <button data-testid="btn_collapse" className="btn text-white btn-lg" onClick={() => setCollapsed(!collapsed)}>
                                <FontAwesomeIcon icon={collapsed ? faAngleRight : faAngleLeft} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Col lg={collapsed ? 11 : 9} xl={collapsed ? 11 : 10} className=' min-vh-100' onClick={() => ((window.innerWidth < 992) && showSidebar && setShowSidebar(false))}>
                <div className='row m-0'>
                    <div className={`container-fluid pt-6 pt-lg-4 pb-3 px-0`}>
                        {children}
                    </div>
                </div>
                <div className='row m-0' style={{ height: "400px" }}></div>
            </Col>
        </div>
    );
}

export default Sidebar;
