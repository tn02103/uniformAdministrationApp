import { getCadetData } from "@/actions/cadet/data";
import { getIronSession } from "@/lib/ironSession";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Col, Row } from "react-bootstrap";
import CadetDataTable from "./_cadetDataTable/table";
import MaterialTableContainer from "./_materialTable/container";
import CadetUniformTableContainer from "./_uniformTable/container";
import { useGlobalData } from "@/components/globalDataProvider";
import CadetDropDown from "./cadetDropDown";
import { AuthRole } from "@/lib/AuthRoles";

type PropType = {
    params: {
        cadetId: string;
    };
}
const CadetDetailPage = async (props: PropType) => {
    const { user } = await getIronSession();
    if (!user) return;
    if (props.params.cadetId !== "new") {
        var cadet = await getCadetData(props.params.cadetId).catch(() => undefined);

        if (!cadet) {
            return notFound();
        }
    }

    return (
        <div className="container-xl content-center bg-light rounded pb-xl-3 p-md-4 position-relative">
            {(cadet && user.role >= AuthRole.materialManager) &&
                <div className="position-absolute top-0 end-0">
                    <CadetDropDown firstname={cadet?.firstname} lastname={cadet?.lastname} />
                </div>
            }
            <h1 data-testid="div_pageHeader" className="text-center mb-3">
                {cadet?.firstname} {cadet?.lastname}
            </h1>
            <Row className="justify-content-center">
                <Col xs={12} md={8} lg={7} xl={3} className="pb-3 pe-md-3 p-0">
                    <Suspense>
                        <CadetDataTable initialData={cadet} />
                    </Suspense>
                </Col>
                {(props.params.cadetId !== "new") &&
                    <Col xs={12} md={8} lg={7} xl={4} className="p-0 pb-3">
                        <Suspense>
                            <MaterialTableContainer cadetId={props.params.cadetId} />
                        </Suspense>
                    </Col>
                }
                {(props.params.cadetId !== "new") &&
                    <Col xs={12} className="p-0">
                        <Suspense>
                            <CadetUniformTableContainer cadetId={props.params.cadetId} />
                        </Suspense>
                    </Col>
                }
            </Row>
        </div>
    )
}

export default CadetDetailPage;
