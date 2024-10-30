import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useGlobalData } from "../globalDataProvider";
import { AuthRole } from "../../lib/AuthRoles";
import { usePathname } from "next/navigation";
import { Dropdown } from "react-bootstrap";

type NavLinkProps = {
    requiredRole: AuthRole;
    text: string;
    icon?: IconProp;
    href: string;
    testId: string;
};

export const NavLink = ({ text, icon, href, requiredRole, testId }: NavLinkProps) => {
    const { userRole } = useGlobalData();
    const pathname = usePathname();
    
    if (userRole < requiredRole) return null;

    return (
        <li className="list-group-item overlay-button-effects rounded w-100 position-relative mb-3 px-3 py-1" style={{ height: 26 }}>
            <Link 
                data-testid={testId}
                href={href} 
                className="d-flex align-items-center h-100" 
                aria-label={text}
            >
                {icon && (
                    <div className="d-flex align-items-center justify-content-center h-100 me-3" style={{ width: 18 }}>
                        <FontAwesomeIcon icon={icon} />
                    </div>
                )}
                <h3 className="mb-0 h-100 lh-1">{text}</h3>
            </Link>
            {pathname.endsWith(href) && (
                <div className="w-100 h-100 bg-white opacity-25 position-absolute top-0 start-0 rounded" />
            )}
        </li>
    );
};

export const NavLinkSmall = ({ text, icon, href, requiredRole, testId }: NavLinkProps) => {
    const { userRole } = useGlobalData();
    const pathname = usePathname();
    
    if (userRole < requiredRole) return null;

    return (
        <li className="list-group-item overlay-button-effects rounded w-100 position-relative mb-3" style={{ height: 42 }}>
            <Link
                data-testid={testId}
                href={href}
                className="d-flex align-items-center justify-content-center h-100 w-100"
                style={{ cursor: 'pointer' }}
            >
                <div className="d-flex flex-column align-items-center justify-content-center h-100 w-100" style={{ paddingTop: '2px', gap: '3px' }}>
                    {icon && <FontAwesomeIcon icon={icon} />}
                    <h4 className='m-0'>{text}</h4>
                </div>
                {pathname.endsWith(href) && (
                    <div className="w-100 h-100 bg-white opacity-25 position-absolute top-0 start-0 rounded" />
                )}
            </Link>
        </li>
    );
};

export const NavLinkSmallText = ({ text, icon, href, requiredRole, testId }: NavLinkProps) => {
    const { userRole } = useGlobalData();
    const pathname = usePathname();
    
    if (userRole < requiredRole) return null;

    return (
        <li className="list-group-item overlay-button-effects rounded h-100 w-100 position-relative d-flex flex-fill px-3">
            <Link
                data-testid={testId}
                href={href}
                className="d-flex align-items-center justify-content-center h-100 w-100"
                style={{ cursor: 'pointer' }}
            >
                <div className="d-flex flex-column align-items-center justify-content-evenly h-100 w-100">
                    {icon && <FontAwesomeIcon icon={icon} />}
                    <h4 className="lh-1 m-0" style={{ fontSize: 15 }}>{text}</h4>
                </div>
                {pathname.endsWith(href) && (
                    <div className="w-100 h-100 bg-white opacity-25 position-absolute top-0 start-0 rounded" />
                )}
            </Link>
        </li>
    );
};

export const NavLinkDropdown = ({ text, href, requiredRole, testId }: NavLinkProps) => {
    const { userRole } = useGlobalData();
    const pathname = usePathname();
    
    if (userRole < requiredRole) return null;

    return (
        <Dropdown.Item className='px-3 mb-0 rounded'  href={href}><h4 className="my-2">{text}</h4></Dropdown.Item>
    );
};