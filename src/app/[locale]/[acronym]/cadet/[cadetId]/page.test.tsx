import { render, screen } from "@testing-library/react";
import { AuthRole } from "@/lib/AuthRoles";
import CadetDetailPage from "./page";
import CadetDropDown from "./cadetDropDown";
import { getCadetData } from "@/actions/cadet/data";
import { getCadetMaterialMap } from "@/actions/controllers/CadetMaterialController";
import { getCadetUniformMap } from "@/dal/cadet/uniformMap";
import { getReturnProcessConfig } from "@/dal/assosiation";
import { getMaterialConfiguration } from "@/dal/material/type/_index";
import { getIronSession } from "@/lib/ironSession";

vi.mock("@/actions/cadet/data", () => ({
    getCadetData: vi.fn(),
}));

vi.mock("@/actions/controllers/CadetMaterialController", () => ({
    getCadetMaterialMap: vi.fn(),
}));

vi.mock("@/dal/cadet/uniformMap", () => ({
    getCadetUniformMap: vi.fn(),
}));

vi.mock("@/dal/assosiation", () => ({
    getReturnProcessConfig: vi.fn(),
}));

vi.mock("@/dal/material/type/_index", () => ({
    getMaterialConfiguration: vi.fn(),
}));

vi.mock("@/lib/ironSession", () => ({
    getIronSession: vi.fn(),
}));

vi.mock("./_cadetDataTable/table", () => ({
    default: vi.fn(() => <div data-testid="cadet-data-table" />),
}));

vi.mock("./_inspectionTable/CadetInspectionCard", () => ({
    CadetInspectionCard: vi.fn(() => <div data-testid="cadet-inspection-card" />),
}));

vi.mock("./_extendedInformation", () => ({
    ExtendedInformationDiv: vi.fn(() => <div data-testid="extended-information" />),
}));

vi.mock("./_materialTable/CadetMaterialTable", () => ({
    CadetMaterialTable: vi.fn(() => <div data-testid="cadet-material-table" />),
}));

vi.mock("./_uniformTable/CadetUniformTable", () => ({
    CadetUniformTable: vi.fn(() => <div data-testid="cadet-uniform-table" />),
}));

vi.mock("./cadetDropDown", () => ({
    default: vi.fn(() => <div data-testid="cadet-dropdown" />),
}));

describe("CadetDetailPage return config fail-closed wiring", () => {
    const cadetId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(getIronSession).mockResolvedValue({
            user: { role: AuthRole.inspector },
        } as never);

        vi.mocked(getCadetData).mockResolvedValue({
            firstname: "Max",
            lastname: "Mustermann",
            status: "ACTIVE",
        } as never);

        vi.mocked(getCadetUniformMap).mockResolvedValue({} as never);
        vi.mocked(getCadetMaterialMap).mockResolvedValue({} as never);
        vi.mocked(getMaterialConfiguration).mockResolvedValue({} as never);
        vi.mocked(getReturnProcessConfig).mockResolvedValue({
            returnProcessEnabled: true,
            anonymizationMode: "ON_COMPLETE",
            templates: [],
        } as never);
    });

    it("passes load-failed flag and null config to dropdown when return config request fails", async () => {
        vi.mocked(getReturnProcessConfig).mockRejectedValueOnce(new Error("config unavailable"));

        render(await CadetDetailPage({ params: Promise.resolve({ cadetId, locale: "de" }) }));

        expect(screen.getByTestId("cadet-dropdown")).toBeInTheDocument();
        expect(vi.mocked(CadetDropDown)).toHaveBeenCalledWith(
            expect.objectContaining({
                returnConfig: null,
                returnConfigLoadFailed: true,
                firstname: "Max",
                lastname: "Mustermann",
            }),
            undefined
        );
    });

    it("passes loaded config and no-failure flag to dropdown when return config resolves", async () => {
        render(await CadetDetailPage({ params: Promise.resolve({ cadetId, locale: "de" }) }));

        expect(vi.mocked(CadetDropDown)).toHaveBeenCalledWith(
            expect.objectContaining({
                returnConfig: {
                    returnProcessEnabled: true,
                    anonymizationMode: "ON_COMPLETE",
                    templates: [],
                },
                returnConfigLoadFailed: false,
            }),
            undefined
        );
    });
});
