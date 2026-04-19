import { genericSAValidator } from "@/actions/validations";
import { getReportForDownload } from "@/dal/inspection/closed/getReportForDownload";
import { AuthRole } from "@/lib/AuthRoles";
import { generateInspectionReviewXLSX } from "@/lib/fileCreations/inspectionReview";
import { z } from "zod";

const propSchema = z.object({ id: z.string().uuid() });

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    let user: Awaited<ReturnType<typeof genericSAValidator>>[0];
    try {
        [user] = await genericSAValidator(
            AuthRole.materialManager,
            { id },
            propSchema,
            { inspectionId: id },
        );
    } catch (e: unknown) {
        const isRedirect =
            e != null &&
            typeof e === "object" &&
            "digest" in e &&
            typeof (e as { digest: unknown }).digest === "string" &&
            (e as { digest: string }).digest.startsWith("NEXT_REDIRECT");
        if (isRedirect) {
            return new Response("Unauthorized", { status: 401 });
        }
        return new Response("Forbidden", { status: 403 });
    }

    const inspection = await getReportForDownload(id, user.assosiation);

    if (!inspection) {
        return new Response("Not Found", { status: 404 });
    }

    const workbook = generateInspectionReviewXLSX(inspection);
    const buffer = await workbook.xlsx.writeBuffer();

    // Sanitise filename to prevent response-header injection
    const safeName = inspection.name.replace(/["\r\n]/g, "");
    const safeDate = inspection.date.replace(/["\r\n]/g, "");

    return new Response(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${safeName}-${safeDate}.xlsx"`,
        },
    });
}
