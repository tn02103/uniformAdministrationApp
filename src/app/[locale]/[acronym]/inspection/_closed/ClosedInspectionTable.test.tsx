import { ClosedInspectionSummary } from "@/types/deficiencyTypes";
import { ClosedInspectionTable } from "./ClosedInspectionTable";
import { useClosedInspectionList } from "@/dataFetcher/inspection";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/dataFetcher/inspection", () => ({
    useClosedInspectionList: vi.fn(),
    useClosedInspectionReport: vi.fn().mockReturnValue({ inspectionReport: undefined }),
}));

const mockInspections: ClosedInspectionSummary[] = [
    {
        id: "insp-1",
        name: "Kontrolle Januar",
        date: "2026-01-15",
        timeStart: "09:00",
        timeEnd: "12:00",
        activeCadets: 20,
        cadetsInspected: 15,
        deregisteredCadets: 3,
        missingCadets: 2,
        uniformCompletePercent: 80,
    },
    {
        id: "insp-2",
        name: "Kontrolle Februar",
        date: "2026-02-20",
        timeStart: "10:00",
        timeEnd: "13:00",
        activeCadets: 18,
        cadetsInspected: 0,
        deregisteredCadets: 0,
        missingCadets: 0,
        uniformCompletePercent: NaN,
    },
];

describe("<ClosedInspectionTable />", () => {
    beforeEach(() => {
        vi.mocked(useClosedInspectionList).mockReturnValue({
            closedInspectionList: mockInspections,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders table with correct columns", () => {
        render(<ClosedInspectionTable initialData={mockInspections} />);

        const table = screen.getByRole("table");
        expect(table).toBeInTheDocument();

        const headers = within(table).getAllByRole("columnheader");
        expect(headers[0]).toHaveTextContent(/columns.name/i);
        expect(headers[1]).toHaveTextContent(/columns.date/i);
        expect(headers[2]).toHaveTextContent(/columns.duration/i);
        expect(headers[3]).toHaveTextContent(/columns.activeCadets/i);
        expect(headers[4]).toHaveTextContent(/columns.cadetsInspected/i);
        expect(headers[5]).toHaveTextContent(/columns.deregisteredCadets/i);
        expect(headers[6]).toHaveTextContent(/columns.missingCadets/i);
        expect(headers[7]).toHaveTextContent(/columns.uniformComplete/i);
    });

    it("renders rows with correct data", () => {
        render(<ClosedInspectionTable initialData={mockInspections} />);

        const row1 = screen.getByTestId("row_insp-1");
        const cells1 = within(row1).getAllByRole("cell");
        expect(cells1[0]).toHaveTextContent("Kontrolle Januar");
        expect(cells1[1]).toHaveTextContent("2026-01-15");
        expect(cells1[2]).toHaveTextContent("09:00 - 12:00");
        expect(cells1[3]).toHaveTextContent("20");
        expect(cells1[4]).toHaveTextContent("15");
        expect(cells1[5]).toHaveTextContent("3");
        expect(cells1[6]).toHaveTextContent("2");
        expect(cells1[7]).toHaveTextContent("80%");

        const row2 = screen.getByTestId("row_insp-2");
        const cells2 = within(row2).getAllByRole("cell");
        expect(cells2[7]).toHaveTextContent("-");
    });

    it("clicking 'Bericht anzeigen' opens the report offcanvas", async () => {
        const user = userEvent.setup();
        render(<ClosedInspectionTable initialData={mockInspections} />);

        const row1 = screen.getByTestId("row_insp-1");
        const showReportButton = within(row1).getByRole("button", { name: /actions.showReport/i });
        await user.click(showReportButton);

        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes the offcanvas when close button is clicked", async () => {
        const user = userEvent.setup();
        render(<ClosedInspectionTable initialData={mockInspections} />);

        const row1 = screen.getByTestId("row_insp-1");
        await user.click(within(row1).getByRole("button", { name: /actions.showReport/i }));

        const dialog = screen.getByRole("dialog");
        await user.click(within(dialog).getByRole("button", { name: /close/i }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
