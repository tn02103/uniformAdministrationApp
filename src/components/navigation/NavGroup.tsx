import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { ReactElement } from "react";
import { AuthRole } from "../../lib/AuthRoles";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useGlobalData } from "../globalDataProvider";
import { ButtonGroup, Dropdown } from "react-bootstrap";
import DropdownButton from 'react-bootstrap/DropdownButton';

type BaseNavGroupProps = {
    text: string;
    icon: IconProp;
    childSelected: boolean;
    requiredRole: AuthRole;
    children: ReactElement | ReactElement[];
    testId: string;
}

export const NavGroup = ({
    text,
    icon,
    childSelected,
    requiredRole,
    testId,
    children
}: BaseNavGroupProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const { userRole } = useGlobalData();

    if (userRole < requiredRole) return null;

    return (
        <li className={`list-group-item w-100 position-relative mb-3`} style={{ height: 'auto' }}>
            <div
                data-testid={testId}
                className="d-flex align-items-center justify-content-center w-100 ps-3 pe-3 py-1 overlay-button-effects rounded"
                onClick={() => setIsExpanded(prev => !prev)}
                aria-expanded={isExpanded}
                style={{ cursor: 'pointer', height: 26 }}
            >
                <div className="d-flex align-items-center h-100">
                    <FontAwesomeIcon
                        icon={icon}
                        className="me-3"
                    />
                    <h3 className="mb-0 h-100 lh-1">{text}</h3>
                </div>
                <FontAwesomeIcon
                    icon={isExpanded ? faAngleUp : faAngleDown}
                    className="ms-auto"
                />
                {childSelected && !isExpanded && (
                    <div className="w-100 h-100 bg-white opacity-25 position-absolute top-0 start-0 rounded" />
                )}
            </div>
            {isExpanded && (
                <ul className="flex-column w-100 ps-4 pt-3">
                    {children}
                </ul>
            )}
        </li>
    );
};

export const NavGroupSmall = ({
    text,
    icon,
    childSelected,
    requiredRole,
    testId,
    children
}: BaseNavGroupProps) => {
    const { userRole } = useGlobalData();

    if (userRole < requiredRole) return null;

    return (
        <>        
            <style>
                {`
                    .dropdown-no-arrow::after {
                        display: none !important;
                    }
                `}
            </style>
            <Dropdown className="list-group-item overlay-button-effects rounded w-100 position-relative mb-3" style={{ height: 42, zIndex: 1050 }} drop='end'>
                <Dropdown.Toggle
                    data-testid={testId}
                    className="d-flex align-items-center justify-content-center bg-transparent border-0 h-100 w-100 dropdown-no-arrow"
                    style={{ cursor: 'pointer' }}
                >
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 w-100" style={{ gap: '2px' }}>
                        {icon && <FontAwesomeIcon icon={icon} />}
                        <h4 className='m-0'>{text}</h4>
                    </div>
                    {childSelected && (
                        <div className="w-100 h-100 bg-white opacity-25 position-absolute top-0 start-0 rounded" />
                    )}
                </Dropdown.Toggle>
                <Dropdown.Menu className="p-0" renderOnMount popperConfig={{ strategy: 'fixed' }}>
                    {children}
                </Dropdown.Menu>
            </Dropdown>
        </>
    );
};

export const NavGroupSmallText = ({ // TODO Spacing is VERY slightly off. ANNOYING!
    text,
    icon,
    childSelected,
    requiredRole,
    testId,
    children
}: BaseNavGroupProps) => {
    const { userRole } = useGlobalData();

    if (userRole < requiredRole) return null;

    return (
        <>
            <style>
                {`
                    .dropdown-no-arrow::after {
                        display: none !important;
                    }
                `}
            </style>
            <Dropdown className="list-group-item overlay-button-effects rounded h-100 px-3 flex-fill position-relative" drop='up-centered'>
                <Dropdown.Toggle
                    data-testid={testId}
                    className="d-flex align-items-center justify-content-center h-100 w-100 bg-transparent border-0 p-0 dropdown-no-arrow"
                    style={{ cursor: 'pointer' }}
                >   
                    <div className="d-flex flex-column align-items-center justify-content-evenly h-100 w-100" style={{ paddingTop: '2px', gap: '3px' }}>
                        {icon && <FontAwesomeIcon icon={icon} />}
                        <h4 className="lh-1 m-0" style={{ fontSize: 15 }}>{text}</h4>
                    </div>
                    {childSelected && (
                        <div className="w-100 h-100 bg-white opacity-25 position-absolute top-0 start-0 rounded" />
                    )}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100 p-0" renderOnMount popperConfig={{ strategy: 'fixed' }}>
                    {children}
                </Dropdown.Menu>
            </Dropdown>
        </>
    );
};