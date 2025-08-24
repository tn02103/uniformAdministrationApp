import { logout } from "@/actions/auth";
import { useI18n } from "@/lib/locales/client";
import { AuthItem } from "@/lib/storageTypes";
import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { Ref } from "react";
import { Dropdown } from "react-bootstrap";
import { mutate } from "swr";
import { useSessionStorage } from "usehooks-ts";
import { useModal } from "../modals/modalProvider";
import { useSidebarContext } from "./Sidebar";

type SidebarFooterProps = {
    username: string;
    collapseButtonRef: Ref<HTMLButtonElement>;
    handleCollapseButtonMouseLeave: (e: React.MouseEvent) => void;
}

export const SidebarFooter = ({ username, collapseButtonRef, handleCollapseButtonMouseLeave }: SidebarFooterProps) => {
    const t = useI18n();
    const modal = useModal();
    const router = useRouter();

    const { collapsed, setCollapsed, isSidebarFixed, setShowSidebar } = useSidebarContext();
    const [, setSidebarFixed] = useSessionStorage("sidebarFixed", true);

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
                <button
                    data-testid="btn_fix_sidebar"
                    className="btn text-white btn-lg d-none d-lg-block"
                    onClick={() => {
                        if (isSidebarFixed) {
                            setCollapsed(true);
                        }
                        setSidebarFixed(!isSidebarFixed)
                    }}
                    onMouseLeave={handleCollapseButtonMouseLeave}
                    ref={collapseButtonRef}
                >
                    <FontAwesomeIcon icon={isSidebarFixed ? faAngleLeft : faAngleRight} />
                </button>
                <button data-testid="btn_collapse_mobile" className="btn text-white btn-lg d-lg-none" onClick={() => setShowSidebar(false)}>
                    <FontAwesomeIcon icon={faAngleLeft} />
                </button>
            </div>
        </div>
    );
};
