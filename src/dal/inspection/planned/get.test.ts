import { getPlannedInspectionList } from "@/dal/inspection/planned/get"
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";

const staticData = new StaticData(0);
describe('getPlannedInspectionList', () => {
    it('correct sortorder (expired, today, planned)', async () => {
        const result = await getPlannedInspectionList();
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(3);

        expect(result[0].id).toBe(staticData.ids.inspectionIds[2]);
        expect(result[1].id).toBe(staticData.ids.inspectionIds[4]);
        expect(result[2].id).toBe(staticData.ids.inspectionIds[3]);
    });
    it('correctData', async () => {
        const inspection = staticData.data.inspections[4];//Inspection:today
        inspection.date.setUTCHours(0, 0, 0, 0);
        const result = await getPlannedInspectionList();

        expect(result[1].date).toEqual(inspection.date);
        expect(result[1].name).toEqual(inspection.name);
        expect(result[1].timeEnd).toEqual(inspection.timeEnd);
        expect(result[1].timeStart).toEqual(inspection.timeStart);

        // Dergistrations
        expect(result[1].deregistrations).toHaveLength(3);
        const cadets = [staticData.data.cadets[9], staticData.data.cadets[7], staticData.data.cadets[6]];
        result[1].deregistrations.forEach((deregistration, index) => {
            expect(deregistration.cadet).toEqual({
                firstname: cadets[index].firstname,
                lastname: cadets[index].lastname,
                id: cadets[index].id
            });
            expect(dayjs().subtract(5, "day").isSame(deregistration.date, "day")).toBeTruthy();
        });
    });
    it('active is included', async () => {
        // setup
        const inspection = staticData.data.inspections[4];//Inspection:today
        await prisma.inspection.update({
            where: { id: inspection.id },
            data: { timeStart: "10:00" }
        });

        // TEST
        const result = await getPlannedInspectionList().catch(e => e);
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(3);
        expect(dayjs().isSame(result[1].date, "day")).toBeTruthy();
        expect(result[1].timeStart).toEqual("10:00");
        expect(result[1].timeEnd).toBeNull();

        // TEARDOWN
        await prisma.inspection.update({
            where: { id: inspection.id },
            data: inspection
        });
    });
    it('finished today is included', async () => {
        // SETUP
        const inspection = staticData.data.inspections[4]; //Inspection:today
        await prisma.inspection.update({
            where: { id: inspection.id },
            data: {
                timeStart: "10:00",
                timeEnd: "14:00",
            }
        });

        // TEST
        const result = await getPlannedInspectionList().catch(e => e);
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(3);
        expect(dayjs().isSame(result[1].date, "day")).toBeTruthy();
        expect(result[1].timeStart).toEqual("10:00");
        expect(result[1].timeEnd).toEqual("14:00");

        // TEARDOWN
        await prisma.inspection.update({
            where: { id: inspection.id },
            data: inspection,
        });
    });
    it('unfinished but passed', async () => {
        // SETUP
        const inspection = staticData.data.inspections[2];//Inspection:expired
        await prisma.inspection.update({
            where: { id: inspection.id },
            data: {
                timeStart: "10:00",
            }
        });

        // TEST
        const result = await getPlannedInspectionList().catch(e => e);
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(3);

        expect(dayjs().isAfter(result[0].date, "day")).toBeTruthy();
        expect(result[0].timeStart).toEqual("10:00");
        expect(result[0].timeEnd).toBeNull();

        // TEARDOWN
        await prisma.inspection.update({
            where: { id: inspection.id },
            data: inspection,
        });
    });
});
