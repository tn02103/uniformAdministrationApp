import { startInspection } from "@/dal/inspection/start";
import { prisma } from "@/lib/db";
import dayjs from "dayjs";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";

const staticData = new StaticData(0);
afterEach(() => staticData.cleanup.inspection());
it('valid call', async () => {
    await expect(startInspection()).resolves.not.toThrow();
    const dbData = await prisma.inspection.findFirst({
        where: {
            id: staticData.ids.inspectionIds[4],
        }
    });
    expect(dbData).not.toBeNull();
    expect(dayjs().isSame(dbData?.date, "day")).toBeTruthy();
    expect(dbData?.timeStart).not.toBeNull();
    expect(dbData?.timeEnd).toBeNull();
});
it('active Inspection', async () => {
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[4] },
        data: { timeStart: new Date() }
    });

    const result = await startInspection().catch(e => e);
    expect(result.exceptionType).toBe(1);
    expect(result.message).toBe('Could not start inspection: Inspection already started');
});
it('unfinished Inspection', async () => {
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[2] },
        data: { timeStart: new Date() }
    });

    const result = await startInspection().catch(e => e);
    expect(result.exceptionType).toBe(1);
    expect(result.message).toBe('Could not start inspection: Last Inspection unfinished');
});
it('finished todays inspection', async () => {
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[4] },
        data: {
            timeStart: new Date(),
            timeEnd: new Date()
        },
    });

    await expect(startInspection()).resolves.not.toThrow();
    const dbData = await prisma.inspection.findUnique({
        where: { id: staticData.ids.inspectionIds[4] }
    });
    expect(dbData).toBeDefined();
    expect(dayjs().isSame(dbData?.date, "day")).toBeTruthy();
    expect(dbData?.timeStart).not.toBeNull();
    expect(dbData?.timeEnd).toBeNull();
});
it('no Inspection planned for today', async () => {
    await prisma.inspection.delete({
        where: { id: staticData.ids.inspectionIds[4] }
    });
    const result = await startInspection().catch(e => e);
    expect(result.exceptionType).toBe(1);
    expect(result.message).toBe('Could not start inspection: No Planned Insepctions Today');
});
