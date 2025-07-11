import { AuthRole } from "@/lib/AuthRoles";
import { faUser, faShirt, faBoxOpen, faPlus, faClipboardCheck, faGear, faAddressCard, faLink } from "@fortawesome/free-solid-svg-icons";
import { useParams, usePathname } from "next/navigation";
import NavButton from "./NavButton";
import NavGroup from "./NavGroup";
import { useI18n } from "@/lib/locales/client";
import NavLink from "./NavLink";
import { useInspectionState } from "@/dataFetcher/inspection";
import { startInspection, stopInspection } from "@/dal/inspection";
import { toast } from "react-toastify";
import { mutate } from "swr";
import dayjs from "@/lib/dayjs";
import { useModal } from "../modals/modalProvider";


export const SidebarLinks = ({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (b: boolean) => void }) => {
    const t = useI18n();
    const modal = useModal();

    const pathname = usePathname();
    const { locale } = useParams();
    const { inspectionState } = useInspectionState();

    function startStopInspection() {
        const inspectionMutation = () => mutate((key: object | string) => ((typeof key === "string") && /^(\/api\/inspection\/status)|(\/api\/cadet\/[\w\d-]+\/inspection)$/));

        if (inspectionState?.active || inspectionState?.state === "unfinished") {
            modal?.simpleFormModal({
                header: t("sidebar.labels.stopInspection.header"),
                elementLabel: t("sidebar.labels.stopInspection.elementLabel"),
                inputPlaceholder: "13:05",
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
                        toast.success(t('sidebar.message.inspection.stop'));
                        inspectionMutation();
                    }).catch(() => {
                        toast.error(t('sidebar.message.inspection.stopError'));
                    });
                },
                abort() { },
            });
        } else {
            if (inspectionState?.state === "planned") {
                startInspection().then(() => {
                    toast.success(t("sidebar.message.inspection.start"));
                    inspectionMutation();
                }).catch(() => {
                    toast.error(t("sidebar.message.inspection.startError"));
                });
            }
        }
    }

    return (
        <ul className="flex-column w-100 px-2" style={{ marginTop: '1rem' }}>
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
            <NavLink
                text={t('sidebar.links.storageUnit')}
                icon={faBoxOpen}
                href={"/app/uniform/storage"}
                collapsed={collapsed}
                requiredRole={AuthRole.user}
                isRoute={pathname.startsWith(`/${locale}/app/uniform/storage`)}
                testId="lnk_storageUnit" />
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
                childSelected={pathname.startsWith(`/${locale}/app/inspection`)}
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
                     <NavLink
                        text={t('sidebar.links.inspection.deficiencyType')}
                        href="/app/inspection/deficiencyType"
                        isRoute={pathname.endsWith("/app/inspection/deficiencyType")}
                        level={2}
                        requiredRole={AuthRole.materialManager}
                        collapsed={collapsed}
                        testId="lnk_adminDeficiency"
                    />
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
    );
}
