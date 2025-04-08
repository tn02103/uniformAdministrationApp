import { getUniformTypeList } from "@/dal/uniform/type/_index";
import { getI18n } from "@/lib/locales/config";
import { UniformTypeTable } from "./_typeAdministration/UniformTypeTable";


export default async function UniformAdminPage() {
    const t = await getI18n();

    const typeList = await getUniformTypeList();

    return (
        <div className="container-xl content-center bg-light rounded">
            <h1 className="text-center">
                {t('admin.uniform.header')}
            </h1>
            <UniformTypeTable initialTypeList={typeList} />
        </div>
    )
}
