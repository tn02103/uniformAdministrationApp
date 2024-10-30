import { AuthRole } from '@/lib/AuthRoles';
import { NavGroup, NavGroupSmall, NavGroupSmallText } from './NavGroup';
import { NavLink, NavLinkDropdown, NavLinkSmall, NavLinkSmallText } from './NavLink';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ReactElement } from 'react';

interface NavItem {
    text: string;
    icon?: IconProp;
    href?: string;
    requiredRole: AuthRole;
    testId: string;
    childSelected?: boolean;
    children?: NavItem[];
}

interface NavProps {
    navData: NavItem[];
    screenType: 'full' | 'half' | 'mobile';
}

const Nav = ({ navData, screenType }: NavProps) => {
    console.log(screenType)
    const getComponents = () => {
        switch (screenType) {
            case 'mobile':
                return {
                    GroupComponent: NavGroupSmallText,
                    LinkComponent: NavLinkSmallText
                };
            case 'half':
                return {
                    GroupComponent: NavGroupSmall,
                    LinkComponent: NavLinkSmall
                };
            default:
                return {
                    GroupComponent: NavGroup,
                    LinkComponent: NavLink
                };
        }
    };

    const { GroupComponent, LinkComponent }: { GroupComponent: any, LinkComponent: any } = getComponents(); // TODO Add real types

    const renderNavLink = (item: NavItem): ReactElement => (
        <LinkComponent
            text={item.text}
            icon={item.icon}
            href={item.href!}
            requiredRole={item.requiredRole}
            testId={item.testId}
        />
    );

    const renderNavGroup = (item: NavItem): ReactElement => (
        <GroupComponent
            text={item.text}
            icon={item.icon!}
            childSelected={item.childSelected || false}
            requiredRole={item.requiredRole}
            testId={item.testId}
        >
            {item.children?.map((child, index) => (
                <LinkComponent
                    key={index}
                    text={child.text}
                    icon={child.icon}
                    href={child.href!}
                    requiredRole={child.requiredRole}
                    testId={child.testId}
                />
            ))}
        </GroupComponent>
    );

    const renderNavDropdownGroup = (item: NavItem): ReactElement => (
        <GroupComponent
            text={item.text}
            icon={item.icon!}
            childSelected={item.childSelected || false}
            requiredRole={item.requiredRole}
            testId={item.testId}
        >
            {item.children?.map((child, index) => (
                <NavLinkDropdown
                    key={index} 
                    text={child.text}
                    requiredRole={child.requiredRole}
                    testId={child.testId}
                    href={child.href!}
                />
            ))}
        </GroupComponent>
    );

    return (
        <>
            {navData.map((item, index) => (
                <div key={index}>
                    {item.children === undefined 
                        ? renderNavLink(item)
                        : screenType === 'full' 
                        ? renderNavGroup(item)
                        : renderNavDropdownGroup(item)
                    }
                </div>
            ))}
        </>
    );
};

export default Nav;