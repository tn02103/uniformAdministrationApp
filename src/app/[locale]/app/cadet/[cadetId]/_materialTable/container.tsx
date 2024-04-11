import { getMaterialConfiguration } from "@/actions/material";
import { getI18n } from "@/lib/locales/config";
import MaterialTable from "./uiTable";
import { getCadetMaterialMap } from "@/actions/controllers/CadetMaterialController";

type PropType = {
    cadetId: string;
}

const MaterialTableContainer = async (props: PropType) => {
    const x = new Date().getTime();
    console.log("MaterialTable start", x);
    const t = await getI18n();

    const [materialMap, materialConfig] = await Promise.all([
        getCadetMaterialMap(props.cadetId),
        getMaterialConfiguration()
    ])
    const y = new Date().getTime();
    console.log("MaterialTable end", y, y - x);
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