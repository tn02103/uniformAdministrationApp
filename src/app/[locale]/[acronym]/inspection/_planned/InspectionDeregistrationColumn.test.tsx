import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InspectionDeregistrationColumn } from "./InspectionDeregistrationColumn";
import { mockInspectionList } from "./jestHelper";

describe('<InspectionDeregistrationColumn />', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should render deregistration count and open offcanvas on click', async () => {
        const inspection = mockInspectionList[0]; // Use the first inspection from the mock data

        const openOffcanvasMock = jest.fn();
        render(
            <InspectionDeregistrationColumn
                inspection={inspection}
                openOffcanvas={openOffcanvasMock}
            />
        );

        const deregistrationCount = screen.getByText(String(inspection.deregistrations.length));
        expect(deregistrationCount).toBeInTheDocument();
    });
    it('should call openOffcanvas when deregistration count is clicked', async () => {
        const inspection = mockInspectionList[0]; // Use the first inspection from the mock data

        const openOffcanvasMock = jest.fn();
        const user = userEvent.setup();
        render(
            <InspectionDeregistrationColumn
                inspection={inspection}
                openOffcanvas={openOffcanvasMock}
            />
        );

        const deregistrationCount = screen.getByRole('button');
        await user.click(deregistrationCount);

        expect(openOffcanvasMock).toHaveBeenCalled();
    });
});
