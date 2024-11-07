import dayjs from "@/lib/dayjs";
import { StaticData } from "../../../_playwrightConfig/testData/staticDataLoader";
import { createInspection } from "@/dal/inspection/planned/create";
import { prisma } from "@/lib/db";

const staticData = new StaticData(0);

afterEach(async () => {
    await staticData.cleanup.inspection();
});
it('valid call', async () => {
    const data = {
        name: "Test23",
        date: dayjs().add(30, "day").toDate(),
    }
    data.date.setUTCHours(0, 0, 0, 0);
    const result = await createInspection(data).catch(() => ({ error: true }));
    expect((result as any).error).toBeUndefined();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toHaveLength(4);

    const dbData = await prisma.inspection.findFirst({
        where: { name: data.name, fk_assosiation: staticData.fk_assosiation }
    });
    expect(dbData).not.toBeNull();
    expect(dbData!.fk_assosiation).toBe(staticData.fk_assosiation);
    expect(dbData!.name).toEqual(data.name);
    expect(dbData!.date).toEqual(data.date);
    expect(dbData!.timeEnd).toBeNull();
    expect(dbData!.timeStart).toBeNull();
});
it('validate unique date constraint', async () => {
    const data = {
        name: "Test Inspection",
        date: new Date(),
    }
    const result = await createInspection(data).catch(e => e);
    expect(result.exceptionType).toBe(1);
    expect(result.message).toMatch(/Date already in use/);
});
it('validate unique name constraint', async () => {
    const data = {
        name: staticData.data.inspections[4].name,
        date: dayjs().add(30, "day").toDate(),
    }
    const result = await createInspection(data).catch(e => e);
    expect(result.exceptionType).toBe(1);
    expect(result.message).toMatch(/Name already in use/);
});
describe('validate date not in the past constraint', () => {
    it('yesterday', async () => {
        const data = {
            name: "Test Inspection",
            date: dayjs().subtract(1, "day").toDate(),
        }
        const result = await createInspection(data).catch(e => e);

        expect(result.issues[0]).toBeDefined();
        expect(result.issues[0].message).toBe('date.minToday');
        expect(result.issues[0].code).toBe('too_small');
    });
    it('today', async () => {
        const data = {
            name: "Test Inspection",
            date: new Date(),
        }
        await prisma.inspection.deleteMany({ where: { date: data.date, fk_assosiation: staticData.fk_assosiation } });

        const result = await createInspection(data).catch(e => e);
        expect(result.exceptionType).toBe(undefined);
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(3);
    });
});