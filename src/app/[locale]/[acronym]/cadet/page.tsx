import { getPersonnelListData } from "@/actions/controllers/CadetController";
import { getI18n } from "@/lib/locales/config";
import GeneralOverviewTable from "./table";

const CadetListPage = async ({ searchParams }: any) => {
    const t = await getI18n();
    const data = await getPersonnelListData({
        orderBy: searchParams.orderBy === "firstname" ? "firstname" : "lastname",
        asc: searchParams.asc ? searchParams.asc === "true" ? true : false : true,
        include: {
            deregistered: !!searchParams.deregistered,
            inspected: !!searchParams.inspected,
        }
    });

    return (
        <div className="container-lg content-center bg-light rounded px-md-3 px-xl-5 p-0">
            <div className="row pt-2 pb-2 m-0">
                <h1 data-testid="div_cadetListHeader" className="text-center">{t('generalOverview.header')}</h1>
            </div>
            <GeneralOverviewTable data={data} />
        </div>
    )
}

export default CadetListPage;
