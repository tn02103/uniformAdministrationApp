import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UniformListFilterAccordionBody } from "./UniformListFilterAccordionBody";
import { FormProvider, useForm } from "react-hook-form";
import { FilterType } from "./UniformListSidePanel";

const itemList = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" }
];

function Wrapper({ children, defaultValues }: { children: React.ReactNode, defaultValues: Partial<FilterType> }) {
    const methods = useForm({ defaultValues });
    return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("UniformListFilterAccordionBody", () => {
    it("renders all checkboxes", () => {
        render(
            <Wrapper defaultValues={{
                all: { generations: false, sizes: false },
                generations: { "1": false, "2": false, null: false },
                sizes: { "1": false, "2": false, null: false }
            }}>
                <UniformListFilterAccordionBody itemList={itemList} name="generations" />
            </Wrapper>
        );
        expect(screen.getByLabelText("Select All")).toBeInTheDocument();
        expect(screen.getByLabelText("K.A.")).toBeInTheDocument();
        expect(screen.getByLabelText("Item 1")).toBeInTheDocument();
        expect(screen.getByLabelText("Item 2")).toBeInTheDocument();
    });

    it("selects all items when 'Select All' is checked", async () => {
        const user = userEvent.setup();
        render(
            <Wrapper defaultValues={{
                all: { generations: false, sizes: false },
                generations: { "1": false, "2": true, null: false }
            }}>
                <UniformListFilterAccordionBody itemList={itemList} name="generations" />
            </Wrapper>
        );
        const selectAll = screen.getByLabelText("Select All");
        await user.click(selectAll);
        expect(screen.getByLabelText("Item 1")).toBeChecked();
        expect(screen.getByLabelText("Item 2")).toBeChecked();
    });

    it('unchecks all items when "Select All" is unchecked', async () => {
        const user = userEvent.setup();
        render(
            <Wrapper defaultValues={{
                all: { generations: true, sizes: false },
                generations: { "1": true, "2": true, null: true }
            }}>
                <UniformListFilterAccordionBody itemList={itemList} name="generations" />
            </Wrapper>
        );
        const selectAll = screen.getByLabelText("Select All");
        await user.click(selectAll);
        expect(screen.getByLabelText("Item 1")).not.toBeChecked();
        expect(screen.getByLabelText("Item 2")).not.toBeChecked();
    });

    it("toggles individual item and updates 'Select All' state", async () => {
        const user = userEvent.setup();
        render(
            <Wrapper defaultValues={{
                all: { generations: false, sizes: false },
                generations: { "1": false, "2": false, null: true }
            }}>
                <UniformListFilterAccordionBody itemList={itemList} name="generations" />
            </Wrapper>
        );
        expect(screen.getByLabelText("Select All")).not.toBeChecked();
        const item1 = screen.getByLabelText("Item 1");
        await user.click(item1);
        expect(item1).toBeChecked();
        expect(screen.getByLabelText("Select All")).not.toBeChecked();
        
        const item2 = screen.getByLabelText("Item 2");
        await user.click(item2);
        expect(screen.getByLabelText("Select All")).toBeChecked();
        
        await user.click(item1);
        expect(item1).not.toBeChecked();
        expect(screen.getByLabelText("Select All")).not.toBeChecked();
    });

    it("toggles 'K.A.' checkbox", async () => {
        const user = userEvent.setup();
        render(
            <Wrapper defaultValues={{
                all: { generations: false, sizes: false },
                generations: { "1": false, "2": false, null: false }
            }}>
                <UniformListFilterAccordionBody itemList={itemList} name="generations" />
            </Wrapper>
        );
        const ka = screen.getByLabelText("K.A.");
        await user.click(ka);
        expect(ka).toBeChecked();
    });

    it("uses correct values for generations", async () => {
        const user = userEvent.setup();
        render(
            <Wrapper defaultValues={{
                all: { generations: true, sizes: false },
                generations: { "1": true, "2": false, null: false },
                sizes: { "1": false, "2": false, null: false }
            }}>
                <UniformListFilterAccordionBody itemList={itemList} name="generations" />
            </Wrapper>
        );
        // Only generations values should be reflected
        expect(screen.getByLabelText("Select All")).toBeChecked();
        expect(screen.getByLabelText("Item 1")).toBeChecked();
        expect(screen.getByLabelText("Item 2")).not.toBeChecked();
        expect(screen.getByLabelText("K.A.")).not.toBeChecked();

        // Changing a size value should not affect generations
        // (simulate by clicking, but only generations are rendered)
        await user.click(screen.getByLabelText("Item 2"));
        expect(screen.getByLabelText("Item 2")).toBeChecked();
    });

    it("uses correct values for sizes", async () => {
        const user = userEvent.setup();
        render(
            <Wrapper defaultValues={{
                all: { generations: false, sizes: true },
                generations: { "1": false, "2": false, null: false },
                sizes: { "1": true, "2": false, null: true }
            }}>
                <UniformListFilterAccordionBody itemList={itemList} name="sizes" />
            </Wrapper>
        );
        // Only sizes values should be reflected
        expect(screen.getByLabelText("Select All")).toBeChecked();
        expect(screen.getByLabelText("Item 1")).toBeChecked();
        expect(screen.getByLabelText("Item 2")).not.toBeChecked();
        expect(screen.getByLabelText("K.A.")).toBeChecked();

        // Changing a generations value should not affect sizes
        // (simulate by clicking, but only sizes are rendered)
        await user.click(screen.getByLabelText("Item 2"));
        expect(screen.getByLabelText("Item 2")).toBeChecked();
    });
});
