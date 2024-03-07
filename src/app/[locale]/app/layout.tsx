import { getUniformSizeLists } from "@/actions/uniform/sizeLists";
import { getUniformTypeConfiguration } from "@/actions/uniform/type";
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

    const [uniformConfiguration, assosiation, sizeLists] = await Promise.all([
        await getUniformTypeConfiguration(),
        await prisma.assosiation.findUniqueOrThrow({ where: { id: user.assosiation } }),
        await getUniformSizeLists(),
    ])

    return (
        <GlobalDataProvider
            userRole={user.role}
            useBeta={assosiation.useBeta}
            uniformTypeConfiguration={uniformConfiguration}
            sizeLists={sizeLists}
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
