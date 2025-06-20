import "server-only";

import { getUniformSizelists } from "@/actions/controllers/UniformSizeController";
import GlobalDataProvider from "@/components/globalDataProvider";
import Sidebar from "@/components/navigation/Sidebar";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AuthRole } from "@/lib/AuthRoles";
import { getInspectionState } from "@/dal/inspection/state";
import { getUniformTypeList } from "@/dal/uniform/type/_index";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
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
    params: Promise<{ acronym: string }>
}) => {
    const { acronym } = await params;
    const { user } = await getIronSession();
    
    if (!user) {
        return redirect('/login');

    }
    if (user.acronym !== acronym) {
        return redirect('/login');
    }


    const [typeList, assosiation, sizelists, inspectionState] = await Promise.all([
        getUniformTypeList(),
        prisma.assosiation.findUnique({ where: { id: user.assosiation } }),
        getUniformSizelists(),
        (user.role > AuthRole.user) ? getInspectionState() : null,
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
                <div className="container-fluid p-0 m-0 p-md-auto">
                    <Sidebar assosiation={assosiation} username={user.name}>
                        {children}
                    </Sidebar>
                </div>
            </div>
        </GlobalDataProvider>
    )
}

export default Layout;
