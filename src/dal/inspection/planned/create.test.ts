import dayjs from "@/lib/dayjs";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { createInspection } from "@/dal/inspection/planned/create";
import { prisma } from "@/lib/db";

const staticData = new StaticData(0);

afterEach(async () => {
    await staticData.cleanup.inspection();
});
describe('createInspection', () => {

    it('valid call', async () => {
        const data = {
            name: "Test23",
            date: dayjs().add(30, "day").format("YYYY-MM-DD"),
        }
        const result = await createInspection(data).catch(() => ({ error: true }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            date: dayjs().format("YYYY-MM-DD"),
        }
        const result = await createInspection(data).catch(e => e);
        expect(result.exceptionType).toBe(1);
        expect(result.message).toMatch(/Date already in use/);
    });
    it('validate unique name constraint', async () => {
        const data = {
            name: staticData.data.inspections[4].name,
            date: dayjs().add(30, "day").format("YYYY-MM-DD"),
        }
        const result = await createInspection(data).catch(e => e);
        expect(result.exceptionType).toBe(1);
        expect(result.message).toMatch(/Name already in use/);
    });
    describe('validate date not in the past constraint', () => {
        it('yesterday', async () => {
            const data = {
                name: "Test Inspection",
                date: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
            }
            const result = await createInspection(data).catch(e => e);

            expect(result.issues[0]).toBeDefined();
            expect(result.issues[0].message).toBe('date.minIncluded#today');
            expect(result.issues[0].code).toBe('custom');
        });
        it('today', async () => {
            const data = {
                name: "Test Inspection",
                date: dayjs().format("YYYY-MM-DD"),
            }
            await prisma.inspection.deleteMany({ where: { date: data.date, fk_assosiation: staticData.fk_assosiation } });

            const result = await createInspection(data).catch(e => e);
            expect(result.exceptionType).toBe(undefined);
            expect(Array.isArray(result)).toBeTruthy();
            expect(result).toHaveLength(3);
        });
    });
});