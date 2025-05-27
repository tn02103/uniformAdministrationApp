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
        expect(button.getElementsByTagName('svg')[0]).not.toHaveClass(/open/);

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
        expect(button.getElementsByTagName('svg')[0]).toHaveClass(/open/);

        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(container).toMatchSnapshot();
    });
});