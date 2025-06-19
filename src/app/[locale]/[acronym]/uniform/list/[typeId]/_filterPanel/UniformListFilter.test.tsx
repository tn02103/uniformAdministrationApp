import { UniformSize, UniformType } from "@/types/globalUniformTypes";
import { getByLabelText, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockSizeLists, mockTypeList } from "../../../../../../../../tests/_jestConfig/staticMockData";
import { UniformListFilter } from "./UniformListFilter";


// Mock i18n
jest.mock("@/lib/locales/client", () => ({
    useI18n: () => (key: string) => key,
}));

// Mock useSessionStorage
const setFilterMock = jest.fn();
jest.mock("usehooks-ts", () => ({
    useSessionStorage: () => [null, setFilterMock],
}));

// Use the first type and its size list from staticMockData
const uniformType: UniformType = mockTypeList[0];
const sizeList: UniformSize[] = mockSizeLists.find(
    (s) => s.id === uniformType.fk_defaultSizelist
)?.uniformSizes || [];

function renderComponent(props = {}) {
    return render(
        <UniformListFilter
            uniformType={uniformType}
            sizeList={sizeList}
            {...props}
        />
    );
}

describe("UniformListFilter", () => {
    beforeEach(() => setFilterMock.mockClear());

    it("renders filter accordions and checkboxes", () => {
        renderComponent();
        expect(screen.getByText("uniformList.filter")).toBeInTheDocument();
        expect(screen.getByTestId("div_genAccordion")).toBeInTheDocument();
        expect(screen.getByTestId("div_sizeAccordion")).toBeInTheDocument();
        expect(screen.getByTestId("div_othersAccordion")).toBeInTheDocument();

        // Check for generation and size checkboxes
        const genAccordion = screen.getByTestId("div_genAccordion");
        expect(getByLabelText(genAccordion, "uniformList.selectAll")).toBeInTheDocument();
        expect(getByLabelText(genAccordion, "K.A.")).toBeInTheDocument();
        uniformType.uniformGenerationList.forEach((gen) => {
            expect(getByLabelText(genAccordion, gen.name)).toBeInTheDocument();
        });

        const sizeAccordion = screen.getByTestId("div_sizeAccordion");
        expect(getByLabelText(sizeAccordion, "uniformList.selectAll")).toBeInTheDocument();
        expect(getByLabelText(sizeAccordion, "K.A.")).toBeInTheDocument();
        sizeList.forEach((size) => {
            expect(getByLabelText(sizeAccordion, size.name)).toBeInTheDocument();
        });

        // Check for other checkboxes
        const othersAccordion = screen.getByTestId("div_othersAccordion");
        expect(getByLabelText(othersAccordion, "common.uniform.state.active")).toBeInTheDocument();
        expect(getByLabelText(othersAccordion, "common.uniform.state.reserve")).toBeInTheDocument();
        expect(getByLabelText(othersAccordion, "uniformList.issued")).toBeInTheDocument();
        expect(getByLabelText(othersAccordion, "uniformList.notIssued")).toBeInTheDocument();
        expect(getByLabelText(othersAccordion, "uniformList.inStorageUnit")).toBeInTheDocument();
        expect(screen.getByTestId("btn_load")).toBeInTheDocument();
    });

    it("shows default checked values for generations and sizes", () => {
        renderComponent();
        uniformType.uniformGenerationList.forEach((gen) => {
            expect(screen.getByLabelText(gen.name)).toBeChecked();
        });
        sizeList.forEach((size) => {
            expect(screen.getByLabelText(size.name)).toBeChecked();
        });
        expect(screen.getAllByLabelText("K.A.")[0]).toBeChecked();
        expect(screen.getAllByLabelText("K.A.")[1]).toBeChecked();

        expect(screen.getByLabelText("common.uniform.state.active")).toBeChecked();
        expect(screen.getByLabelText("common.uniform.state.reserve")).not.toBeChecked();
        expect(screen.getByLabelText("uniformList.issued")).toBeChecked();
        expect(screen.getByLabelText("uniformList.notIssued")).toBeChecked();
        expect(screen.getByLabelText("uniformList.inStorageUnit")).toBeChecked();
    });

    it("disables submit button if activeReserveError or ownerError is true", async () => {
        renderComponent();
        // Uncheck active. isReserve is unchecked by default
        const active = screen.getByLabelText("common.uniform.state.active");
        const user = userEvent.setup();
        await user.click(active);
        expect(screen.getByTestId("btn_load")).toBeDisabled();

        // Re-check active, uncheck issued, notIssued, inStorageUnit
        await user.click(active); // check active again
        const issued = screen.getByLabelText("uniformList.issued");
        const notIssued = screen.getByLabelText("uniformList.notIssued");
        const inStorageUnit = screen.getByLabelText("uniformList.inStorageUnit");
        await user.click(issued);
        await user.click(notIssued);
        await user.click(inStorageUnit);
        expect(screen.getByTestId("btn_load")).toBeDisabled();
    });

    it("shows error messages when errors are present", async () => {
        renderComponent();
        const user = userEvent.setup();
        // Uncheck both active and isReserve to trigger activeReserveError
        await user.click(screen.getByLabelText("common.uniform.state.active"));
        expect(screen.getByTestId("err_filterError")).toHaveTextContent("uniformList.error.activ");

        // Re-check active, uncheck issued, notIssued, inStorageUnit to trigger ownerError
        await user.click(screen.getByLabelText("common.uniform.state.active"));
        await user.click(screen.getByLabelText("uniformList.issued"));
        await user.click(screen.getByLabelText("uniformList.notIssued"));
        await user.click(screen.getByLabelText("uniformList.inStorageUnit"));
        expect(screen.getByTestId("err_filterError")).toHaveTextContent("uniformList.error.owner");
    });

    it("calls setFilter with correct data on submit", async () => {
        renderComponent();
        const user = userEvent.setup();
        await user.click(screen.getByTestId("btn_load"));
        expect(setFilterMock).toHaveBeenCalledWith(expect.objectContaining({
            active: true,
            isReserve: false,
            issued: true,
            notIssued: true,
            inStorageUnit: true,
            all: expect.any(Object),
            generations: expect.any(Object),
            sizes: expect.any(Object)
        }));
    });

    it("does not render generations or sizes accordions if not used by the type", () => {
        // Type with neither generations nor sizes
        const typeNoGenNoSize = mockTypeList.find(t => !t.usingGenerations && !t.usingSizes);
        render(
            <UniformListFilter
                uniformType={typeNoGenNoSize!}
                sizeList={[]}
            />
        );
        expect(screen.queryByTestId("div_genAccordion")).not.toBeInTheDocument();
        expect(screen.queryByTestId("div_sizeAccordion")).not.toBeInTheDocument();
        expect(screen.getByTestId("div_othersAccordion")).toBeInTheDocument();
    });

    it("does not render generations accordion if only sizes are used", () => {
        const typeOnlySizes = mockTypeList.find(t => !t.usingGenerations && t.usingSizes);
        render(
            <UniformListFilter
                uniformType={typeOnlySizes!}
                sizeList={sizeList}
            />
        );
        expect(screen.queryByTestId("div_genAccordion")).not.toBeInTheDocument();
        expect(screen.getByTestId("div_sizeAccordion")).toBeInTheDocument();
    });

    it("does not render sizes accordion if only generations are used", () => {
        const typeOnlyGen = mockTypeList.find(t => t.usingGenerations && !t.usingSizes);
        render(
            <UniformListFilter
                uniformType={typeOnlyGen!}
                sizeList={[]}
            />
        );
        expect(screen.getByTestId("div_genAccordion")).toBeInTheDocument();
        expect(screen.queryByTestId("div_sizeAccordion")).not.toBeInTheDocument();
    });

    it("uses stored filter configuration from session storage if present", () => {
        const storedFilter = {
            active: false,
            isReserve: true,
            issued: false,
            notIssued: false,
            inStorageUnit: false,
            all: { generations: false, sizes: false },
            generations: { null: false },
            sizes: { null: false }
        };

        // Spy on useSessionStorage to return the stored filter for this test
        const usehooks = jest.requireMock("usehooks-ts");
        const spy = jest.spyOn(usehooks, "useSessionStorage").mockImplementation(() => [storedFilter, setFilterMock]);

        render(
            <UniformListFilter
                uniformType={uniformType}
                sizeList={sizeList}
            />
        );
        expect(screen.getByLabelText("common.uniform.state.active")).not.toBeChecked();
        expect(screen.getByLabelText("common.uniform.state.reserve")).toBeChecked();
        expect(screen.getByLabelText("uniformList.issued")).not.toBeChecked();
        expect(screen.getByLabelText("uniformList.notIssued")).not.toBeChecked();
        expect(screen.getByLabelText("uniformList.inStorageUnit")).not.toBeChecked();
        expect(screen.getAllByLabelText("K.A.")[0]).not.toBeChecked();
        expect(screen.getAllByLabelText("K.A.")[1]).not.toBeChecked();

        spy.mockRestore();
    });
});
