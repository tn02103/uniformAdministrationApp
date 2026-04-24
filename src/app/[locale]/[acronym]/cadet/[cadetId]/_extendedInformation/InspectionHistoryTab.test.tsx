import { CadetInspectionHistoryRow } from "@/types/inspectionTypes";
import { render, screen, within } from "@testing-library/react";
import { useInspectionsByCadet } from "@/dataFetcher/inspection";
import { InspectionHistoryTab } from "./InspectionHistoryTab";

vi.mock("@/dataFetcher/inspection", () => ({
    useInspectionsByCadet: vi.fn(),
}));

const mockRow: CadetInspectionHistoryRow = {
    id: "insp-1",
    date: "2026-01-15",
    attendanceState: "inspected",
    uniformComplete: true,
    unresolvedCount: 2,
    resolvedCount: 1,
    newlyCreatedCount: 3,
};

describe("<InspectionHistoryTab />", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders a spinner while data is undefined", () => {
        vi.mocked(useInspectionsByCadet).mockReturnValue({ inspectionHistory: undefined });
        render(<InspectionHistoryTab cadetId="cadet-1" />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders empty state when array is empty", () => {
        vi.mocked(useInspectionsByCadet).mockReturnValue({ inspectionHistory: [] });
        render(<InspectionHistoryTab cadetId="cadet-1" />);
        expect(screen.getByText(/empty/i)).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("renders a table row with correct data", () => {
        vi.mocked(useInspectionsByCadet).mockReturnValue({ inspectionHistory: [mockRow] });
        render(<InspectionHistoryTab cadetId="cadet-1" />);

        const table = screen.getByRole("table");
        expect(table).toBeInTheDocument();

        const rows = within(table).getAllByRole("row");
        // rows[0] is header, rows[1] is data
        const cells = within(rows[1]).getAllByRole("cell");
        expect(cells[0]).toHaveTextContent("2026-01-15");
        expect(cells[2]).toHaveTextContent("uniformComplete.yes");
        expect(cells[3]).toHaveTextContent("2");
        expect(cells[4]).toHaveTextContent("1");
        expect(cells[5]).toHaveTextContent("3");
    });

    it("shows correct badge variant for inspected", () => {
        vi.mocked(useInspectionsByCadet).mockReturnValue({
            inspectionHistory: [{ ...mockRow, attendanceState: "inspected" }],
        });
        render(<InspectionHistoryTab cadetId="cadet-1" />);
        const badge = screen.getByText(/attendanceState.inspected/i);
        expect(badge).toHaveClass("bg-success");
    });

    it("shows correct badge variant for excused", () => {
        vi.mocked(useInspectionsByCadet).mockReturnValue({
            inspectionHistory: [{ ...mockRow, attendanceState: "excused" }],
        });
        render(<InspectionHistoryTab cadetId="cadet-1" />);
        const badge = screen.getByText(/attendanceState.excused/i);
        expect(badge).toHaveClass("bg-warning");
    });

    it("shows correct badge variant for missing", () => {
        vi.mocked(useInspectionsByCadet).mockReturnValue({
            inspectionHistory: [{ ...mockRow, attendanceState: "missing" }],
        });
        render(<InspectionHistoryTab cadetId="cadet-1" />);
        const badge = screen.getByText(/attendanceState.missing/i);
        expect(badge).toHaveClass("bg-secondary");
    });

    it("shows check mark when uniformComplete is true", () => {
        vi.mocked(useInspectionsByCadet).mockReturnValue({
            inspectionHistory: [{ ...mockRow, uniformComplete: true }],
        });
        render(<InspectionHistoryTab cadetId="cadet-1" />);
        const rows = within(screen.getByRole("table")).getAllByRole("row");
        const cells = within(rows[1]).getAllByRole("cell");
        expect(cells[2]).toHaveTextContent("uniformComplete.yes");
    });

    it("shows x mark when uniformComplete is false", () => {
        vi.mocked(useInspectionsByCadet).mockReturnValue({
            inspectionHistory: [{ ...mockRow, uniformComplete: false }],
        });
        render(<InspectionHistoryTab cadetId="cadet-1" />);
        const rows = within(screen.getByRole("table")).getAllByRole("row");
        const cells = within(rows[1]).getAllByRole("cell");
        expect(cells[2]).toHaveTextContent("uniformComplete.no");
    });

    it("shows empty cell when uniformComplete is null", () => {
        vi.mocked(useInspectionsByCadet).mockReturnValue({
            inspectionHistory: [{ ...mockRow, uniformComplete: null }],
        });
        render(<InspectionHistoryTab cadetId="cadet-1" />);
        const rows = within(screen.getByRole("table")).getAllByRole("row");
        const cells = within(rows[1]).getAllByRole("cell");
        expect(cells[2]).toHaveTextContent("");
    });
});
