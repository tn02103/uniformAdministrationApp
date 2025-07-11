import { faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import style from './SidebarHeader.module.css';
import { Assosiation } from "@prisma/client";
import { useSidebarContext } from './Sidebar';
import { useInspectionState } from '@/dataFetcher/inspection';

export type SidebarHeaderProps = {
    assosiation: Assosiation;
}

export const SidebarHeader = ({ assosiation }: SidebarHeaderProps) => {
    const { collapsed, isSidebarFixed, setShowSidebar } = useSidebarContext();
    const { inspectionState } = useInspectionState();
    const isCollapsed = collapsed && !isSidebarFixed;
    
    return (
        <div className="flex-shrink-0">
            <div className={`${style.sidebarHeader}`}>
                <div className="w-100 position-relative align-items-center p-2 pb-1">
                    <Link href={"/"} className="text-decoration-none">
                        <p data-testid="lnk_header" className={`${style.sidebarHeaderTitle} ${isCollapsed ? style.sidebarHeaderTitleCollapsed : ''}`}>
                            {assosiation.name}
                        </p>
                    </Link>
                    <button
                        className="d-sm-none btn btn-link text-decoration-none text-white fs-5 position-absolute end-0 top-50 translate-middle-y"
                        onClick={() => setShowSidebar(false)}
                        aria-label="Close sidebar"
                    >
                        <FontAwesomeIcon icon={faX} />
                    </button>
                </div>
            </div>
            <hr className={style.sidebarDivider} />
            {inspectionState?.active &&
                <div data-testid="div_inspection" className="text-center d-none d-lg-block text-white-50 small">
                    {isCollapsed ? "" : 'Kontrolle: '}
                    {inspectionState.inspectedCadets}/{inspectionState.activeCadets - inspectionState.deregistrations}
                </div>
            }
        </div>
    );
}