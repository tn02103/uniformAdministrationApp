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
        date: dayjs().toDate(),
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
        date: dayjs().add(2, "day").toDate(),
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
        date: new Date("2023-10-01"),
        timeStart: new Date("2023-10-01T10:00:00"),
        timeEnd: null,
        deregistrations: []
    }
];

jest.mock("@/dal/inspection", () => ({
    createInspection: jest.fn().mockResolvedValue("createInspection"),
    deleteInspection: jest.fn().mockResolvedValue("deleteInspection"),
    updatePlannedInspection: jest.fn().mockResolvedValue("updateInspection"),
    updateCadetRegistrationForInspection: jest.fn().mockResolvedValue("updateCadetRegistrationForInspection"),

    startInspection: jest.fn().mockResolvedValue("startInspection"),
    stopInspection: jest.fn().mockResolvedValue("stopInspection"),
}));
jest.mock("@/dataFetcher/inspection", () => ({
    usePlannedInspectionList: jest.fn().mockReturnValue({
        data: mockInspectionList,
        mutate: jest.fn().mockResolvedValue(mockInspectionList),
    }),
    useInspectionState: jest.fn().mockReturnValue({
        data: { active: false },
        mutate: jest.fn().mockResolvedValue({ active: false }),
    }),
}))
