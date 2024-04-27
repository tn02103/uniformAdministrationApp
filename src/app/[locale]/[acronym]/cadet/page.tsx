import { getPersonnelListData } from "@/actions/controllers/CadetController";
import { getI18n } from "@/lib/locales/config";
import { setStaticParamsLocale } from "next-international/server";
import Head from "next/head";
import GeneralOverviewTable from "./table";

const CadetListPage = async ({ params, searchParams }: any) => {
    setStaticParamsLocale(params.locale);
    const t = await getI18n();
    const orderBy = searchParams.orderBy === "firstname" ? "firstname" : "lastname";
    const asc = searchParams.asc ? searchParams.asc === "true" ? true : false : true;

    return (
        <div className="container-lg content-center bg-light rounded px-md-3 px-xl-5 p-0">
            <Head>
                <title>{t('generalOverview.header')}</title>
            </Head>
            <div className="row pt-2 pb-2 m-0">
                <h1 data-testid="div_cadetListHeader" className="text-center">{t('generalOverview.header')}</h1>
            </div>
            <GeneralOverviewTable data={await getPersonnelListData(orderBy, asc)} />

        </div>
    )
}

export default CadetListPage;
