import { updatePlannedInspection } from "@/dal/inspection/planned/update";
import { StaticData } from "../../../_playwrightConfig/testData/staticDataLoader";
import dayjs from "dayjs";
import { prisma } from "@/lib/db";

const staticData = new StaticData(0);
const initialData = {
    data: {
        name: 'New Name',
        date: dayjs().add(20, "day").toDate(),
    },
    id: staticData.ids.inspectionIds[2],
}
it('valid call', async () => {
    const result = await updatePlannedInspection(initialData);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toHaveLength(3);

    const dbData = await prisma.inspection.findUnique({
        where: { id: staticData.ids.inspectionIds[2] }
    });
    expect(dbData).not.toBeNull();
    expect(dayjs(dbData?.date).isSame(initialData.data.date, "day")).toBeTruthy();
    expect(dbData?.name).toBe(initialData.data.name);
});
it('name duplication', async () => {
    const data = {
        ...initialData,
        data: { ...initialData.data, name: staticData.data.inspections[1].name }
    }
    const result = await updatePlannedInspection(data).catch(e => e);
    expect(result.exceptionType).toBe(1);
    expect(result.message).toMatch(/Name is duplicated/);
});
it('date duplication', async () => {
    const data = {
        ...initialData,
        data: { ...initialData.data, date: staticData.data.inspections[3].date }
    }
    const result = await updatePlannedInspection(data).catch(e => e);
    expect(result.exceptionType).toBe(1);
    expect(result.message).toMatch(/Date is duplicated/);
});
it('inspection started', async () => {
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[2] },
        data: { timeStart: dayjs().subtract(10, "minute").toDate() }
    });
    const result = await updatePlannedInspection(initialData).catch(e => e);
    expect(result.exceptionType).toBe(1);
    expect(result.message).toMatch(/Inspection started/);
});
