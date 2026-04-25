import { getClosedInspectionList } from "@/dal/inspection/closed/get";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { runServerActionTest } from "../../_helper/testHelper";

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

    it('returns numeric stats for each closed inspection', async () => {
        const { success, result } = await runServerActionTest(getClosedInspectionList());
        expect(success).toBeTruthy();
        const list = result as {
            id: string;
            activeCadets: number;
            cadetsInspected: number;
            deregisteredCadets: number;
            missingCadets: number;
            uniformCompletePercent: number;
        }[];
        const insp = list.find(r => r.id === staticData.ids.inspectionIds[0]);
        expect(insp).toBeDefined();
        expect(typeof insp!.activeCadets).toBe('number');
        expect(typeof insp!.cadetsInspected).toBe('number');
        expect(typeof insp!.deregisteredCadets).toBe('number');
        expect(typeof insp!.missingCadets).toBe('number');
        // missingCadets = activeCadets - cadetsInspected - deregisteredCadets
        expect(insp!.missingCadets).toBe(
            insp!.activeCadets - insp!.cadetsInspected - insp!.deregisteredCadets
        );
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

    it('includes cadets soft-deleted AFTER the inspection date in activeCadets count', async () => {
        // cadet[8] has recdelete = 2023-08-16, which is after inspection[0] date 2023-06-18.
        // Bug: the old query used recdelete IS NULL, which excluded cadet[8] giving activeCadets = 9.
        // Fix: the query now also counts cadets whose recdelete date is after the inspection date.
        const { success, result } = await runServerActionTest(getClosedInspectionList());
        expect(success).toBeTruthy();
        const list = result as { id: string; activeCadets: number }[];
        const insp = list.find(r => r.id === staticData.ids.inspectionIds[0]);
        expect(insp).toBeDefined();
        // All 10 cadets are active on 2023-06-18, including cadet[8] deleted on 2023-08-16.
        expect(insp!.activeCadets).toBe(10);
    });
});
