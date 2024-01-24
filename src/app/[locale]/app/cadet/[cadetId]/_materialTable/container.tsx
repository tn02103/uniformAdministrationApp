import { getcadetMaterialMap } from "@/actions/cadet/material";
import { getMaterialConfiguration } from "@/actions/material";
import { getI18n } from "@/lib/locales/config";
import MaterialTable from "./uiTable";

type PropType = {
    cadetId: string;
}

const MaterialTableContainer = async (props: PropType) => {
    const t = await getI18n();

    const [materialMap, materialConfig] = await Promise.all([
        getcadetMaterialMap(props.cadetId),
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