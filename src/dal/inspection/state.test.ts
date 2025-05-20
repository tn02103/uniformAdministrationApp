/* eslint-disable @typescript-eslint/no-explicit-any */
import { getInspectionState } from "@/dal/inspection/state";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import dayjs from "@/lib/dayjs";

const staticData = new StaticData(0);
const inspectionIds = staticData.ids.inspectionIds;
afterEach(() => staticData.cleanup.inspection());

describe('getInspectionState', () => {
    it('validate none of interest', async () => {
        // SETUP
        await prisma.inspection.delete({
            where: { id: inspectionIds[4] }
        }); // remove todays inspection

        // TEST
        const result: any = await getInspectionState();
        expect(result.active).toBeFalsy();
        expect(result.state).toEqual('none');
        expect(result.id).toBeUndefined();
        expect(result.date).toBeUndefined();
    });
    it('planned today', async () => {
        const result: any = await getInspectionState();
        expect(result.active).toBeFalsy();
        expect(result.state).toBe('planned');
        expect(result.id).toBeUndefined();
        expect(result.date).toBeUndefined();
    })
    it('active', async () => {
        // SETUP
        await prisma.inspection.update({
            where: { id: inspectionIds[4] },
            data: { timeStart: "14:00" }
        });

        // TESTS
        const result: any = await getInspectionState();
        expect(result.active).toBeTruthy();
        expect(result.state).toEqual('active');
        expect(result.id).toEqual(staticData.data.inspections[4].id);
        expect(dayjs().isSame(result.date, "day")).toBeTruthy();
        expect(result.inspectedCadets).toBe(0);
        expect(result.activeCadets).toBe(9);
        expect(result.deregistrations).toBe(3);
    })
    it('finished today', async () => {
        // SETUP
        await prisma.inspection.update({
            where: { id: inspectionIds[4] },
            data: {
                timeStart: "12:00",
                timeEnd: "15:00",
            }
        });

        // TEST
        const result: any = await getInspectionState();
        expect(result.active).toBeFalsy();
        expect(result.state).toBe("finished");
        expect(result.id).toBeUndefined();
        expect(result.date).toBeUndefined();
    });
    it('unfinished today', async () => {
        // SETUP
        await prisma.inspection.update({
            where: { id: inspectionIds[2] },
            data: {
                timeStart: "12:00",
            }
        });

        // TEST
        const result: any = await getInspectionState();
        expect(result.active).toBeFalsy();
        expect(result.state).toBe("unfinished");
        expect(result.id).toEqual(inspectionIds[2]);
        expect(result.date).toBeUndefined();
    });
});
