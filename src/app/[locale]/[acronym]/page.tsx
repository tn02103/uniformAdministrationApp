import Title from "@/components/Title";
import { getScopedI18n } from "@/lib/locales/config";
import { faAdd, faAddressCard, faArrowUp19, faArrowUpFromBracket, faBox, faCircle, faCog, faGear, faList, faMitten, faPlus, faPlusCircle, faScaleBalanced, faShirt, faUpRightAndDownLeftFromCenter, faUser, faUsers, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { Col, Row } from "react-bootstrap";

export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles')
    return {
        title: t('home'),
    }
}

export function Card({ title, icon, href }: { title: string, icon: IconDefinition, href: string }) {
    return (
        <Col xs={"auto"} className="m-0">
            <Link href={href} prefetch={false}>
                <button className="btn card border d-flex flex-row align-items-center justify-content-center px-3 py-1">
                    <FontAwesomeIcon icon={icon} size={"1x"} className="text-navy me-2"/>
                    <span className="fs-5 w-100 text-center">{title}</span>
                </button>
            </Link>
        </Col>
    )
}

export default function Homepage() {
    return (
        <div className="container-lg rounded p-0 position-relative">
            <Title text="Uniform Admin" />
            <Row className="g-2 m-2">
                <Row className="p-0 mx-2 mb-1 fs-5">Personal</Row>
                <Card href={"/app/cadet"} title="Liste" icon={faList}/>
                <Card href={"/app/cadet/new"} title="Anlegen" icon={faPlusCircle}/>
                <Row className="p-0 mx-2 my-1 fs-5">Uniform</Row>
                <Card href={"/app/uniform/list"} title="Liste" icon={faList}/>
                <Card href={"/app/uniform/new"} title="Anlegen" icon={faPlusCircle} />
                <Row className="p-0 mx-2 my-1 fs-5">Verwaltung</Row>
                <Card href={"/app/admin/uniform"} title="Uniform" icon={faShirt} />
                <Card href={"/app/admin/uniform/sizes"} title="Uniform Größen" icon={faArrowUp19} />
                <Card href={"/app/admin/material"} title="Material" icon={faBox} />
                <Card href={"/app/admin/user"} title="Nutzer" icon={faUsers} />
            </Row>
        </div>
    )
}
