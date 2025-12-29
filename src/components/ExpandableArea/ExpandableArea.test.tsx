import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpandableDividerArea } from "./ExpandableArea";

describe('ExpandableArea', () => {

    it('renders area closed', () => {
        const { container } = render(
            <ExpandableDividerArea>
                <div>Test</div>
            </ExpandableDividerArea>
        );

        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('expandableArea.showMore');
        expect(screen.getByRole('img', { hidden: true })).not.toHaveClass(/open/);

        expect(screen.queryByText('Test')).toBeNull();
        expect(container).toMatchSnapshot();
    });

    it('renders area open', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <ExpandableDividerArea>
                <div>Test</div>
            </ExpandableDividerArea>
        );
        const button = screen.getByRole('button');

        await user.click(button);
        expect(button).toHaveTextContent('expandableArea.showLess');
        expect(screen.getByRole('img', { hidden: true })).toHaveClass(/open/);

        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(container).toMatchSnapshot();
    });
});