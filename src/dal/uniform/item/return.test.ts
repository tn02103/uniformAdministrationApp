import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { returnItem } from "./return";

const { ids, cleanup } = new StaticData(0);
const uniformId = ids.uniformIds[0][42];
const cadetId = ids.cadetIds[0];

const today = new Date();
today.setUTCHours(0, 0, 0, 0);

afterEach(async () => await cleanup.uniformIssued());
it('should set dateReturned if dateIssued !== today', async () => {
    const { success, result } = await runServerActionTest(returnItem({ uniformId, cadetId }));
    expect(success).toBeTruthy();
    expect(result[ids.uniformTypeIds[0]]).toHaveLength(3);

    const dbIssuedEntry = await prisma.uniformIssued.findFirst({
        where: {
            fk_uniform: uniformId,
            fk_cadet: cadetId
        }
    });
    expect(dbIssuedEntry).not.toBeNull();
    expect(dbIssuedEntry!.dateIssued).toBeDefined();
    expect(dbIssuedEntry!.dateIssued).not.toEqual(today);
    expect(dbIssuedEntry!.dateReturned).toBeDefined();
    expect(dbIssuedEntry!.dateReturned).toEqual(today);
});

it('should remove issuedEntry if dateIssued === today', async () => {
    await prisma.uniformIssued.updateMany({
        where: {
            fk_uniform: uniformId,
            fk_cadet: cadetId,
            dateReturned: null,
        },
        data: { dateIssued: today }
    });
    const { success, result } = await runServerActionTest(returnItem({ uniformId, cadetId }));
    expect(success).toBeTruthy();
    expect(result[ids.uniformTypeIds[0]]).toHaveLength(3);

    const dbIssuedEntry = await prisma.uniformIssued.findFirst({ where: { id: uniformId } });
    expect(dbIssuedEntry).toBeNull();
});

it('should fail if already returned', async () => {
    await runServerActionTest(returnItem({ uniformId, cadetId }));
    const { success, result } = await runServerActionTest(returnItem({ uniformId, cadetId }));
    expect(success).toBeFalsy();
    expect(result.message).toContain('Could not return Uniform. Issued Entry not found');
});

it('should fail if uniform not issued', async () => {
    const invalidUniformId = ids.uniformIds[1][10];
    const { success, result } = await runServerActionTest(returnItem({ uniformId: invalidUniformId, cadetId }));
    expect(success).toBeFalsy();
    expect(result.message).toContain('Could not return Uniform. Issued Entry not found');
});

it('should fail if item issued to different cadet', async () => {
    const differentCadetId = ids.cadetIds[1];
    const { success, result } = await runServerActionTest(returnItem({ uniformId, cadetId: differentCadetId }));
    expect(success).toBeFalsy();
    expect(result.message).toContain('Could not return Uniform. Issued Entry not found');
});

describe('', () => {
    afterEach(async () => {
        await cleanup.cadet();
        await cleanup.uniform();
    });
    it('should fail if uniformItem is deleted', async () => {
        await prisma.uniform.update({ where: { id: uniformId }, data: { recdelete: new Date() } });
        const { success } = await runServerActionTest(returnItem({ uniformId, cadetId }));
        expect(success).toBeFalsy();
    });
    it('should fail if cadet is deleted', async () => {
        await prisma.cadet.update({ where: { id: cadetId }, data: { recdelete: new Date() } });
        const { success } = await runServerActionTest(returnItem({ uniformId, cadetId }));
        expect(success).toBeFalsy();
    })
})
