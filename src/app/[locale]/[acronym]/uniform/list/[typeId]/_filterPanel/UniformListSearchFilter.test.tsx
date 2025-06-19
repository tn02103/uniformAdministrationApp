import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { UniformListSearchFilter } from "./UniformListSearchFilter";

// Mock i18n
jest.mock("@/lib/locales/client", () => ({
    useI18n: () => (key: string) => key,
}));

// Mock useUniformTypeList
const mockTypeList = [
    { id: "1", acronym: "AA", name: "Typ1" },
    { id: "2", acronym: "BB", name: "Typ2" }
];
jest.mock("@/dataFetcher/uniformAdmin", () => ({
    useUniformTypeList: () => ({ typeList: mockTypeList }),
}));

function Wrapper({ children, defaultValues }: { children: React.ReactNode, defaultValues?: { search: string } }) {
    const methods = useForm({ defaultValues });
    return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("SearchFilter", () => {
    it("renders input, helptext and button", () => {
        render(
            <Wrapper>
                <UniformListSearchFilter search={jest.fn()} />
            </Wrapper>
        );
        expect(screen.getByText("uniformList.search.label")).toBeInTheDocument();
        expect(screen.getByTestId("div_search_helptext")).toBeInTheDocument();
        expect(screen.getByRole("textbox")).toBeInTheDocument();
        expect(screen.getByTestId("btn_search_submit")).toBeInTheDocument();
    });

    it("shows helptext for empty input", () => {
        render(
            <Wrapper>
                <UniformListSearchFilter search={jest.fn()} />
            </Wrapper>
        );
        expect(screen.getByTestId("div_search_helptext")).toBeInTheDocument();
    });

    it("shows error for invalid input", async () => {
        render(
            <Wrapper>
                <UniformListSearchFilter search={jest.fn()} />
            </Wrapper>
        );
        const user = userEvent.setup();
        await user.type(screen.getByRole("textbox"), "XX-abc");
        expect(await screen.findByTestId("err_search_invalidInput")).toBeInTheDocument();
    });

    it("shows parsed type and number in helptext for valid input", async () => {
        render(
            <Wrapper>
                <UniformListSearchFilter search={jest.fn()} />
            </Wrapper>
        );
        const user = userEvent.setup();
        await user.type(screen.getByRole("textbox"), "AA-1234");
        expect(await screen.findByTestId("div_search_helptext")).toHaveTextContent("Typ1 - 1234");
    });

    it("shows only number in helptext for numeric input", async () => {
        render(
            <Wrapper>
                <UniformListSearchFilter search={jest.fn()} />
            </Wrapper>
        );
        const user = userEvent.setup();
        await user.type(screen.getByRole("textbox"), "5678");
        expect(await screen.findByTestId("div_search_helptext")).toHaveTextContent("5678");
    });

    it("calls search with correct values for type+number", async () => {
        const searchMock = jest.fn();
        render(
            <Wrapper>
                <UniformListSearchFilter search={searchMock} />
            </Wrapper>
        );
        const user = userEvent.setup();
        await user.type(screen.getByRole("textbox"), "AA-1234");
        await user.click(screen.getByTestId("btn_search_submit"));
        expect(searchMock).toHaveBeenCalledWith({ typeId: "1", number: 1234 });
    });

    it("calls search with correct values for only number", async () => {
        const searchMock = jest.fn();
        render(
            <Wrapper>
                <UniformListSearchFilter search={searchMock} />
            </Wrapper>
        );
        const user = userEvent.setup();
        await user.type(screen.getByRole("textbox"), "5678");
        await user.click(screen.getByTestId("btn_search_submit"));
        expect(searchMock).toHaveBeenCalledWith({ typeId: undefined, number: 5678 });
    });

    it("does not call search for invalid input", async () => {
        const searchMock = jest.fn();
        render(
            <Wrapper>
                <UniformListSearchFilter search={searchMock} />
            </Wrapper>
        );
        const user = userEvent.setup();
        await user.type(screen.getByRole("textbox"), "AA-abc");
        await user.click(screen.getByTestId("btn_search_submit"));
        expect(searchMock).not.toHaveBeenCalled();
    });
});
