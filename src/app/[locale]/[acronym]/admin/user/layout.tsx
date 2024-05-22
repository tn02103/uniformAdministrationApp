import { AuthRole } from "@/lib/AuthRoles";
import { getIronSession } from "@/lib/ironSession";

export default async function Layout({
    children
}: {
    children: React.ReactNode;
}) {

    const { user } = await getIronSession();
    if (!user || user.role < AuthRole.admin) {
        // TODO Created Not Authorized 
        return (
            // TODO rewrite to 403 Page
            <div data-testid="div_403Page">
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