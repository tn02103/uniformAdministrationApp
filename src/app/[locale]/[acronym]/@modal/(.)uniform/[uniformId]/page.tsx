import { prisma } from "@/lib/db";
import { uniformArgs, uniformTypeArgs } from "@/types/globalUniformTypes";
import { notFound } from "next/navigation";
import UniformDetailUIBorder, { IssuedEntryType } from "../../../uniform/[uniformId]/uiBorder";
import PageInterceptionModal from "./modal";

export const dynamic = "force-dynamic";

export default async function UniformModal({ params }: { params: { uniformId: string } }) {
    const [uniformData, uniformHistory, uniformType] = await Promise.all([
        prisma.uniform.findUnique({
            where: { id: params.uniformId },
            ...uniformArgs,
        }),
        prisma.uniformIssued.findMany({
            where: {
                fk_uniform: params.uniformId,
            },
            include: {
                cadet: true,
            },
            orderBy: { dateIssued: "desc" }
        }).then((data) => data.map((issueEntry): IssuedEntryType => ({
            dateIssued: issueEntry.dateIssued,
            dateReturned: issueEntry.dateReturned,
            cadetDeleted: !!issueEntry.cadet.recdelete,
            firstname: issueEntry.cadet.firstname,
            lastname: issueEntry.cadet.lastname,
            cadetId: issueEntry.cadet.id,
        }))),
        prisma.uniformType.findMany({
            where: {
                uniformList: { some: { id: params.uniformId } },
                recdelete: null
            },
            ...uniformTypeArgs
        }),
    ]);

    if (!uniformData) {
        return notFound();
    }

    return (
        <PageInterceptionModal>
            <UniformDetailUIBorder
                uniform={{
                    id: uniformData.id,
                    number: uniformData.number,
                    generation: uniformData.generation?.id,
                    size: uniformData.size?.id,
                    comment: uniformData.comment ?? "",
                    active: uniformData.active,
                }}
                uniformHistory={uniformHistory}
                uniformType={uniformType[0]!} />
        </PageInterceptionModal>
    )
}