import { getI18n, getScopedI18n } from "@/lib/locales/config";

const UniformTableLoadingState = async () => {
    const t = await getI18n();
    return (
        <div className="container-lg border border-2 rounded mt-4">
            <div className="row fs-5 fw-bold p-0">
                <div className="col-12 text-center p-0">{t('cadetDetailPage.header.uniformTable')}</div>
            </div>
            {t('common.loading')}...
        </div>
    )
}

export default UniformTableLoadingState;
