import { genericSANoDataValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { ClosedInspectionSummary, InspectionReview } from "@/types/deficiencyTypes";

export const getClosedInspectionList = (): Promise<ClosedInspectionSummary[]> =>
    genericSANoDataValidator(AuthRole.materialManager)
        .then(async ([user]) => {
            const inspections = await prisma.inspection.findMany({
                where: {
                    fk_assosiation: user.assosiation,
                    timeEnd: { not: null },
                },
                select: {
                    id: true,
                    name: true,
                    date: true,
                    timeStart: true,
                    timeEnd: true,
                    closingReport: true,
                },
                orderBy: { date: 'desc' },
            });

            return inspections.map((insp): ClosedInspectionSummary => {
                const hasReport = insp.closingReport !== null;
                if (!hasReport) {
                    return {
                        id: insp.id,
                        name: insp.name,
                        date: insp.date,
                        timeStart: insp.timeStart!,
                        timeEnd: insp.timeEnd!,
                        activeCadets: 0,
                        cadetsInspected: 0,
                        deregisteredCadets: 0,
                        missingCadets: 0,
                        uniformCompletePercent: NaN,
                        hasReport: false,
                    };
                }

                const report = insp.closingReport as unknown as InspectionReview;
                const cadetList = report.cadetList;
                const activeCadets = cadetList.length;
                const cadetsInspected = cadetList.filter(c => c.attendanceStatus === 'inspected').length;
                const deregisteredCadets = cadetList.filter(c => c.attendanceStatus === 'excused').length;
                const missingCadets = activeCadets - cadetsInspected - deregisteredCadets;
                const uniformCompletePercent = cadetsInspected > 0
                    ? Math.round(
                        cadetList.filter(c => c.attendanceStatus === 'inspected' && c.lastInspection?.uniformComplete === true).length
                        / cadetsInspected * 1000
                    ) / 10
                    : NaN;

                return {
                    id: insp.id,
                    name: insp.name,
                    date: insp.date,
                    timeStart: insp.timeStart!,
                    timeEnd: insp.timeEnd!,
                    activeCadets,
                    cadetsInspected,
                    deregisteredCadets,
                    missingCadets,
                    uniformCompletePercent,
                    hasReport: true,
                };
            });
        });
