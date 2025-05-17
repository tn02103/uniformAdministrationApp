import "./jestHelper";

import dayjs from "@/lib/dayjs";
import { getAllByRole, getByRole, getByTestId, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlannedInspectionTable } from "./PlannedInspectionTable";
import { mockCadetList, mockInspectionList } from "./jestHelper";

describe('<PlannedInspectionTable />', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render the table with inspections', () => {
        render(
            <PlannedInspectionTable inspections={mockInspectionList} cadets={mockCadetList} />
        );

        expect(screen.getByTestId('div_plannedTable')).toBeInTheDocument();
        expect(screen.getAllByRole('row')).toHaveLength(mockInspectionList.length + 1);
        const rows = screen.getAllByRole('row').splice(1); // Exclude header row
        mockInspectionList.forEach((inspection, index) => {
            expect(getByTestId(rows[index], 'div_name')).toHaveTextContent(inspection.name);
            expect(getByTestId(rows[index], 'div_date')).toHaveTextContent(dayjs(inspection.date).locale('de').format("dd DD.MM.YYYY"));
        });
    });

    it('should show "no inspections" message when there are no inspections', () => {
        const { usePlannedInspectionList } = jest.requireMock("@/dataFetcher/inspection");
        usePlannedInspectionList.mockReturnValueOnce({
            inspectionList: [],
            mutate: jest.fn(),
        });

        render(
            <PlannedInspectionTable inspections={[]} cadets={mockCadetList} />
        );

        expect(screen.getByTestId('div_noData')).toBeInTheDocument();
        expect(screen.getByTestId('div_noData')).toHaveTextContent(/noInspections/i);
    });

    it('should show and hide newInspection line', async () => {
        const user = userEvent.setup();
        render(
            <PlannedInspectionTable inspections={mockInspectionList} cadets={mockCadetList} />
        );

        expect(screen.queryByRole('row', { name: /newInspection/i })).toBeNull();
        const button = screen.getByRole('button', { name: /create/i });
        await user.click(button);

        expect(screen.getByRole('row', { name: /newInspection/i })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /cancel/i }));
        expect(screen.queryByRole('row', { name: /newInspection/i })).toBeNull();
    });

    it('should open DeregistrationOffcanvas when clicking on deregistrations button', async () => {
        const user = userEvent.setup();
        render(
            <PlannedInspectionTable inspections={mockInspectionList} cadets={mockCadetList} />
        );

        const row = screen.getAllByRole('row')[1]; // Get the first inspection row
        const button = getByRole(row, 'button', { name: /deregistration/i });
        await user.click(button);

        const tbody = screen.getByTestId('deregistration-table-body');
        expect(tbody).toBeInTheDocument();

        const rows = getAllByRole(tbody, 'row');
        expect(rows).toHaveLength(mockInspectionList[0].deregistrations.length);

        mockInspectionList[0].deregistrations.forEach((deregistration, index) => {
            const cells = getAllByRole(rows[index], 'cell');

            expect(cells[1]).toHaveTextContent(deregistration.cadet.firstname);
            expect(cells[1]).toHaveTextContent(deregistration.cadet.lastname);
            expect(cells[2]).toHaveTextContent(dayjs(deregistration.date).format('DD.MM.YYYY'));
        });
    });
    it('should close DeregistrationOffcanvas when clicking on close button', async () => {
        const user = userEvent.setup();
        render(
            <PlannedInspectionTable inspections={mockInspectionList} cadets={mockCadetList} />
        );

        const row = screen.getAllByRole('row')[1]; // Get the first inspection row
        const button = getByRole(row, 'button', { name: /deregistration/i });
        await user.click(button);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        const closeButton = getByRole(dialog, 'button', { name: /close/i });
        await user.click(closeButton);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
