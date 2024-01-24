"use client"

import { faHome, faShirt, faUserCircle, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Footer = () => {
    const pathname = usePathname();


    return (
        <div data-testid="div_layout_footer" className="fixed-bottom bg-navy d-flex flex-row justify-content-evenly align-items-middle text-white">
            <Link data-testid="lnk_home" href={"/"} className={`align-items-center m-2 fs-1 ${pathname === "/" ? "text-primary" : ""}`}>
                <FontAwesomeIcon icon={faHome} />
            </Link>
            <Link data-testid="lnk_cadet" href={"/cadet"} className={`align-items-center m-2 fs-1 ${pathname.startsWith("/cadet") ? "text-primary" : ""}`}>
                <FontAwesomeIcon icon={faUsers} />
            </Link>
            <Link data-testid="lnk_uniform" href={"/uniform/list"} className={`align-items-center m-2 fs-1 ${pathname.startsWith("/uniform") ? "text-primary" : ""}`}>
                <FontAwesomeIcon icon={faShirt} />
            </Link>
            <Link data-testid="lnk_users" href={"/users"} className={`align-items-center m-2 fs-1 ${pathname.startsWith("/users") ? "text-primary" : ""}`}>
                <FontAwesomeIcon icon={faUserCircle} />
            </Link>
        </div>
    );
}

export default Footer;
