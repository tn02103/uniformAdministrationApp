import { getCadetUniformMap } from "@/actions/cadet/uniform";
import { getUniformTypes } from "@/actions/uniform/type";
import { getIronSession } from "@/lib/ironSession";
import { getScopedI18n } from "@/lib/locales/config";
import CadetUniformTable from "./table";

type PropType = {
    cadetId: string;

}
const CadetUniformTableContainer = async (props: PropType) => {
    const t = await getScopedI18n('cadetDetailPage');
    const { user } = await getIronSession();
    if (!user) {
        return <></>
    }
    const uniformTypesPromise = getUniformTypes();
    const uniformMapPrmose = getCadetUniformMap(props.cadetId);

    const [uniformTypes, uniformMap] = await Promise.all([uniformTypesPromise, uniformMapPrmose]);

    return (
        <div className="container-lg border border-2 rounded mt-4">
            <div className="row fs-5 fw-bold p-0">
                <div className="col-12 text-center p-0">{t('header.uniformTable')}</div>
            </div>
            <div data-testid="div_uniform_typeList">
                <CadetUniformTable
                    uniformMap={uniformMap}
                />
            </div>
        </div>
    );
}

export default CadetUniformTableContainer;
