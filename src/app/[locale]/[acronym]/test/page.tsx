import { prisma } from "@/lib/db";
import TestAutocompleteImplementation from "./TestAutocompleteImplementation";
import { getIronSession } from "@/lib/ironSession";


export default async function TestPage() {
    const { user } = await getIronSession();
    if (!user) return (<div></div>)
    const options = await prisma.uniform.findMany({
        where: {
            type: {
                fk_assosiation: user.assosiation,
            },
        },
        include: {
            type: true,
        },
    }).then((uniforms) => uniforms.map((uniform) => ({
        value: uniform.id,
        label: `${uniform.type.name}-${uniform.number}`,
    })));

    return (
        <div>
            <h1>Test Page</h1>
            <TestAutocompleteImplementation options={options} />
        </div>
    );
}