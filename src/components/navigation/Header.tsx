import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { Button } from "react-bootstrap";


const Header = ({ showSidebar }: {showSidebar: () => void}) => {
    return (
        <div data-testid="div_layout_header" className=" bg-navy fixed-top p-0 m-0" data-bs-theme="dark">
            <div className="d-flex flex-row justify-content-between">
                <div className="p-0 m-0">
                    <Button data-testid="btn_openSidebar" variant="outline-light" className="border-0" size="lg" onClick={showSidebar}>
                        <FontAwesomeIcon icon={faBars} />
                    </Button>
                </div>
                <div className="d-flex justify-content-center align-items-center">
                    <Link href={"/"}>
                        <p data-testid="lnk_assosiationName" className="my-auto text-white fs-5 align-middle fw-bold">

                        </p>
                    </Link>
                </div>
                <div className="m-2 me-5 aling-center">

                </div>
            </div>
        </div>
    );
}

export default Header;
