import { getUsedSizesByType } from "@/dal/size/getUsedByType";
import { getUniformType } from "@/dal/uniform/type/getter";
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { UniformSize, UniformType } from "@/types/globalUniformTypes";
import { Col, Row } from "react-bootstrap";
import { z } from "zod";
import FilterPanel from "./_filterPanel";
import ListPanel from "./_listPanel";
import Title from "@/components/Title";

export async function generateMetadata({ params }: { params: { typeId: string } }) {
    const t = await getScopedI18n('pageTitles')
    if (z.string().uuid().safeParse(params.typeId).success) {
        const type = await getUniformType(params.typeId);
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
    params: { typeId }
}: {
    params: {
        typeId: string
    }
}) {
    const t = await getI18n();

    let uniformType: UniformType | null = null
    if (z.string().uuid().safeParse(typeId).success) {
        uniformType = await getUniformType(typeId);
    }
    let sizeList: UniformSize[] = [];
    if (uniformType) {
        sizeList = await getUsedSizesByType(uniformType.id);
    }

    return (
        <div className="container-xl rounded">
            <Row className="row pb-2">
                <Title text={`${t('uniformList.header')} ${uniformType?.name || ""}`} />
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
