import { DBQuery } from "@/dal/inspection/_dbQuerys";
import { stopInspection } from "@/dal/inspection/stop";
import { ExceptionType } from "@/errors/CustomException";
import { prisma } from "@/lib/db";
import { sendInspectionReviewMail } from "@/lib/email/inspectionReview";
import dayjs from "dayjs";
import { StaticData } from "../../_playwrightConfig/testData/staticDataLoader";

const staticData = new StaticData(0);
const dbQuery = new DBQuery();
const defaultParams = {
    time: '12:00',
    id: staticData.ids.inspectionIds[4],
}
jest.mock('@/lib/email/inspectionReview', () => ({
    sendInspectionReviewMail: jest.fn(),
}));

afterEach(() => staticData.cleanup.inspection());

const runServerAction = (func: () => Promise<any>) => func()
    .then((result) => ({
        success: true,
        result: result,
    })).catch((error) => ({
        success: false,
        result: error,
    }));

it('valid call', async () => {
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[4] },
        data: { timeStart: dayjs.utc('09:00', 'HH:mm').toDate() }
    });
    const { success } = await runServerAction(() => stopInspection(defaultParams));
    expect(success).toBeTruthy();

    const dbData = await prisma.inspection.findUnique({
        where: { id: staticData.ids.inspectionIds[4], }
    });
    expect(dbData).not.toBeNull();
    expect(dbData?.timeEnd).not.toBeNull();
    expect(dayjs.utc(dbData?.timeStart).format('HH:mm')).toBe('09:00');
});
it('validate sendEmail function called', async () => {
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[4] },
        data: { timeStart: dayjs.utc('09:00', 'HH:mm').toDate() }
    });
    const { success } = await runServerAction(() => stopInspection(defaultParams));
    expect(success).toBeTruthy();

    const email = process.env.EMAIL_ADRESS_TESTS ?? 'admin@example.com';
    const inspectionReviewData = await dbQuery.getInspectionReviewData(staticData.fk_assosiation, staticData.ids.inspectionIds[4], prisma);
    expect(jest.isMockFunction(sendInspectionReviewMail)).toBeTruthy();
    expect(sendInspectionReviewMail).toHaveBeenCalled();
    expect(sendInspectionReviewMail).toHaveBeenCalledWith([email], inspectionReviewData);
});
it('not started', async () => {
    const { success, result } = await runServerAction(() => stopInspection(defaultParams));
    expect(success).toBeFalsy();

    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Inspection has not jet been started/);
});
it(' allready finished', async () => {
    const { success, result } = await runServerAction(() =>
        stopInspection({ ...defaultParams, id: staticData.ids.inspectionIds[0] })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Inspection already finished/);
});
it('endTime is before startTime', async () => {
    await prisma.inspection.update({
        where: { id: staticData.ids.inspectionIds[4] },
        data: { timeStart: dayjs.utc('09:00', 'HH:mm').toDate() }
    });

    const { success, result } = await runServerAction(() =>
        stopInspection({ ...defaultParams, time: '05:00' })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/Endtime is before starttime of inspection/);
});
describe('', () => {
    const wrongAssosiation = new StaticData(1);
    afterEach(() => wrongAssosiation.cleanup.inspection());
    it('wrong assosiation', async () => {
        await prisma.inspection.update({
            where: { id: wrongAssosiation.ids.inspectionIds[4] },
            data: { timeStart: dayjs.utc('09:00', 'HH:mm').toDate() }
        });
        const { result, success } = await runServerAction(() =>
            stopInspection({ ...defaultParams, id: wrongAssosiation.ids.inspectionIds[4] })
        );
        expect(success).toBeFalsy();
        expect(result).toBeDefined();
        expect(result.code).toBe('P2025');
    });
});
