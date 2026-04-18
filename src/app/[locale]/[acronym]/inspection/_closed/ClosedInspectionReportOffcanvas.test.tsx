import { InspectionReview } from "@/types/deficiencyTypes";
import { ClosedInspectionReportOffcanvas } from "./ClosedInspectionReportOffcanvas";
import { useClosedInspectionReport } from "@/dataFetcher/inspection";
import { render, screen, within } from "@testing-library/react";

vi.mock("@/dataFetcher/inspection", () => ({
    useClosedInspectionList: vi.fn().mockReturnValue({ closedInspectionList: [] }),
    useClosedInspectionReport: vi.fn(),
}));

const mockReport: InspectionReview = {
    id: "insp-1",
    name: "Kontrolle Januar",
    date: "2026-01-15",
    timeStart: "09:00",
    timeEnd: "12:00",
    activeCadets: 3,
    cadetsInspected: 2,
    deregisteredCadets: 1,
    newDeficiencies: 1,
    activeDeficiencies: 2,
    resolvedDeficiencies: 0,
    cadetList: [
        {
            cadet: { id: "c1", firstname: "Max", lastname: "Mustermann" },
            attendanceStatus: "inspected",
            lastInspection: { id: "li1", date: "2026-01-15", uniformComplete: true },
            activeDeficiencyCount: 0,
            newlyClosedDeficiencyCount: 0,
            overalClosedDeficiencyCount: 0,
        },
        {
            cadet: { id: "c2", firstname: "Anna", lastname: "Schmidt" },
            attendanceStatus: "excused",
            lastInspection: undefined,
            activeDeficiencyCount: 1,
            newlyClosedDeficiencyCount: 0,
            overalClosedDeficiencyCount: 0,
        },
        {
            cadet: { id: "c3", firstname: "Tom", lastname: "Klein" },
            attendanceStatus: "missing",
            lastInspection: undefined,
            activeDeficiencyCount: 0,
            newlyClosedDeficiencyCount: 0,
            overalClosedDeficiencyCount: 0,
        },
    ],
    activeDeficiencyList: [
        {
            id: "def-1",
            description: "Hemd fehlt",
            comment: "",
            deficiencyType: { id: "dt1", name: "Uniform", dependent: "cadet", relation: "cadet" },
            new: false,
        },
        {
            id: "def-2",
            description: "Schuhe falsch",
            comment: "",
            deficiencyType: { id: "dt1", name: "Uniform", dependent: "cadet", relation: "cadet" },
            new: true,
        },
    ],
};

describe("<ClosedInspectionReportOffcanvas />", () => {
    beforeEach(() => {
        vi.mocked(useClosedInspectionReport).mockReturnValue({ inspectionReport: mockReport });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders summary section with correct data", () => {
        render(
            <ClosedInspectionReportOffcanvas inspectionId="insp-1" onClose={vi.fn()} />
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Kontrolle Januar")).toBeInTheDocument();
        expect(screen.getByText("2026-01-15")).toBeInTheDocument();
        expect(screen.getByText("09:00 - 12:00")).toBeInTheDocument();
    });

    it("renders cadet list with attendanceStatus column", () => {
        render(
            <ClosedInspectionReportOffcanvas inspectionId="insp-1" onClose={vi.fn()} />
        );

        expect(screen.getByText("Mustermann, Max")).toBeInTheDocument();
        expect(screen.getByText("Schmidt, Anna")).toBeInTheDocument();
        expect(screen.getByText("Klein, Tom")).toBeInTheDocument();

        // attendance labels via i18n mock: scope.key pattern
        expect(screen.getByText(/attendanceStatus.inspected/i)).toBeInTheDocument();
        expect(screen.getByText(/attendanceStatus.excused/i)).toBeInTheDocument();
        expect(screen.getByText(/attendanceStatus.missing/i)).toBeInTheDocument();
    });

    it("XLSX download button has correct href", () => {
        render(
            <ClosedInspectionReportOffcanvas inspectionId="insp-1" onClose={vi.fn()} />
        );

        const dialog = screen.getByRole("dialog");
        const downloadLink = within(dialog).getByRole("link", { name: /actions.downloadXlsx/i });
        expect(downloadLink).toHaveAttribute("href", "/api/inspection/insp-1/report");
    });

    it("shows active deficiency count", () => {
        render(
            <ClosedInspectionReportOffcanvas inspectionId="insp-1" onClose={vi.fn()} />
        );

        // Active deficiencies count = 2 (length of activeDeficiencyList)
        // Find the dd element next to the activeDeficiencies label
        const dialog = screen.getByRole("dialog");
        const activeDefLabel = within(dialog).getByText(/report.activeDeficiencies/i);
        const activeDefValue = activeDefLabel.nextElementSibling;
        expect(activeDefValue).toHaveTextContent("2");
    });
});
