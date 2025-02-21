import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { AuthRole } from "../../lib/AuthRoles";
import { useGlobalData } from "../globalDataProvider";
import styles from "./navigation.module.css";

type NavLinkProps = {
  requiredRole: AuthRole;
  text: string;
  icon?: IconProp;
  href: string;
  isRoute: boolean;
  collapsed: boolean;
  level?: 1 | 2;
  testId: string;
};
const NavLink = ({
  text,
  icon,
  isRoute,
  href,
  level,
  collapsed,
  requiredRole,
  testId,
}: NavLinkProps) => {
  const { userRole } = useGlobalData();

  if (userRole < requiredRole) {
    return <></>;
  }

  return (
    <OverlayTrigger
      show={collapsed ? undefined : false}
      delay={{ show: 250, hide: 0 }}
      overlay={<Tooltip>{text}</Tooltip>}
    >
      <li className={`list-group-item`}>
        <button
          className={`btn text-white rounded d-flex align-items-center px-2 py-1 w-100 ${
            styles.navLink
          }
          ${isRoute ? "bg-white bg-opacity-25" : "bg-opacity-"}
          ${collapsed ? "justify-content-center" : ""}
          ${level ? (level == 2 ? "fs-6 mt-1" : "fs-6 mb-1") : "mb-1"}`}
        >
          <Link data-testid={testId} href={href} className="stretched-link">
            {icon && (
              <FontAwesomeIcon
                size="lg"
                icon={icon}
                width={20}
                className={collapsed ? "" : "pe-2"}
              />
            )}
            {!collapsed && text}
          </Link>
        </button>
      </li>
    </OverlayTrigger>
  );
};

export default NavLink;
