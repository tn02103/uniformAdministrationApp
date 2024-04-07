import { getCadetData } from "@/actions/cadet/data";
import { AuthRole } from "@/lib/AuthRoles";
import { getIronSession } from "@/lib/ironSession";
import { notFound } from "next/navigation";
import { Col, Row } from "react-bootstrap";
import CadetDataTable from "./_cadetDataTable/table";
import MaterialTableContainer from "./_materialTable/container";
import CadetUniformTableContainer from "./_uniformTable/container";
import CadetDropDown from "./cadetDropDown";
import CadetInspectionCard from "./_inspctionTable/card";

type PropType = {
    params: {
        cadetId: string;
        locale: string;
    };
}
/*export const generateStaticParams = async ({ params: { locale } }: { params: { locale: string } }) => {
    return await prisma.cadet.findMany({ select: { id: true }, where: { recdelete: null } })
        .then((data) => data.map(c => ({ cadetId: c.id })));
}*/

const CadetDetailPage = async (props: PropType) => {
    const x = new Date().getTime()
    console.log("Page start", x);

    const { user } = await getIronSession();
    if (props.params.cadetId !== "new") {
        var cadet = await getCadetData(props.params.cadetId).catch(() => undefined);

        if (!cadet) {
            return notFound();
        }
    }

    const y = new Date().getTime();
    console.log("Page end", y, y - x);
    return (
        <div className="container-xl content-center bg-light rounded pb-xl-3 p-md-4">
            <Row className="position-relative">
                {(cadet && user!.role >= AuthRole.materialManager) &&
                    <div className="position-absolute w-auto top-0 end-0">
                        <CadetDropDown firstname={cadet.firstname} lastname={cadet.lastname} />
                    </div>
                }
                <h1 data-testid="div_pageHeader" className="text-center mb-3">
                    {cadet?.firstname} {cadet?.lastname}
                </h1>
            </Row>
            <Row className="justify-content-center">
                <Col xs={12} md={8} lg={7} xl={3} className="pb-3 pe-md-3 p-0">
                    <CadetDataTable initialData={cadet} />
                </Col>
                <Col xs={12} md={8} lg={7} xl={5} className="pb-3 pe-md-3 p-0">
                    <CadetInspectionCard />
                </Col>
                {(props.params.cadetId !== "new") &&
                    <Col xs={12} md={8} lg={7} xl={4} className="p-0 pb-3">
                        <MaterialTableContainer cadetId={props.params.cadetId} />
                    </Col>
                }
                {(props.params.cadetId !== "new") &&
                    <Col xs={12} className="p-0">
                        <CadetUniformTableContainer cadetId={props.params.cadetId} />
                    </Col>
                }
            </Row>
        </div>
    )
}

export default CadetDetailPage;
