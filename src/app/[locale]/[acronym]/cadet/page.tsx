
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import GeneralOverviewTable from "./table";
import { getPersonnelListOverviewData } from "@/dal/cadet/getPersonnelListOverviewData";
import Title from "@/components/Title";

export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles')
    return {
        title: t('personnel'),
    }
}
const CadetListPage = async ({ searchParams }: any) => {
    const t = await getI18n();
    const data = await getPersonnelListOverviewData({
        orderBy: searchParams.orderBy === "firstname" ? "firstname" : "lastname",
        asc: searchParams.asc ? searchParams.asc === "true" ? true : false : true,
        include: {
            deregistered: !!searchParams.deregistered,
            inspected: !!searchParams.inspected,
        }
    });

    return (
        <div className="container-lg content-center rounded px-md-3 px-xl-5 p-0">
            <Title text={t('generalOverview.header')} />
            <div className="pt-3">
                <GeneralOverviewTable data={data} />
            </div>
        </div>
    )
}

export default CadetListPage;
