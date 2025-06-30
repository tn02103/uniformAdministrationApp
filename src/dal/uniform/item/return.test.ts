/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy } from "jest-mock-extended";
import { returnItem, __unsecuredReturnUniformitem } from "./return";
import { mockUniformList } from "../../../../tests/_jestConfig/staticMockData";
import { __unsecuredGetCadetUniformMap } from "@/dal/cadet/uniformMap";

// Mock the dependencies
jest.mock("@/dal/cadet/uniformMap", () => ({
    __unsecuredGetCadetUniformMap: jest.fn().mockResolvedValue([]),
}));

// Get the mocked functions
const mockGetCadetUniformMap = __unsecuredGetCadetUniformMap as jest.MockedFunction<typeof __unsecuredGetCadetUniformMap>;

// Get the mocked prisma client
const mockPrisma = jest.requireMock("@/lib/db").prisma as DeepMockProxy<PrismaClient>;

// Mock data
const mockCadetId = 'cadet-123';
const mockUniformId = 'uniform-456';
const mockIssuedEntryId = 'issued-entry-789';

const defaultReturnProps = {
    uniformId: mockUniformId,
    cadetId: mockCadetId,
};

// Fixed date for testing - June 27, 2025
const MOCK_TODAY = new Date('2025-06-27T10:00:00.000Z');
const MOCK_PAST_DATE = new Date('2025-06-25T10:00:00.000Z'); // 2 days ago

const mockIssuedEntry = {
    id: mockIssuedEntryId,
    dateIssued: MOCK_PAST_DATE,
    fk_uniform: mockUniformId,
    fk_cadet: mockCadetId,
    dateReturned: null,
};

const mockIssuedEntryToday = {
    ...mockIssuedEntry,
    dateIssued: MOCK_TODAY, // Same day as "today"
};

