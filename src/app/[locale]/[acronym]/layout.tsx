import { getInspectionState } from "@/actions/controllers/InspectionController";
import { getUniformTypeList } from "@/actions/controllers/UniformConfigController";
import { getUniformSizelists } from "@/actions/controllers/UniformSizeController";
import GlobalDataProvider from "@/components/globalDataProvider";
import Overlay from "@/components/navigation/Overlay";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import "server-only";

export const dynamic = "force-dynamic";

export async function generateStaticParams(props: any) {
    const assosiations = await prisma.assosiation.findMany();

    return assosiations.map((a) => ({ acronym: a.acronym }))
}

const Layout = async ({
    children,
    modal,
    params
}: {
    children: ReactNode;
    modal: ReactNode;
    params: { locale: string, acronym: string }
}) => {
    const { user } = await getIronSession();
    if (!user) {
        return redirect('/login');

    }
    if (user.acronym !== params.acronym) {
        return redirect('/login');
    }


    const [typeList, assosiation, sizelists, inspectionState] = await Promise.all([
        getUniformTypeList(),
        prisma.assosiation.findUnique({ where: { id: user.assosiation } }),
        getUniformSizelists(),
        getInspectionState(),
    ])

    if (!assosiation) {
        redirect(`/login`);
    }

    return (
        <GlobalDataProvider
            userRole={user.role}
            useBeta={assosiation.useBeta}
            typeList={typeList}
            sizelists={sizelists}
            inspectionState={inspectionState}
        >
            <div>
                {modal}
                <div className="d-flex flex-column overflow-hidden">
                    <Overlay association={assosiation} username={user.name} >
                        {children}
                    </Overlay>
                </div>
            </div>
        </GlobalDataProvider>
    )
}

export default Layout;
