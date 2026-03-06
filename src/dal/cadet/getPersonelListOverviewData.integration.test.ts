import { getPersonnelListOverviewData } from "@/dal/cadet/getPersonnelListOverviewData";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";
import { compareDates, runServerActionTest } from "../_helper/testHelper";
import { insertSvenKellerFirstInspection } from "../../../tests/_playwrightConfig/testData/dynamicData";
import { PersonnelListCadet } from "@/types/globalCadetTypes";

const { data, ids, cleanup } = new StaticData(0);
const { cadetIds } = ids;

const defaultProps = {
    orderBy: "lastname" as "lastname" | "firstname",
    asc: true,
    include: {}
}

const runSortOrderTests = () => {
    it('validate asc false order by lastname', async () => {
        const { success, result } = await runServerActionTest(getPersonnelListOverviewData({ ...defaultProps, asc: false }));
        expect(success).toBeTruthy();

        expect(result.length).toBe(9);
        expect(result[8].id).toBe(cadetIds[1]); // Becker
        expect(result[5].id).toBe(cadetIds[0]); // Fried
        expect(result[0].id).toBe(cadetIds[6]); // Weismuller
    });
    it('validate orderby firstname', async () => {
        const { success, result } = await runServerActionTest(getPersonnelListOverviewData({ ...defaultProps, orderBy: "firstname" }));
        expect(success).toBeTruthy();

        expect(result.length).toBe(9);
        expect(result[5].id).toBe(cadetIds[1]); // Becker
        expect(result[0].id).toBe(cadetIds[0]); // Fried
        expect(result[7].id).toBe(cadetIds[6]); // Weismuller
    });
    it('validate asc false order by firstname', async () => {
        const { success, result } = await runServerActionTest(getPersonnelListOverviewData({ ...defaultProps, orderBy: "firstname", asc: false }));
        expect(success).toBeTruthy();

        expect(result.length).toBe(9);
        expect(result[3].id).toBe(cadetIds[1]); // Becker
        expect(result[8].id).toBe(cadetIds[0]); // Fried
        expect(result[1].id).toBe(cadetIds[6]); // Weismuller
    });
}

