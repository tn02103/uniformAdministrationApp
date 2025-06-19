import { getUsedSizesByType } from "@/dal/size/getUsedByType";
import { getUniformType } from "@/dal/uniform/type/_index";
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { UniformSize, UniformType } from "@/types/globalUniformTypes";
import { Col, Row } from "react-bootstrap";
import { z } from "zod";
import { UniformListSidePanel } from "./_filterPanel/UniformListSidePanel";
import { UniformListTable } from "./_listPanel/UniformListTable";

export async function generateMetadata({ params }: { params: Promise<{ typeId: string }> }) {
    const { typeId } = await params;

    const t = await getScopedI18n('pageTitles')
    if (z.string().uuid().safeParse(typeId).success) {
        const type = await getUniformType(typeId);
        if (type) {
            return {
                title: t('uniform.list', { type: type.name })
            }
        }
    }
    return {
        title: t('uniform.list.notProvided'),
    }
}

export default async function UniformListPage({
    params
}: {
    params: Promise<{
        typeId: string
    }>
}) {
    const t = await getI18n();
    const { typeId } = await params;

    let uniformType: UniformType | null = null
    if (z.string().uuid().safeParse(typeId).success) {
        uniformType = await getUniformType(typeId);
    }
    let sizeList: UniformSize[] = [];
    if (uniformType) {
        sizeList = await getUsedSizesByType(uniformType.id);
    }

    return (
        <div className="container-xl bg-light rounded mt-4">
            <Row className="row pt-2 pb-2">
                <h1 data-testid={"div_pageHeader"} className="text-center">{t('uniformList.header')}: {uniformType?.name}</h1>
            </Row>
            <Row className="row ps-md-4 pe-md-4">
                <Col xs={12} className="col-xl-2 bg-white rounded border border-2 ms-0 ms-xl-4 h-auto">
                    <UniformListSidePanel uniformType={uniformType!} sizeList={sizeList} />
                </Col>
                <Col xs={12} className="col-xl-9 bg-white border rounded border-3 ms-xl-5 p-0">
                    <UniformListTable uniformType={uniformType} />
                </Col>
            </Row>
        </div>
    )
}
