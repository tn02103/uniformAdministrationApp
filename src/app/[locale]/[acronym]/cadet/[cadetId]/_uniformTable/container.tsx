import { getIronSession } from "@/lib/ironSession";
import { getScopedI18n } from "@/lib/locales/config";
import CadetUniformTable from "./table";
import { getCadetUniformMap } from "@/actions/controllers/CadetUniformController";

type PropType = {
    cadetId: string;

}
const CadetUniformTableContainer = async (props: PropType) => {
    const x = new Date().getTime();
    console.log("UniformTable start", x);
    const t = await getScopedI18n('cadetDetailPage');
    const { user } = await getIronSession();
    if (!user) {
        return <></>
    }

    const uniformMapPrmose = getCadetUniformMap(props.cadetId);

    const [uniformMap] = await Promise.all([uniformMapPrmose]);

    const y = new Date().getTime();
    console.log("UniformTable end", y, y - x);

    return (
        <div className="container-lg border border-2 rounded mt-4 p-0">
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