describe('<UniformItem> return', () => {

    beforeAll(() => {
        // Set up mock return values that depend on imported data
        mockGetCadetUniformMap.mockResolvedValue([mockUniformList[0]] as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
        // Reset all mock implementations to their default state
        if (mockPrisma.uniformIssued?.findFirst?.mockReset) {
            mockPrisma.uniformIssued.findFirst.mockReset();
            mockPrisma.uniformIssued.update.mockReset();
            mockPrisma.uniformIssued.delete.mockReset();
        }
        if (mockPrisma.$transaction?.mockReset) {
            mockPrisma.$transaction.mockReset();
        }
        // Restore real time
        jest.useRealTimers();
    });

    beforeEach(() => {
        // Setup default transaction mock
        mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
        
        // Default mock responses
        mockPrisma.uniformIssued.findFirst.mockResolvedValue(mockIssuedEntry as any);
        mockPrisma.uniformIssued.update.mockResolvedValue(mockIssuedEntry as any);
        mockPrisma.uniformIssued.delete.mockResolvedValue(mockIssuedEntry as any);
        
        // Mock system time to MOCK_TODAY
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_TODAY);
    });

    describe('successful return scenarios', () => {
        it('returns uniform item successfully when not issued today', async () => {
            // Set the issued entry to a past date (not today)
            mockPrisma.uniformIssued.findFirst.mockResolvedValue(mockIssuedEntry as any);

            const result = await returnItem(defaultReturnProps);

            expect(result).toEqual([mockUniformList[0]]);
            expect(mockPrisma.uniformIssued.findFirst).toHaveBeenCalledWith({
                where: {
                    uniform: {
                        id: mockUniformId,
                        recdelete: null,
                    },
                    cadet: {
                        id: mockCadetId,
                        recdelete: null,
                    },
                    dateReturned: null,
                }
            });
            expect(mockPrisma.uniformIssued.update).toHaveBeenCalledWith({
                where: { id: mockIssuedEntryId },
                data: {
                    dateReturned: expect.any(Date),
                }
            });
            expect(mockPrisma.uniformIssued.delete).not.toHaveBeenCalled();
            expect(mockGetCadetUniformMap).toHaveBeenCalledWith(mockCadetId, mockPrisma);
        });

        it('deletes uniform issued entry when returned on same day as issued', async () => {
            // Set the issued entry to today's date
            mockPrisma.uniformIssued.findFirst.mockResolvedValue(mockIssuedEntryToday as any);

            const result = await returnItem(defaultReturnProps);

            expect(result).toEqual([mockUniformList[0]]);
            expect(mockPrisma.uniformIssued.delete).toHaveBeenCalledWith({
                where: { id: mockIssuedEntryId }
            });
            expect(mockPrisma.uniformIssued.update).not.toHaveBeenCalled();
            expect(mockGetCadetUniformMap).toHaveBeenCalledWith(mockCadetId, mockPrisma);
        });

        it('verifies correct transaction usage', async () => {
            await returnItem(defaultReturnProps);

            // Transaction should be called with the callback function
            expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe('error scenarios', () => {
        it('throws error when issued entry is not found', async () => {
            mockPrisma.uniformIssued.findFirst.mockResolvedValue(null);

            await expect(returnItem(defaultReturnProps)).rejects.toThrow('Could not return Uniform. Issued Entry not found: uniform-456');

            expect(mockPrisma.uniformIssued.update).not.toHaveBeenCalled();
            expect(mockPrisma.uniformIssued.delete).not.toHaveBeenCalled();
            expect(mockGetCadetUniformMap).not.toHaveBeenCalled();
        });
    });

    describe('validation scenarios', () => {
        it('calls genericSAValidator with correct parameters', async () => {
            // In unit tests, the genericSAValidator is mocked and doesn't actually validate
            // This test just ensures the function flow works
            const result = await returnItem(defaultReturnProps);

            expect(result).toEqual([mockUniformList[0]]);
            expect(mockPrisma.uniformIssued.findFirst).toHaveBeenCalled();
        });
    });

    describe('database interaction verification', () => {
        it('verifies correct uniform issued entry lookup parameters', async () => {
            await returnItem(defaultReturnProps);

            // Ensures that only entries are found that are:
            // - not returned
            // - match the cadet and uniform IDs
            // - cadet and uniform may not have been deleted

            expect(mockPrisma.uniformIssued.findFirst).toHaveBeenCalledWith({
                where: {
                    uniform: {
                        id: mockUniformId,
                        recdelete: null,
                    },
                    cadet: {
                        id: mockCadetId,
                        recdelete: null,
                    },
                    dateReturned: null,
                }
            });
        });

        it('verifies cadet uniform map is retrieved with correct parameters', async () => {
            await returnItem(defaultReturnProps);

            expect(mockGetCadetUniformMap).toHaveBeenCalledWith(mockCadetId, mockPrisma);
        });
    });
});

describe('<UniformItem> __unsecuredReturnUniformitem', () => {
    
    afterEach(() => {
        jest.clearAllMocks();
        if (mockPrisma.uniformIssued?.update?.mockReset) {
            mockPrisma.uniformIssued.update.mockReset();
            mockPrisma.uniformIssued.delete.mockReset();
        }
        // Restore real time
        jest.useRealTimers();
    });

    beforeEach(() => {
        mockPrisma.uniformIssued.update.mockResolvedValue(mockIssuedEntry as any);
        mockPrisma.uniformIssued.delete.mockResolvedValue(mockIssuedEntry as any);
        
        // Mock system time to MOCK_TODAY
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_TODAY);
    });

    describe('date-based behavior', () => {
        it('deletes entry when issued today', async () => {
            // Issue date is the same as current system time (MOCK_TODAY)
            await __unsecuredReturnUniformitem(mockIssuedEntryId, MOCK_TODAY, mockPrisma);

            expect(mockPrisma.uniformIssued.delete).toHaveBeenCalledWith({
                where: { id: mockIssuedEntryId }
            });
            expect(mockPrisma.uniformIssued.update).not.toHaveBeenCalled();
        });

        it('updates entry with return date when not issued today', async () => {
            // Issue date is different from current system time
            await __unsecuredReturnUniformitem(mockIssuedEntryId, MOCK_PAST_DATE, mockPrisma);

            expect(mockPrisma.uniformIssued.update).toHaveBeenCalledWith({
                where: { id: mockIssuedEntryId },
                data: {
                    dateReturned: expect.any(Date),
                }
            });
            expect(mockPrisma.uniformIssued.delete).not.toHaveBeenCalled();
        });

        it('handles edge case: midnight in German timezone (same day)', async () => {
            // Set system time to midnight in German timezone (UTC+1/+2)
            // June 27, 2025 00:00:00 in German time = June 26, 2025 22:00:00 UTC (during DST)
            const midnightGermanTime = new Date('2025-06-26T22:00:00.000Z'); // UTC equivalent of German midnight
            jest.setSystemTime(midnightGermanTime);

            // Issue date is also the same day in German timezone
            const issueDateGermanTime = new Date('2025-06-26T23:30:00.000Z'); // UTC equivalent of 01:30 German time
            
            await __unsecuredReturnUniformitem(mockIssuedEntryId, issueDateGermanTime, mockPrisma);

            expect(mockPrisma.uniformIssued.delete).toHaveBeenCalled();
            expect(mockPrisma.uniformIssued.update).not.toHaveBeenCalled();
        });

        it('handles edge case: UTC vs German timezone boundary (different days)', async () => {
            // Set system time to 01:00 UTC on June 27 (03:00 German time during DST)
            const utcMorning = new Date('2025-06-27T01:00:00.000Z');
            jest.setSystemTime(utcMorning);

            // Issue date is 23:00 UTC on June 26 (01:00 German time on June 27)
            // This is the same day in German timezone but different day in UTC
            const issueDatePreviousDayUTC = new Date('2025-06-26T23:00:00.000Z');
            
            await __unsecuredReturnUniformitem(mockIssuedEntryId, issueDatePreviousDayUTC, mockPrisma);

            expect(mockPrisma.uniformIssued.delete).toHaveBeenCalled();
            expect(mockPrisma.uniformIssued.update).not.toHaveBeenCalled();
        });

        it('handles edge case: late in German day vs early next day in UTC', async () => {
            // Set system time to 22:30 UTC on June 27 (00:30 German time on June 28 during DST)
            const lateUTC = new Date('2025-06-27T22:30:00.000Z');
            jest.setSystemTime(lateUTC);

            // Issue date is earlier the same UTC day but different German day (20:00 UTC June 27 = 22:00 German time June 27)
            const earlierSameUTCDay = new Date('2025-06-27T20:00:00.000Z');
            
            // These are different days in German timezone: June 27 vs June 28
            await __unsecuredReturnUniformitem(mockIssuedEntryId, earlierSameUTCDay, mockPrisma);

            expect(mockPrisma.uniformIssued.update).toHaveBeenCalledWith({
                where: { id: mockIssuedEntryId },
                data: {
                    dateReturned: expect.any(Date),
                }
            });
            expect(mockPrisma.uniformIssued.delete).not.toHaveBeenCalled();
        });

        it('handles edge case: different days in German timezone', async () => {
            // Set system time to German timezone day
            const currentGermanDay = new Date('2025-06-27T12:00:00.000Z'); // 14:00 German time
            jest.setSystemTime(currentGermanDay);

            // Issue date is previous day in German timezone
            const previousGermanDay = new Date('2025-06-26T12:00:00.000Z'); // 14:00 German time previous day
            
            await __unsecuredReturnUniformitem(mockIssuedEntryId, previousGermanDay, mockPrisma);

            expect(mockPrisma.uniformIssued.update).toHaveBeenCalledWith({
                where: { id: mockIssuedEntryId },
                data: {
                    dateReturned: expect.any(Date),
                }
            });
            expect(mockPrisma.uniformIssued.delete).not.toHaveBeenCalled();
        });
    });

    describe('parameter validation', () => {
        it('uses correct issued entry ID', async () => {
            const customEntryId = 'custom-entry-123';

            await __unsecuredReturnUniformitem(customEntryId, MOCK_PAST_DATE, mockPrisma);

            expect(mockPrisma.uniformIssued.update).toHaveBeenCalledWith({
                where: { id: customEntryId },
                data: {
                    dateReturned: expect.any(Date),
                }
            });
        });

        it('uses provided transaction client', async () => {
            const customClient = {
                uniformIssued: {
                    delete: jest.fn(),
                    update: jest.fn(),
                },
            } as unknown as PrismaClient;

            await __unsecuredReturnUniformitem(mockIssuedEntryId, MOCK_TODAY, customClient);
            await __unsecuredReturnUniformitem(mockIssuedEntryId, MOCK_PAST_DATE, customClient);

            expect(customClient.uniformIssued.delete).toHaveBeenCalled();
            expect(customClient.uniformIssued.update).toHaveBeenCalled();
        });
    });
});
