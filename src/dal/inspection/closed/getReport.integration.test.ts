import { getClosedInspectionReport } from "@/dal/inspection/closed/getReport";
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
});
