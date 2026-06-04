import { getClosedInspectionReport } from "@/dal/inspection/closed/getReport";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { runServerActionTest } from "../../_helper/testHelper";
import { InspectionReview } from "@/types/deficiencyTypes";

const staticData = new StaticData(0);
const otherOrg = new StaticData(1);

afterEach(() => staticData.cleanup.inspection());

describe('getClosedInspectionReport', () => {
    it('returns a live InspectionReview for a valid closed inspection', async () => {
        const { success, result } = await runServerActionTest(
            getClosedInspectionReport({ inspectionId: staticData.ids.inspectionIds[0] })
        );
        expect(success).toBeTruthy();
        const report = result as InspectionReview;
        expect(report.id).toBe(staticData.ids.inspectionIds[0]);
        expect(report.name).toBeDefined();
        expect(report.date).toBeDefined();
        expect(Array.isArray(report.cadetList)).toBe(true);
        expect(Array.isArray(report.activeDeficiencyList)).toBe(true);
    });

    it('throws Unauthorized when inspectionId belongs to a different org', async () => {
        const { success, result } = await runServerActionTest(
            getClosedInspectionReport({ inspectionId: otherOrg.ids.inspectionIds[0] })
        );
        expect(success).toBeFalsy();
        expect(result).toBeDefined();
    });

    it('returns attendanceStatus as missing for a cadet inspected in a prior inspection but not the current one', async () => {
        // cadet[2] was inspected in inspection[0] (2023-06-18) but NOT inspection[1] (2023-08-13).
        // Bug: the old query used lci.id IS NOT NULL, which marked cadet[2] as 'inspected' for
        // inspection[1] because they had a cadet_inspection record from a different inspection.
        // Fix: the query now uses lci.id = inspectionId so only cadets inspected in THIS inspection
        // are marked as 'inspected'.
        const { success, result } = await runServerActionTest(
            getClosedInspectionReport({ inspectionId: staticData.ids.inspectionIds[1] })
        );
        expect(success).toBeTruthy();
        const report = result as InspectionReview;
        const cadet2Entry = report.cadetList.find(e => e.cadet.id === staticData.ids.cadetIds[2]);
        expect(cadet2Entry).toBeDefined();
        expect(cadet2Entry!.attendanceStatus).toBe('missing');
    });

    it('excludes cadets that were already RETURNING before inspection start from cadetList', async () => {
        const returnStartedBeforeInspection = new Date('2023-08-13T07:00:00.000Z');
        await prisma.cadet.update({
            where: { id: staticData.ids.cadetIds[10] },
            data: {
                status: 'RETURNING',
                returnStartedAt: returnStartedBeforeInspection,
                returnEndedAt: null,
                deletedAt: null,
            },
        });

        const { success, result } = await runServerActionTest(
            getClosedInspectionReport({ inspectionId: staticData.ids.inspectionIds[1] })
        );

        expect(success).toBeTruthy();
        const report = result as InspectionReview;
        const entry = report.cadetList.find((e) => e.cadet.id === staticData.ids.cadetIds[10]);
        expect(entry).toBeUndefined();
    });

    it('activeCadets counts only cadets active at inspection end', async () => {
        const beforeEnd = new Date('2023-08-13T12:00:00.000Z');

        await prisma.cadet.update({
            where: { id: staticData.ids.cadetIds[11] },
            data: {
                status: 'RETURNED',
                returnStartedAt: new Date('2023-08-13T10:00:00.000Z'),
                returnEndedAt: beforeEnd,
                deletedAt: null,
            },
        });

        const { success, result } = await runServerActionTest(
            getClosedInspectionReport({ inspectionId: staticData.ids.inspectionIds[1] })
        );

        expect(success).toBeTruthy();
        const report = result as InspectionReview;
        expect(report.activeCadets).toBe(9);
    });
});
