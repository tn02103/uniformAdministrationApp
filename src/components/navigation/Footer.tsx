"use client";

import {
  faGear,
  faHome,
  faShirt,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dropdown, DropdownMenu, DropdownToggle } from "react-bootstrap";

const Footer = () => {
  const pathname = usePathname();

  return (
    <div
      data-testid="div_layout_footer"
      className="fixed-bottom bg-navy d-flex justify-content-evenly align-items-center text-white py-1"
    >
      <Link
        data-testid="lnk_home"
        href={"/app"}
        className={`${pathname === "/" ? "text-primary" : ""}`}
      >
        <FontAwesomeIcon icon={faHome} size="xl" />
      </Link>
      <Link
        data-testid="lnk_cadet"
        href={"/app/cadet"}
        className={`${pathname.includes("/app/cadet") ? "text-primary" : ""}`}
      >
        <FontAwesomeIcon icon={faUsers} size="xl" />
      </Link>
      <Link
        data-testid="lnk_uniform"
        href={"/app/uniform/list"}
        className={`${pathname.includes("/app/uniform") ? "text-primary" : ""}`}
      >
        <FontAwesomeIcon icon={faShirt} size="xl" />
      </Link>
      <Dropdown drop="up-centered">
        <DropdownToggle className="bg-transparent border-0 align-items-center">
          <FontAwesomeIcon
            icon={faGear}
            className={pathname.includes("/app/admin") ? "text-primary" : ""}
            size="xl"
          />
        </DropdownToggle>
        <DropdownMenu className="fs-5 p-0">
          <Link
            className="dropdown-item border-1 border-bottom"
            href="/app/admin/user"
          >
            Nutzer
          </Link>
          <Link
            className="dropdown-item border-1 border-bottom"
            href="/app/admin/uniform"
          >
            Uniform
          </Link>
          <Link
            className="dropdown-item border-1 border-bottom"
            href="/app/admin/uniform/sizes"
          >
            Größen
          </Link>
          <Link className="dropdown-item " href="/app/admin/material">
            Material
          </Link>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default Footer;
