import { getUniformTypeList } from "@/dal/uniform/type/_index";
import { getI18n } from "@/lib/locales/config";
import { Row } from "react-bootstrap";
import UniformSizelistConfigurationWrapper from "./_sizelistComponents/sizelistWrapper";
import { UniformTypeTable } from "./_typeAdministration/UniformTypeTable";


export default async function UniformAdminPage() {
    const t = await getI18n();
    const typeList = await getUniformTypeList();


    return (
        <div className="container-xl content-center bg-light rounded">
            <h1 className="text-center">
                {t('admin.uniform.header')}
            </h1>
            <h2>Uniformtypen</h2>
            <hr />
            <Row>
                <UniformTypeTable initialTypeList={typeList} />
            </Row>
            <h2 className="mt-5">Größenlisten</h2>
            <hr />
            <UniformSizelistConfigurationWrapper />
        </div>
    )
}
