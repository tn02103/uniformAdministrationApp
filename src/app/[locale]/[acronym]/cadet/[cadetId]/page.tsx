import { getCadetData } from "@/actions/cadet/data";
import { getCadetMaterialMap } from "@/actions/controllers/CadetMaterialController";
import { getCadetUniformMap } from "@/dal/cadet/uniformMap";
import { getMaterialConfiguration } from "@/dal/material/type/_index";
import { AuthRole } from "@/lib/AuthRoles";
import { getIronSession } from "@/lib/ironSession";
import { getScopedI18n } from "@/lib/locales/config";
import { notFound } from "next/navigation";
import { Col, Row } from "react-bootstrap";
import CadetDataTable from "./_cadetDataTable/table";
import CadetInspectionCard from "./_inspctionTable/card";
import { CadetMaterialTable } from "./_materialTable/CadetMaterialTable";
import { CadetUniformTable } from "./_uniformTable/CadetUniformTable";
import CadetDropDown from "./cadetDropDown";

export async function generateMetadata({ params }: { params: Promise<ParamType> }) {
    const { cadetId } = await params;
    const t = await getScopedI18n('pageTitles');
    if (cadetId === "new") {
        return {
            title: t('cadet.new')
        }
    }
    const cadet = await getCadetData(cadetId).catch(() => null);
    if (cadet) {
        return {
            title: t('cadet.person', { firstname: cadet.firstname, lastname: cadet.lastname }),
        }
    }
}

type PropType = {
    params: Promise<ParamType>;
}
export type ParamType = {
    cadetId: string;
    locale: string;
}

const CadetDetailPage = async (props: PropType) => {
    const { cadetId } = await props.params;
    const newCadet = cadetId === "new";
    const { user } = await getIronSession();

    if (newCadet) {
        return (
            <div className="container-sm content-center bg-light rounded pb-xl-3 p-md-4">
                <Row className="justify-content-center mt-3">
                    <Col xs={12} md={8} lg={7} xl={3} className="pb-3 pe-md-3 p-0">
                        <CadetDataTable />
                    </Col>
                </Row>
            </div>
        );
    }

    const [cadet, uniformMap, materialMap, materialConfig] = await Promise.all([
        getCadetData(cadetId),
        getCadetUniformMap(cadetId),
        getCadetMaterialMap(cadetId),
        getMaterialConfiguration(),
    ]);
    if (!cadet) {
        return notFound();
    }

    return (
        <div className="container-xl content-center bg-light rounded pb-xl-3 p-md-4">
            <Row className="position-relative">
                {(user!.role >= AuthRole.inspector) &&
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
                {(user!.role >= AuthRole.inspector) &&
                    <Col xs={12} md={8} lg={7} xl={5} className="pb-3 pe-md-3 p-0">
                        <CadetInspectionCard />
                    </Col>
                }
                <Col xs={12} md={8} lg={7} xl={4} className="p-0 pb-3">
                    <CadetMaterialTable materialConfig={materialConfig} initialData={materialMap} />
                </Col>
                <Col xs={12} className="p-0">
                    <CadetUniformTable uniformMap={uniformMap} />
                </Col>
            </Row>
        </div>
    )
}

export default CadetDetailPage;