describe('manager tests', () => {
    it('manager data', async () => {
        const { success, result } = await runServerActionTest(getPersonnelListOverviewData(defaultProps));
        expect(success).toBeTruthy();

        expect(result.length).toBe(9);
        expect(result[0].id).toBe(cadetIds[1]); // Becker
        expect(result[3].id).toBe(cadetIds[0]); // Fried
        expect(result[8].id).toBe(cadetIds[6]); // Weismuller

        expect(result[0].id).toBeDefined();
        expect(result[0].firstname).toBeDefined();
        expect(result[0].lastname).toBeDefined();
        expect(result[0].lastInspection).toBeDefined();
        expect(result[0].activeDeficiencyCount).toBeDefined();
        expect(result[0].uniformComplete).toBeDefined();

        expect(result[2].id).toBe(cadetIds[5]);
        expect(result[2].firstname).toBe(data.cadets[5].firstname);
        expect(result[2].lastname).toBe(data.cadets[5].lastname);
        expect(compareDates('2023-08-13', result[2].lastInspection!)).toBeTruthy();
        expect(result[2].uniformComplete).toBeTruthy();
        expect(result[2].activeDeficiencyCount).toBe(2);

        expect(result[3].id).toBe(cadetIds[0]);
        expect(result[3].firstname).toBe(data.cadets[0].firstname);
        expect(result[3].lastname).toBe(data.cadets[0].lastname);
        expect(result[3].lastInspection).toBeNull();
        expect(result[3].uniformComplete).toBeNull();
        expect(result[3].activeDeficiencyCount).toBe(0);

        expect(result[4].id).toBe(cadetIds[2]);
        expect(result[4].firstname).toBe(data.cadets[2].firstname);
        expect(result[4].lastname).toBe(data.cadets[2].lastname);
        expect(compareDates('2023-06-18', result[4].lastInspection!)).toBeTruthy();
        expect(result[4].uniformComplete).toBeFalsy();
        expect(result[4].activeDeficiencyCount).toBe(6);
    });
    runSortOrderTests();
    describe('filter tests', () => {
        beforeAll(async () => {
            await prisma.inspection.update({
                where: { id: ids.inspectionIds[4] },
                data: { timeStart: "10:00" }
            });
            await insertSvenKellerFirstInspection(0);
        });
        afterAll(() => cleanup.inspection());
        it('validate default filter on active inspection', async () => {
            const { success, result } = await runServerActionTest<PersonnelListCadet[]>(getPersonnelListOverviewData(defaultProps));
            expect(success).toBeTruthy();
            if (!success) return;

            expect(result).toHaveLength(5);

            const ids = result.map((c) => c.id);
            // inspected
            expect(ids).not.toContain(cadetIds[2]);
            // deregistered
            expect(ids).not.toContain(cadetIds[6]);
            expect(ids).not.toContain(cadetIds[7]);
            expect(ids).not.toContain(cadetIds[9]);
        });
        it('validate filter deregistration on active inspection', async () => {
            const { success, result } = await runServerActionTest<PersonnelListCadet[]>(
                getPersonnelListOverviewData({ ...defaultProps, include: { deregistered: true, inspected: false } })
            );
            expect(success).toBeTruthy();
            if (!success) return;
            expect(result).toHaveLength(8);

            const ids = result.map((c) => c.id);
            // inspected
            expect(ids).not.toContain(cadetIds[2]);
            // deregistered
            expect(ids).toContain(cadetIds[6]);
            expect(ids).toContain(cadetIds[7]);
            expect(ids).toContain(cadetIds[9]);
        });
        it('validate filter inspected on active inspection', async () => {

            const { success, result } = await runServerActionTest<PersonnelListCadet[]>(
                getPersonnelListOverviewData({ ...defaultProps, include: { deregistered: false, inspected: true } })
            );
            expect(success).toBeTruthy();
            expect(result).toHaveLength(6);

            if (!success) return;
            const ids = result.map((c) => c.id);
            // inspected
            expect(ids).toContain(cadetIds[2]);
            // deregistered
            expect(ids).not.toContain(cadetIds[6]);
            expect(ids).not.toContain(cadetIds[7]);
            expect(ids).not.toContain(cadetIds[9]);
        });
    })
});
describe('user tests', () => {
    beforeAll(() => {
        global.__ROLE__ = AuthRole.user;
    });
    afterAll(() => {
        delete global.__ROLE__
    });
    it('manager data', async () => {
        const { success, result } = await runServerActionTest(getPersonnelListOverviewData(defaultProps));
        expect(success).toBeTruthy();

        expect(result.length).toBe(9);
        expect(result[0].id).toBe(cadetIds[1]); // Becker
        expect(result[3].id).toBe(cadetIds[0]); // Fried
        expect(result[8].id).toBe(cadetIds[6]); // Weismuller

        expect(result[0].id).toBeDefined();
        expect(result[0].firstname).toBeDefined();
        expect(result[0].lastname).toBeDefined();
        expect(result[0].lastInspection).toBeUndefined();
        expect(result[0].activeDeficiencyCount).toBeUndefined();
        expect(result[0].uniformComplete).toBeUndefined();

        expect(result[2].id).toBe(cadetIds[5]);
        expect(result[2].firstname).toBe(data.cadets[5].firstname);
        expect(result[2].lastname).toBe(data.cadets[5].lastname);

        expect(result[3].id).toBe(cadetIds[0]);
        expect(result[3].firstname).toBe(data.cadets[0].firstname);
        expect(result[3].lastname).toBe(data.cadets[0].lastname);

        expect(result[4].id).toBe(cadetIds[2]);
        expect(result[4].firstname).toBe(data.cadets[2].firstname);
        expect(result[4].lastname).toBe(data.cadets[2].lastname);
    });
    runSortOrderTests();
    describe('filter tests', () => {
        beforeAll(async () => {
            await prisma.inspection.update({
                where: { id: ids.inspectionIds[4] },
                data: { timeStart: "10:00" }
            });
            await insertSvenKellerFirstInspection(0);
        });
        afterAll(() => cleanup.inspection());
        it('validate default filter on active inspection', async () => {
            const { success, result } = await runServerActionTest<PersonnelListCadet[]>( getPersonnelListOverviewData(defaultProps));
            expect(success).toBeTruthy();
            expect(result).toHaveLength(9);
        });
        it('validate filter include all', async () => {
            const { success, result } = await runServerActionTest<PersonnelListCadet[]>(
                getPersonnelListOverviewData({ ...defaultProps, include: { deregistered: true, inspected: true } })
            );
            expect(success).toBeTruthy();
            expect(result).toHaveLength(9);
        });
    });
});
