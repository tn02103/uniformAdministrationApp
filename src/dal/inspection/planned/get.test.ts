import { getPlannedInspectionList } from "@/dal/inspection/planned/get"
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import dayjs from "dayjs";
import { prisma } from "@/lib/db";

const staticData = new StaticData(0);
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
    inspection.date.setUTCHours(0,0,0,0);
    const result = await getPlannedInspectionList();

    expect(result[1].date).toEqual(inspection.date);
    expect(result[1].name).toEqual(inspection.name);
    expect(result[1].timeEnd).toEqual(inspection.timeEnd);
    expect(result[1].timeStart).toEqual(inspection.timeStart);
    expect(result[1].deregistrations).toHaveLength(3);
    expect(result[1].deregistrations[0].cadet).toEqual({
        firstname: staticData.data.cadets[6].firstname,
        lastname: staticData.data.cadets[6].lastname,
        id: staticData.data.cadets[6].id
    });
    expect(dayjs().subtract(5, "day").isSame(result[1].deregistrations[0].date, "day")).toBeTruthy();
});
it('active is included', async () => {
    // setup
    const inspection = staticData.data.inspections[4];//Inspection:today
    await prisma.inspection.update({
        where: { id: inspection.id },
        data: { timeStart: dayjs().subtract(10, "minute").toDate() }
    });

    // TEST
    const result = await getPlannedInspectionList().catch(e => e);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toHaveLength(3);
    expect(dayjs().isSame(result[1].date, "day")).toBeTruthy();
    expect(result[1].timeStart).not.toBeNull();
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
            timeStart: dayjs().subtract(10, "minute").toDate(),
            timeEnd: dayjs().subtract(2, "minute").toDate(),
         }
    });

    // TEST
    const result = await getPlannedInspectionList().catch(e => e);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toHaveLength(3);
    expect(dayjs().isSame(result[1].date, "day")).toBeTruthy();
    expect(result[1].timeStart).not.toBeNull();
    expect(result[1].timeEnd).not.toBeNull();

    // TEARDOWN
    await prisma.inspection.update({
        where: {id: inspection.id},
        data: inspection,
    });
});
it('unfinished but passed', async () => {
    // SETUP
    const inspection = staticData.data.inspections[2];//Inspection:expired
    await prisma.inspection.update({
        where: { id: inspection.id },
        data: { 
            timeStart: dayjs().subtract(10, "minute").toDate(),
         }
    });

    // TEST
    const result = await getPlannedInspectionList().catch(e => e);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toHaveLength(3);

    expect(dayjs().isAfter(result[0].date, "day")).toBeTruthy();
    expect(result[0].timeStart).not.toBeNull();
    expect(result[0].timeEnd).toBeNull();

    // TEARDOWN
    await prisma.inspection.update({
        where: {id: inspection.id},
        data: inspection,
    });
});
