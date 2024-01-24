import "server-only";
import { getUniformTypeConfiguration } from "@/actions/uniform/type";
import GlobalDataProvider from "@/components/globalDataProvider";
import Sidebar from "@/components/navigation/Sidebar";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { redirect } from "next/navigation";

const Layout = async ({ children }: any) => {
    const { user } = await getIronSession();
    if (!user) {
        return redirect('/login');
    }

    const [uniformConfiguration, assosiation] = await Promise.all([
        await getUniformTypeConfiguration(),
        await prisma.assosiation.findUniqueOrThrow({ where: { id: user.assosiation } }),
    ])

    return (
        <GlobalDataProvider
            userRole={AuthRole.admin}
            useBeta={assosiation.useBeta}
            uniformTypeConfiguration={uniformConfiguration}
        >
            <div>
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
