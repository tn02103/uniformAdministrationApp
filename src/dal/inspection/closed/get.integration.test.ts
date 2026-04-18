import { getClosedInspectionList } from "@/dal/inspection/closed/get";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { runServerActionTest } from "../../_helper/testHelper";
import { InspectionReview } from "@/types/deficiencyTypes";

const staticData = new StaticData(0);
const otherOrg = new StaticData(1);

afterEach(() => staticData.cleanup.inspection());

describe('getClosedInspectionList', () => {
    it('returns only closed inspections (timeEnd not null), ordered by date DESC', async () => {
        const { success, result } = await runServerActionTest(getClosedInspectionList());
        expect(success).toBeTruthy();
        expect(result).toBeInstanceOf(Array);

        const ids = (result as { id: string }[]).map(r => r.id);
        expect(ids).toContain(staticData.ids.inspectionIds[0]);
        expect(ids).toContain(staticData.ids.inspectionIds[1]);
        // inspections without timeEnd must not be returned
        expect(ids).not.toContain(staticData.ids.inspectionIds[2]);
        expect(ids).not.toContain(staticData.ids.inspectionIds[3]);
        expect(ids).not.toContain(staticData.ids.inspectionIds[4]);

        // ordered by date DESC: inspectionIds[1] (2023-08-13) before inspectionIds[0] (2023-06-18)
        expect(ids.indexOf(staticData.ids.inspectionIds[1])).toBeLessThan(
            ids.indexOf(staticData.ids.inspectionIds[0])
        );
    });

    it('hasReport=false when closingReport is null', async () => {
        const { success, result } = await runServerActionTest(getClosedInspectionList());
        expect(success).toBeTruthy();
        const list = result as { id: string; hasReport: boolean }[];
        const insp = list.find(r => r.id === staticData.ids.inspectionIds[0]);
        expect(insp).toBeDefined();
        expect(insp!.hasReport).toBe(false);
    });

    it('hasReport=true and stats derived from closingReport when set', async () => {
        const mockReport: InspectionReview = {
            id: staticData.ids.inspectionIds[0],
            name: 'Quartal 1',
            date: '2023-06-18',
            timeStart: '07:58',
            timeEnd: '13:06',
            activeCadets: 3,
            cadetsInspected: 2,
            deregisteredCadets: 1,
            newDeficiencies: 0,
            activeDeficiencies: 0,
            resolvedDeficiencies: 0,
            cadetList: [
                {
                    cadet: { id: 'c1', firstname: 'A', lastname: 'B' },
                    lastInspection: { id: 'i1', date: '2023-06-18', uniformComplete: true },
                    activeDeficiencyCount: 0,
                    newlyClosedDeficiencyCount: 0,
                    overalClosedDeficiencyCount: 0,
                    attendanceStatus: 'inspected',
                },
                {
                    cadet: { id: 'c2', firstname: 'C', lastname: 'D' },
                    lastInspection: { id: 'i1', date: '2023-06-18', uniformComplete: false },
                    activeDeficiencyCount: 0,
                    newlyClosedDeficiencyCount: 0,
                    overalClosedDeficiencyCount: 0,
                    attendanceStatus: 'inspected',
                },
                {
                    cadet: { id: 'c3', firstname: 'E', lastname: 'F' },
                    lastInspection: undefined,
                    activeDeficiencyCount: 0,
                    newlyClosedDeficiencyCount: 0,
                    overalClosedDeficiencyCount: 0,
                    attendanceStatus: 'excused',
                },
            ],
            activeDeficiencyList: [],
        };

        await prisma.inspection.update({
            where: { id: staticData.ids.inspectionIds[0] },
            data: { closingReport: mockReport as object },
        });

        const { success, result } = await runServerActionTest(getClosedInspectionList());
        expect(success).toBeTruthy();
        const list = result as {
            id: string;
            hasReport: boolean;
            activeCadets: number;
            cadetsInspected: number;
            deregisteredCadets: number;
            missingCadets: number;
            uniformCompletePercent: number;
        }[];
        const insp = list.find(r => r.id === staticData.ids.inspectionIds[0]);
        expect(insp).toBeDefined();
        expect(insp!.hasReport).toBe(true);
        expect(insp!.activeCadets).toBe(3);
        expect(insp!.cadetsInspected).toBe(2);
        expect(insp!.deregisteredCadets).toBe(1);
        expect(insp!.missingCadets).toBe(0);
        // 1 of 2 inspected cadets have uniformComplete=true → 50%
        expect(insp!.uniformCompletePercent).toBe(50);
    });

    it('uniformCompletePercent is NaN when cadetsInspected=0', async () => {
        const mockReport: InspectionReview = {
            id: staticData.ids.inspectionIds[0],
            name: 'Quartal 1',
            date: '2023-06-18',
            timeStart: '07:58',
            timeEnd: '13:06',
            activeCadets: 1,
            cadetsInspected: 0,
            deregisteredCadets: 0,
            newDeficiencies: 0,
            activeDeficiencies: 0,
            resolvedDeficiencies: 0,
            cadetList: [
                {
                    cadet: { id: 'c1', firstname: 'A', lastname: 'B' },
                    lastInspection: undefined,
                    activeDeficiencyCount: 0,
                    newlyClosedDeficiencyCount: 0,
                    overalClosedDeficiencyCount: 0,
                    attendanceStatus: 'missing',
                },
            ],
            activeDeficiencyList: [],
        };

        await prisma.inspection.update({
            where: { id: staticData.ids.inspectionIds[0] },
            data: { closingReport: mockReport as object },
        });

        const { success, result } = await runServerActionTest(getClosedInspectionList());
        expect(success).toBeTruthy();
        const list = result as { id: string; uniformCompletePercent: number }[];
        const insp = list.find(r => r.id === staticData.ids.inspectionIds[0]);
        expect(insp!.uniformCompletePercent).toBeNaN();
    });

    it('does not return inspections from a different organisation', async () => {
        global.__ASSOSIATION__ = otherOrg.fk_assosiation;
        const { success, result } = await runServerActionTest(getClosedInspectionList());
        global.__ASSOSIATION__ = staticData.fk_assosiation;

        expect(success).toBeTruthy();
        const ids = (result as { id: string }[]).map(r => r.id);
        expect(ids).not.toContain(staticData.ids.inspectionIds[0]);
        expect(ids).not.toContain(staticData.ids.inspectionIds[1]);
    });
});
