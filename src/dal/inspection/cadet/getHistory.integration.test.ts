import { prisma } from "@/lib/db";
import { staticData, wrongAssosiation } from "../../../../vitest/setup-dal-integration";
import { runServerActionTest } from "../../_helper/testHelper";
import { getInspectionsByCadet } from "./getHistory";
import { CadetInspectionHistoryRow } from "@/types/inspectionTypes";

const { ids } = staticData;

afterEach(async () => {
    await staticData.cleanup.inspection();
});

describe('getInspectionsByCadet', () => {
    describe('result structure and ordering', () => {
        it('returns rows ordered by date DESC for a cadet with multiple inspections', async () => {
            // cadet[1] is inspected in both closed inspections
            const { success, result } = await runServerActionTest(
                getInspectionsByCadet({ cadetId: ids.cadetIds[1] })
            );
            expect(success).toBeTruthy();
            const rows = result as CadetInspectionHistoryRow[];

            // Both closed inspections should be returned
            const rowIds = rows.map(r => r.id);
            expect(rowIds).toContain(ids.inspectionIds[0]);
            expect(rowIds).toContain(ids.inspectionIds[1]);

            // Open inspections must not be returned
            expect(rowIds).not.toContain(ids.inspectionIds[2]);
            expect(rowIds).not.toContain(ids.inspectionIds[3]);
            expect(rowIds).not.toContain(ids.inspectionIds[4]);

            // Order: inspection[1] (2023-08-13) before inspection[0] (2023-06-18)
            expect(rowIds.indexOf(ids.inspectionIds[1])).toBeLessThan(
                rowIds.indexOf(ids.inspectionIds[0])
            );
        });
    });

    describe('attendanceState', () => {
        it('is "inspected" when a cadet_inspection record exists', async () => {
            // cadet[1] was inspected at inspection[0]
            const { success, result } = await runServerActionTest(
                getInspectionsByCadet({ cadetId: ids.cadetIds[1] })
            );
            expect(success).toBeTruthy();
            const rows = result as CadetInspectionHistoryRow[];
            const row = rows.find(r => r.id === ids.inspectionIds[0]);
            expect(row).toBeDefined();
            expect(row!.attendanceState).toBe('inspected');
            expect(row!.uniformComplete).toBe(true);
        });

        it('is "missing" when neither a cadet_inspection nor a deregistration exists', async () => {
            // cadet[0] has no cadetInspection or deregistration for either closed inspection
            const { success, result } = await runServerActionTest(
                getInspectionsByCadet({ cadetId: ids.cadetIds[0] })
            );
            expect(success).toBeTruthy();
            const rows = result as CadetInspectionHistoryRow[];
            const row = rows.find(r => r.id === ids.inspectionIds[0]);
            expect(row).toBeDefined();
            expect(row!.attendanceState).toBe('missing');
            expect(row!.uniformComplete).toBeNull();
        });

        it('is "excused" when a deregistration exists for the inspection', async () => {
            // Add a deregistration for cadet[4] at inspection[0] (closed)
            await prisma.deregistration.create({
                data: {
                    fk_cadet: ids.cadetIds[4],
                    fk_inspection: ids.inspectionIds[0],
                    date: new Date('2023-06-10'),
                },
            });

            const { success, result } = await runServerActionTest(
                getInspectionsByCadet({ cadetId: ids.cadetIds[4] })
            );
            expect(success).toBeTruthy();
            const rows = result as CadetInspectionHistoryRow[];
            const row = rows.find(r => r.id === ids.inspectionIds[0]);
            expect(row).toBeDefined();
            expect(row!.attendanceState).toBe('excused');
            expect(row!.uniformComplete).toBeNull();
        });
    });

    describe('deficiency counts', () => {
        it('returns correct newlyCreatedCount, resolvedCount and unresolvedCount', async () => {
            // cadet[3] at inspection[1] (2023-08-13):
            //   def[7] (fk_cadet=cadet[3], fk_inspectionCreated=inspection[1], dateCreated=2023-08-13, unresolved)
            //   def[11] (fk_cadet=cadet[3], fk_inspectionCreated=inspection[1], dateCreated=2023-08-13, unresolved)
            const { success, result } = await runServerActionTest(
                getInspectionsByCadet({ cadetId: ids.cadetIds[3] })
            );
            expect(success).toBeTruthy();
            const rows = result as CadetInspectionHistoryRow[];

            const row1 = rows.find(r => r.id === ids.inspectionIds[1]);
            expect(row1).toBeDefined();
            expect(row1!.newlyCreatedCount).toBe(2);
            expect(row1!.resolvedCount).toBe(0);
            expect(row1!.unresolvedCount).toBe(2);

            // At inspection[0] (2023-06-18), no deficiencies exist yet for cadet[3]
            const row0 = rows.find(r => r.id === ids.inspectionIds[0]);
            expect(row0).toBeDefined();
            expect(row0!.newlyCreatedCount).toBe(0);
            expect(row0!.resolvedCount).toBe(0);
            expect(row0!.unresolvedCount).toBe(0);
        });
    });

    describe('org isolation', () => {
        it('rejects a request when the cadet belongs to a different organisation', async () => {
            // Switch session to wrongAssosiation; cadet[0] belongs to staticData's org → validator rejects
            global.__ASSOSIATION__ = wrongAssosiation.fk_assosiation;
            const { success } = await runServerActionTest(
                getInspectionsByCadet({ cadetId: ids.cadetIds[0] })
            );
            global.__ASSOSIATION__ = staticData.fk_assosiation;

            expect(success).toBeFalsy();
        });

        it('does not return inspections from another organisation when querying own cadet', async () => {
            // A cadet from wrongAssosiation should not see staticData inspections
            global.__ASSOSIATION__ = wrongAssosiation.fk_assosiation;
            const { success, result } = await runServerActionTest(
                getInspectionsByCadet({ cadetId: wrongAssosiation.ids.cadetIds[0] })
            );
            global.__ASSOSIATION__ = staticData.fk_assosiation;

            expect(success).toBeTruthy();
            const rows = result as CadetInspectionHistoryRow[];
            const rowIds = rows.map(r => r.id);
            expect(rowIds).not.toContain(ids.inspectionIds[0]);
            expect(rowIds).not.toContain(ids.inspectionIds[1]);
        });
    });

    describe('dateCreated filter', () => {
        it('excludes inspections before the cadet dateCreated', async () => {
            // Update cadet[0].dateCreated to 2023-07-01
            // inspection[0] date='2023-06-18' < 2023-07-01 → excluded
            // inspection[1] date='2023-08-13' >= 2023-07-01 → included
            await prisma.cadet.update({
                where: { id: ids.cadetIds[0] },
                data: { createdAt: new Date('2023-07-01') },
            });

            const { success, result } = await runServerActionTest(
                getInspectionsByCadet({ cadetId: ids.cadetIds[0] })
            );
            expect(success).toBeTruthy();
            const rows = result as CadetInspectionHistoryRow[];
            const rowIds = rows.map(r => r.id);

            expect(rowIds).not.toContain(ids.inspectionIds[0]);
            expect(rowIds).toContain(ids.inspectionIds[1]);
        });

        it('includes all inspections when cadet dateCreated is before all inspections', async () => {
            // Set dateCreated to a very early date → all inspections included
            await prisma.cadet.update({
                where: { id: ids.cadetIds[0] },
                data: { createdAt: new Date('2000-01-01') },
            });

            const { success, result } = await runServerActionTest(
                getInspectionsByCadet({ cadetId: ids.cadetIds[0] })
            );
            expect(success).toBeTruthy();
            const rows = result as CadetInspectionHistoryRow[];
            const rowIds = rows.map(r => r.id);

            expect(rowIds).toContain(ids.inspectionIds[0]);
            expect(rowIds).toContain(ids.inspectionIds[1]);
        });
    });
});
