import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locales/config";
import { uniformSizeArgs, uniformTypeArgs } from "@/types/globalUniformTypes";
import { Col, Row } from "react-bootstrap";
import FilterPanel from "./_filterPanel";
import ListPanel from "./_listPanel";


export default async function UniformListPage({ params: { typeId } }: any) {
    const t = await getI18n();

    const uniformType = await prisma.uniformType.findUnique({
        where: { id: typeId },
        ...uniformTypeArgs
    });
    const sizeList = await prisma.uniformSize.findMany({
        ...uniformSizeArgs,
        where: {
            uniformList: {
                some: {
                    fk_uniformType: typeId,
                    recdelete: null,
                }
            }
        },
        orderBy: { sortOrder: "asc" }
    })

    return (
        <div className="container-xl bg-light rounded mt-4">
            <Row className="row pt-2 pb-2">
                <h1 data-testid={"div_pageHeader"} className="text-center">{t('uniformList.header')}: {uniformType?.name}</h1>
            </Row>
            <Row className="row ps-md-4 pe-md-4">
                <Col xs={12} className="col-xl-2 bg-white rounded border border-2 ms-0 ms-xl-4 h-auto">
                    <FilterPanel uniformType={uniformType!} sizeList={sizeList} />
                </Col>
                <Col xs={12} className="col-xl-9 bg-white border rounded border-3 ms-xl-5 p-0">
                    <ListPanel uniformType={uniformType} />
                </Col>
            </Row>
        </div>
    )
}
