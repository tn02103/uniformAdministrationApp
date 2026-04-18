import { getClosedInspectionReport } from "@/dal/inspection/closed/getReport";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { runServerActionTest } from "../../_helper/testHelper";
import { ExceptionType } from "@/errors/CustomException";
import { InspectionReview } from "@/types/deficiencyTypes";

const staticData = new StaticData(0);
const otherOrg = new StaticData(1);

afterEach(() => staticData.cleanup.inspection());

const mockReport: InspectionReview = {
    id: staticData.ids.inspectionIds[0],
    name: 'Quartal 1',
    date: '2023-06-18',
    timeStart: '07:58',
    timeEnd: '13:06',
    activeCadets: 2,
    cadetsInspected: 2,
    deregisteredCadets: 0,
    newDeficiencies: 1,
    activeDeficiencies: 3,
    resolvedDeficiencies: 0,
    cadetList: [
        {
            cadet: { id: 'c1', firstname: 'A', lastname: 'B' },
            lastInspection: { id: 'i1', date: '2023-06-18', uniformComplete: true },
            activeDeficiencyCount: 1,
            newlyClosedDeficiencyCount: 0,
            overalClosedDeficiencyCount: 0,
            attendanceStatus: 'inspected',
        },
    ],
    activeDeficiencyList: [],
};

describe('getClosedInspectionReport', () => {
    it('returns closingReport JSON cast as InspectionReview', async () => {
        await prisma.inspection.update({
            where: { id: staticData.ids.inspectionIds[0] },
            data: { closingReport: mockReport as object },
        });

        const { success, result } = await runServerActionTest(
            getClosedInspectionReport({ inspectionId: staticData.ids.inspectionIds[0] })
        );
        expect(success).toBeTruthy();
        const report = result as InspectionReview;
        expect(report.name).toBe('Quartal 1');
        expect(report.cadetList).toHaveLength(1);
        expect(report.cadetList[0].attendanceStatus).toBe('inspected');
    });

    it('throws SaveDataException when closingReport is null', async () => {
        const { success, result } = await runServerActionTest(
            getClosedInspectionReport({ inspectionId: staticData.ids.inspectionIds[0] })
        );
        expect(success).toBeFalsy();
        expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    });

    it('throws Unauthorized when inspectionId belongs to a different org', async () => {
        const { success, result } = await runServerActionTest(
            getClosedInspectionReport({ inspectionId: otherOrg.ids.inspectionIds[0] })
        );
        expect(success).toBeFalsy();
        expect(result).toBeDefined();
    });
});
