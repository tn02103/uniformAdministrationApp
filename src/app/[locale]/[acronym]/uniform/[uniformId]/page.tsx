import { prisma } from "@/lib/db";
import { uniformArgs, uniformTypeArgs } from "@/types/globalUniformTypes";
import { notFound } from "next/navigation";
import { Col, Row } from "react-bootstrap";
import UniformDetailUIBorder, { IssuedEntryType } from "./uiBorder";

export const dynamic = "force-dynamic";

export default async function UniformDetailPage({ params: { uniformId } }: { params: { uniformId: string } }) {
    const [uniformData, uniformHistory, uniformType] = await Promise.all([
        prisma.uniform.findUnique({
            where: { id: uniformId },
            ...uniformArgs,
        }),
        prisma.uniformIssued.findMany({
            where: {
                fk_uniform: uniformId,
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
                uniformList: { some: { id: uniformId } },
                recdelete: null
            },
            ...uniformTypeArgs
        }),
    ]);

    if (!uniformData) {
        return notFound();
    }
    return (
        <Row className="justify-content-center">
            <Col xs={12} lg={8}>
                <div className="container bg-light rounded mt-4">
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
                </div>
            </Col>
        </Row>
    )
}