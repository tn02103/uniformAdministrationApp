import { getUniformTypeList } from "@/actions/controllers/UniformConfigController";
import { getInspectionState } from "@/actions/inspection/status";
import { getUniformSizeLists } from "@/actions/uniform/sizeLists";
import GlobalDataProvider from "@/components/globalDataProvider";
import Sidebar from "@/components/navigation/Sidebar";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { redirect } from "next/navigation";
import "server-only";

export const dynamic = "force-dynamic";
const Layout = async ({ children, modal }: any) => {
    const { user } = await getIronSession();
    if (!user) {
        return redirect('/login');
    }

    const [typeList, assosiation, sizeLists, inspectionState] = await Promise.all([
        getUniformTypeList(),
        prisma.assosiation.findUniqueOrThrow({ where: { id: user.assosiation } }),
        getUniformSizeLists(),
        getInspectionState(),
    ])

    return (
        <GlobalDataProvider
            userRole={user.role}
            useBeta={assosiation.useBeta}
            typeList={typeList}
            sizeLists={sizeLists}
            inspectionState={inspectionState}
        >
            <div>
                {modal}
                <div className="container-fluid p-0 m-0 p-md-auto">
                    <Sidebar assosiation={assosiation} username={user.name} >
                        {children}
                    </Sidebar>
                </div>
            </div>
        </GlobalDataProvider>
    )
}

export default Layout;
