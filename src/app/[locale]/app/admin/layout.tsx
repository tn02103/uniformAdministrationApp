import { AuthRole } from "@/lib/AuthRoles";
import { getIronSession } from "@/lib/ironSession";

export default async function Layout({
    children
}: {
    children: React.ReactNode;
}) {

    const { user } = await getIronSession();
    if (!user || user.role < AuthRole.materialManager) {
        // TODO Created Not Authorized 
        return (
            <div>
                403 Not Authorized
            </div>
        )
    }

    return (
        <div>
            {children}
        </div>
    )
}