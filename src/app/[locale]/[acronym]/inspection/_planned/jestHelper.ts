import dayjs from "@/lib/dayjs";
import { PlannedInspectionType } from "@/types/inspectionTypes";


export const mockCadetList = [
    { id: "1", firstname: "Jack", lastname: "Doe" },
    { id: "2", firstname: "Jane", lastname: "Smith" },
    { id: "3", firstname: "Alice", lastname: "Johnson" },
    { id: "4", firstname: "Bob", lastname: "Brown" },
    { id: "5", firstname: "Charlie", lastname: "Davis" },
];

export const mockInspectionList: PlannedInspectionType[] = [
    {
        id: "1777e18f-f4fa-4ec4-90d8-58a9b1ce16ac",
        name: "Inspection 1",
        date: dayjs().format("YYYY-MM-DD"),
        timeStart: null,
        timeEnd: null,
        deregistrations: [
            {
                fk_cadet: mockCadetList[0].id,
                cadet: mockCadetList[0],
                date: dayjs().toDate(),
                fk_inspection: "1777e18f-f4fa-4ec4-90d8-58a9b1ce16ac",
            },
            {
                fk_cadet: mockCadetList[1].id,
                cadet: mockCadetList[1],
                date: dayjs().subtract(10, "day").toDate(),
                fk_inspection: "1777e18f-f4fa-4ec4-90d8-58a9b1ce16ac",
            }
        ]
    },
    {
        id: "1777e18f-f4fa-4ec4-90d8-58a9b1ce16ad",
        name: "Inspection 2",
        date: dayjs().add(2, "day").format("YYYY-MM-DD"),
        timeStart: null,
        timeEnd: null,
        deregistrations: [
            {
                fk_cadet: mockCadetList[2].id,
                cadet: mockCadetList[2],
                date: dayjs().toDate(),
                fk_inspection: "1777e18f-f4fa-4ec4-90d8-58a9b1ce16ad",
            }
        ]
    },
    {
        id: "1777e18f-f4fa-4ec4-90d8-58a9b1ce16ae",
        name: "Inspection 3",
        date: "2023-10-01",
        timeStart: null,
        timeEnd: null,
        deregistrations: []
    }
];

vi.mock("@/dal/inspection", () => ({
    createInspection: vi.fn().mockResolvedValue("createInspection"),
    deleteInspection: vi.fn().mockResolvedValue("deleteInspection"),
    updatePlannedInspection: vi.fn().mockResolvedValue("updateInspection"),
    updateCadetRegistrationForInspection: vi.fn().mockResolvedValue("updateCadetRegistrationForInspection"),

    startInspection: vi.fn().mockResolvedValue("startInspection"),
    stopInspection: vi.fn().mockResolvedValue("stopInspection"),
}));
vi.mock("@/dataFetcher/inspection", () => ({
    usePlannedInspectionList: vi.fn().mockReturnValue({
        inspectionList: mockInspectionList,
        mutate: vi.fn(async (promise: Promise<void>) => { await promise; return mockInspectionList; }),
    }),
    useInspectionState: vi.fn().mockReturnValue({
        inspectionState: { active: false },
        mutate: vi.fn(async (promise: Promise<void>) => { await promise; return { active: false }; }),
    }),
}));
