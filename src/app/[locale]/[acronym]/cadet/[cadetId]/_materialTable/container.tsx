import { getCadetMaterialMap } from "@/actions/controllers/CadetMaterialController";
import { getI18n } from "@/lib/locales/config";
import MaterialTable from "./uiTable";
import { getMaterialConfiguration } from "@/dal/material/type/_index";

type PropType = {
    cadetId: string;
}

const MaterialTableContainer = async (props: PropType) => {
    const t = await getI18n();

    const [materialMap, materialConfig] = await Promise.all([
        getCadetMaterialMap(props.cadetId),
        getMaterialConfiguration()
    ])
    return (
        <div className="container border border-2 rounded">
            <div className="row fs-5 fw-bold p-0">
                <div className="col-12 text-center p-0">{t('cadetDetailPage.header.materialTable')}:</div>
            </div>
            <MaterialTable initialData={materialMap} materialConfig={materialConfig} />
        </div>
    )
}

export default MaterialTableContainer;