import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AutocompleteField, { AutocompleteOptionType } from "./AutocompleteField";

const options: AutocompleteOptionType[] = [
    { value: "1", label: "Apple" },
    { value: "2", label: "Banana" },
    { value: "3", label: "Cherry" },
    { value: "4", label: "Date" },
    { value: "5", label: "Elderberry" },
    { value: "6", label: "Fig" },
    { value: "7", label: "Grape" },
    { value: "8", label: "Honeydew" },
];

describe("AutocompleteField", () => {
    it("renders with label and placeholder", () => {
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={() => { }}
                placeholder="Type a fruit"
            />
        );
        expect(screen.getByLabelText("Fruit")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Type a fruit")).toBeInTheDocument();
    });

    it("shows options on focus and filters as user types", async () => {
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={() => { }}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.click(input);
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getAllByRole("option").length).toBeLessThanOrEqual(7);

        await user.type(input, "ap");
        expect(screen.getByText("Apple")).toBeInTheDocument();
        expect(screen.queryByText("Banana")).not.toBeInTheDocument();
    });

    it("calls onChange when user types an exact match (implicit change)", async () => {
        const onChange = jest.fn();
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={onChange}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.type(input, "Banana");
        expect(onChange).toHaveBeenLastCalledWith("2");
        await user.clear(input);
        await user.type(input, "NotARealFruit");
        expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it("does not call onChange on input if noImplicitChange is true", async () => {
        const onChange = jest.fn();
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={onChange}
                noImplicitChange
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.type(input, "Banana");
        expect(onChange).not.toHaveBeenCalled();
    });

    it("selects option with mouse and calls onChange", async () => {
        const onChange = jest.fn();
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={onChange}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.click(input);
        const option = screen.getByText("Cherry");
        await user.click(option);
        expect(onChange).toHaveBeenLastCalledWith("3");
        expect(input).toHaveValue("Cherry");
    });

    it("selects option with keyboard navigation and Enter", async () => {
        const onChange = jest.fn();
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={onChange}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.click(input);
        await user.keyboard("{arrowdown}{enter}");
        expect(onChange).toHaveBeenLastCalledWith("2");
        expect(input).toHaveValue("Banana");
    });

    it("closes options on blur and Escape", async () => {
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={() => { }}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.click(input);
        expect(screen.getByRole("listbox")).toBeInTheDocument();
        await user.keyboard("{escape}");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("resets input on select if resetOnChange is true", async () => {
        const onChange = jest.fn();
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={onChange}
                resetOnChange
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.click(input);
        await user.keyboard("{enter}");
        expect(onChange).toHaveBeenLastCalledWith("1");
        expect(input).toHaveValue("");
    });

    it("disables options using isOptionDisabled", async () => {
        const onChange = jest.fn();
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={onChange}
                isOptionDisabled={(o) => o.value === "2"}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.click(input);
        const banana = screen.getByText("Banana");
        await user.click(banana);
        expect(onChange).not.toHaveBeenCalledWith("2");
        // Keyboard navigation skips disabled
        await user.keyboard("{arrowdown}{enter}");
        expect(onChange).toHaveBeenLastCalledWith("3");
    });

    it("renders custom option with renderOption", async () => {
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={() => { }}
                renderOption={({ option, onMouseDown, highlighted }) => (
                    <div
                        data-testid={`custom-option-${option.value}`}
                        style={{ background: highlighted ? "yellow" : undefined }}
                        onMouseDown={onMouseDown}
                        role="option"
                        aria-selected={highlighted}
                    >
                        {option.label}!
                    </div>
                )}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.click(input);
        expect(screen.getByTestId("custom-option-1")).toHaveTextContent("Apple!");
    });

    it("shows 'No results found' when filter yields no options", async () => {
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={() => { }}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.type(input, "ZZZZZZ");
        expect(screen.getByRole("alert")).toHaveTextContent("No results found");
    });

    it("limits filtered options to 7", async () => {
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={() => { }}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.click(input);
        expect(screen.getAllByRole("option").length).toBe(7);
    });

    it("highlights first option on input change", async () => {
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={() => { }}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.type(input, "a");
        const optionsEls = screen.getAllByRole("option");
        // The first option should have a different background (LightGrey)
        expect(optionsEls[0]).toHaveStyle({ backgroundColor: "LightGrey" });
    });

    it("sets aria attributes correctly", async () => {
        const user = userEvent.setup();
        render(
            <AutocompleteField
                label="Fruit"
                options={options}
                value={null}
                onChange={() => { }}
            />
        );
        const input = screen.getByLabelText("Fruit");
        await user.click(input);
        expect(input).toHaveAttribute("aria-expanded", "true");
        expect(input).toHaveAttribute("aria-controls", "autocomplete-options");
        expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    describe("hilightedIndex", () => {
        // highlighs first option on focus
        // navigates with arrow keys
        // skips disabled options
        // stops at the last option
        // stops at the first option
        it("highlights first option on focus", async () => {
            const user = userEvent.setup();
            render(
                <AutocompleteField
                    label="Fruit"
                    options={options}
                    value={null}
                    onChange={() => { }}
                />
            );
            const input = screen.getByLabelText("Fruit");
            await user.click(input);
            const optionsEls = screen.getAllByRole("option");
            expect(optionsEls[0]).toHaveStyle({ backgroundColor: "LightGrey" });
        });

        it("navigates with arrow keys and highlights correct option", async () => {
            const user = userEvent.setup();
            render(
                <AutocompleteField
                    label="Fruit"
                    options={options}
                    value={null}
                    onChange={() => { }}
                />
            );
            const input = screen.getByLabelText("Fruit");
            await user.click(input);
            await user.keyboard("{arrowdown}");
            const optionsEls = screen.getAllByRole("option");
            expect(optionsEls[1]).toHaveStyle({ backgroundColor: "LightGrey" });
            await user.keyboard("{arrowdown}");
            expect(optionsEls[2]).toHaveStyle({ backgroundColor: "LightGrey" });
            await user.keyboard("{arrowup}");
            expect(optionsEls[1]).toHaveStyle({ backgroundColor: "LightGrey" });
        });

        it("skips disabled options when navigating", async () => {
            const user = userEvent.setup();
            render(
                <AutocompleteField
                    label="Fruit"
                    options={options}
                    value={null}
                    onChange={() => { }}
                    isOptionDisabled={o => o.value === "2" || o.value === "3"}
                />
            );
            const input = screen.getByLabelText("Fruit");
            await user.click(input);
            // Arrow down from first (Apple) should skip Banana (disabled) and highlight Cherry (also disabled), so next is Date
            await user.keyboard("{arrowdown}");
            const optionsEls = screen.getAllByRole("option");
            expect(optionsEls[3]).toHaveStyle({ backgroundColor: "LightGrey" });
        });

        it("stops at the last option when navigating down", async () => {
            const user = userEvent.setup();
            render(
                <AutocompleteField
                    label="Fruit"
                    options={options}
                    value={null}
                    onChange={() => { }}
                />
            );
            const input = screen.getByLabelText("Fruit");
            await user.click(input);
            // 6 arrow downs to reach last visible option (7th)
            for (let i = 0; i < 10; i++) {
                await user.keyboard("{arrowdown}");
            }
            const optionsEls = screen.getAllByRole("option");
            expect(optionsEls[6]).toHaveStyle({ backgroundColor: "LightGrey" });
        });

        it("stops at the first option when navigating up", async () => {
            const user = userEvent.setup();
            render(
                <AutocompleteField
                    label="Fruit"
                    options={options}
                    value={null}
                    onChange={() => { }}
                />
            );
            const input = screen.getByLabelText("Fruit");
            await user.click(input);
            // Move down a few times, then up more than needed
            await user.keyboard("{arrowdown}{arrowdown}");
            await user.keyboard("{arrowup}{arrowup}{arrowup}");
            const optionsEls = screen.getAllByRole("option");
            expect(optionsEls[0]).toHaveStyle({ backgroundColor: "LightGrey" });
        });
    });
});
