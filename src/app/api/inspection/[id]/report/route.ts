import { getReportForDownload } from "@/dal/inspection/closed/getReportForDownload";
import { generateInspectionReviewXLSX } from "@/lib/fileCreations/inspectionReview";
import { getIronSession } from "@/lib/ironSession";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getIronSession();
    if (!session.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const inspection = await getReportForDownload(id, session.user.assosiation);

    if (!inspection) {
        return new Response("Forbidden", { status: 403 });
    }

    const workbook = generateInspectionReviewXLSX(inspection.closingReport);
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
