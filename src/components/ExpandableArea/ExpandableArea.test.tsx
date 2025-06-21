import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpandableArea } from "./ExpandableArea";

describe('ExpandableArea', () => {

    it('renders area closed', () => {
        const { container } = render(
            <ExpandableArea>
                <div>Test</div>
            </ExpandableArea>
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
            <ExpandableArea>
                <div>Test</div>
            </ExpandableArea>
        );
        const button = screen.getByRole('button');

        await user.click(button);
        expect(button).toHaveTextContent('expandableArea.showLess');
        expect(screen.getByRole('img', { hidden: true })).toHaveClass(/open/);

        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(container).toMatchSnapshot();
    });
});