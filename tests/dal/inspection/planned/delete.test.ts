import { deleteInspection } from "@/dal/inspection/planned/delete";
import { prisma } from "@/lib/db";
import dayjs from "dayjs";
import { StaticData } from "../../../_playwrightConfig/testData/staticDataLoader";

const staticData = new StaticData(0);
afterEach(async () => {
    await staticData.cleanup.inspection();
});
it('valid call', async () => {
    const result = await deleteInspection(staticData.ids.inspectionIds[3]).catch(e => e);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toHaveLength(2);

    const dbData = await prisma.inspection.findUnique({ where: { id: staticData.ids.inspectionIds[3] } });
    expect(dbData).toBeNull();
});
it('started inspection', async () => {
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[2] },
        data: { timeStart: dayjs().subtract(10, "minute").toDate() }
    });
    const result = await deleteInspection(staticData.ids.inspectionIds[2]).catch(e => e);
    expect(result.exceptionType).toBe(1);
    expect(result.message).toBe('Inspections that have been started once can not be deleted');
});
it('wrong assosiation', async () => {
    const wrongData = new StaticData(1);
    expect(deleteInspection(wrongData.ids.inspectionIds[3])).rejects.toBeDefined();
});
