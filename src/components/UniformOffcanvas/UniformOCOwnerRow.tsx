import { useI18n } from "@/lib/locales/client"
import { UniformWithOwner } from "@/types/globalUniformTypes";
import dayjs from "dayjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Row, Col } from "react-bootstrap";


type UniformOCOwnerRowProps = {
    uniform: UniformWithOwner;
}
export const UniformOCOwnerRow = ({ uniform }: UniformOCOwnerRowProps) => {
    const t = useI18n();
    const pathname = usePathname();
    const isCadetOverview = /^\/\w\w\/app\/cadet\/[\da-f\-]{36}$/.test(pathname);

    return (
        <>
            <h4>{t('uniformOffcanvas.owner.label')}</h4>
            <hr className="mb-0 mt-4" />
            <Row className="mt-2 mb-4" data-testid="div_owner_row">
                <Col>
                    <div className="fw-bold">
                        {t('uniformOffcanvas.owner.issuedTo')}:
                    </div>
                    {isCadetOverview ?
                        <p>
                            {uniform.issuedEntries[0].cadet.firstname} {uniform.issuedEntries[0].cadet.lastname}
                        </p>
                        :
                        <Link
                            className="text-decoration-underline"
                            href={"/app/cadet/" + uniform.issuedEntries[0].cadet.id}
                            prefetch={true}
                        >
                            {uniform.issuedEntries[0].cadet.firstname} {uniform.issuedEntries[0].cadet.lastname}
                        </Link>
                    }
                </Col>
                <Col>
                    <div className="fw-bold">
                        {t('uniformOffcanvas.owner.issuedDate')}:
                    </div>
                    <p>
                        {dayjs(uniform.issuedEntries[0].dateIssued).format('DD.MM.YYYY')}
                    </p>
                </Col>
            </Row>
        </>
    )
}