import Title from "@/components/Title";
import { getScopedI18n } from "@/lib/locales/config";
import { faAddressCard, faCircle, faGear, faMitten, faPlus, faShirt, faUser, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { Col, Row } from "react-bootstrap";

export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles')
    return {
        title: t('home'),
    }
}
export default function Homepage() {
    return (
        <div className="container-lg rounded p-0 position-relative">
            <Title text="Uniform Admin" />
            <Row className="g-2 justify-content-evenly">
                <Col xs={"auto"}>
                    <Link href={"/app/cadet"} prefetch={false}>
                        <div className="card p-1 px-2">
                            <div className="card-title d-flex justify-content-center">
                                <FontAwesomeIcon icon={faUsers} className="fa-4x text-navy m-2" />
                            </div>
                            <div className="card-text fs-5 text-center">
                                Personalliste<br />&nbsp;
                            </div>
                        </div>
                    </Link>
                </Col>
                <Col xs={"auto"}>
                    <Link href={"/app/cadet/null"} prefetch={false}>
                        <div className="card p-1 px-2">
                            <div className="card-title d-flex justify-content-center">
                                <span className="fa-layers fa-fw fa-4x m-2">
                                    <FontAwesomeIcon icon={faUser} className="text-navy" />
                                    <FontAwesomeIcon icon={faCircle} className="text-white" transform={"shrink-8 down-6 right-7"} />
                                    <FontAwesomeIcon icon={faCircle} className="text-success" transform={"shrink-9 down-6 right-7"} />
                                    <FontAwesomeIcon icon={faPlus} className="text-white" transform={"shrink-10 down-6 right-7"} />
                                </span>
                            </div>
                            <div className="card-text fs-5 text-center">
                                Person<br />anlegen
                            </div>
                        </div>
                    </Link>
                </Col>
                <Col xs={"auto"}>
                    <Link href={"/app/uniform/list"} prefetch={false}>
                        <div className="card p-1 px-2">
                            <div className="card-title d-flex justify-content-center">
                                <FontAwesomeIcon icon={faShirt} className="fa-4x text-vivid-orange m-2" />
                            </div>
                            <div className="card-text fs-5 text-center">
                                Uniformliste <br />&nbsp;
                            </div>
                        </div>
                    </Link>
                </Col>
                <Col xs={"auto"}>
                    <Link href={"/app/uniform/new"} prefetch={false}>
                        <div className="card p-1 px-2">
                            <div className="card-title d-flex justify-content-center">
                                <span className="fa-layers fa-fw fa-4x m-2">
                                    <FontAwesomeIcon icon={faShirt} className="text-vivid-orange " />
                                    <FontAwesomeIcon icon={faCircle} className="text-white " transform={"shrink-8 down-6 right-5"} />
                                    <FontAwesomeIcon icon={faCircle} className="text-success " transform={"shrink-9 down-6 right-5"} />
                                    <FontAwesomeIcon icon={faPlus} className="text-white " transform={"shrink-10 down-6 right-5"} />
                                </span>
                            </div>
                            <div className="card-text fs-5 text-center">
                                Uniformteile <br />erstellen
                            </div>
                        </div>
                    </Link>
                </Col>
                <Col xs={"auto"}>
                    <Link href={"/app/admin/uniform"} prefetch={false}>
                        <div className="card p-1 px-2">
                            <div className="card-title d-flex justify-content-center">
                                <span className="fa-layers fa-fw fa-4x m-2">
                                    <FontAwesomeIcon icon={faShirt} className="text-vivid-orange " />
                                    <FontAwesomeIcon icon={faCircle} className="text-white " transform={"shrink-8 down-6 right-5"} />
                                    <FontAwesomeIcon icon={faCircle} className="text-navy " transform={"shrink-9 down-6 right-5"} />
                                    <FontAwesomeIcon icon={faGear} className="text-white " transform={"shrink-11 down-6 right-5"} />
                                </span>
                            </div>
                            <div className="card-text fs-5 text-center">
                                Uniform <br />Konfiguration
                            </div>
                        </div>
                    </Link>
                </Col>
                <Col xs={"auto"}>
                    <Link href={"/app/admin/uniform/sizes"} prefetch={false}>
                        <div className="card p-1 px-2">
                            <div className="card-title d-flex justify-content-center fw-bold fs-1 fs-sm-4 py-2">
                                <span className="m-2" style={{ lineHeight: "0.8em" }}>
                                    S<br />&nbsp;&nbsp;&nbsp;M<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;L
                                </span>
                            </div>
                            <div className="card-text fs-5 text-center" style={{ width: "116px" }}>
                                Uniform <br />Größen
                            </div>
                        </div>
                    </Link>
                </Col>
                <Col xs={"auto"}>
                    <Link href={"/app/admin/material"} prefetch={false}>
                        <div className="card p-1 px-2">
                            <div className="card-title d-flex justify-content-center">
                                <span className="fa-layers fa-fw fa-4x m-2">
                                    <FontAwesomeIcon icon={faMitten} className="text-success " />
                                    <FontAwesomeIcon icon={faCircle} className="text-white " transform={"shrink-8 down-6 right-5"} />
                                    <FontAwesomeIcon icon={faCircle} className="text-navy " transform={"shrink-9 down-6 right-5"} />
                                    <FontAwesomeIcon icon={faGear} className="text-white " transform={"shrink-11 down-6 right-5"} />
                                </span>
                            </div>
                            <div className="card-text fs-5 text-center">
                                Material <br />Konfiguration
                            </div>
                        </div>
                    </Link>
                </Col>
                <Col xs={"auto"}>
                    <Link href={"/app/admin/user"} prefetch={false}>
                        <div className="card p-1 px-2">
                            <div className="card-title d-flex justify-content-center">
                                <FontAwesomeIcon icon={faAddressCard} className="text-navy m-2 fa-4x" />
                            </div>
                            <div className="card-text fs-5 text-center">
                                Nutzer <br />Verwaltung
                            </div>
                        </div>
                    </Link>
                </Col>
            </Row>

        </div>
    )
}
