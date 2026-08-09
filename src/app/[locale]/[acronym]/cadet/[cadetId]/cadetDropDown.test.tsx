import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { useModal } from "@/components/modals/modalProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { CadetStatus } from "@/prisma/browser";
import { returnCadetDirectly } from "@/dal/cadet";
import { useParams } from "next/navigation";
import CadetDropDown from "./cadetDropDown";

vi.mock("@/dal/cadet", () => ({
    returnCadetDirectly: vi.fn(),
}));

vi.mock("./_returnUniform/CadetReturnUniformModal", () => ({
    default: vi.fn(() => <div data-testid="return-uniform-modal" />),
}));

describe("CadetDropDown fail-closed return config behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ cadetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
        vi.mocked(returnCadetDirectly).mockResolvedValue(undefined);
    });

    it("shows an error and blocks return action when return config failed to load", async () => {
        const user = userEvent.setup();
        const modalApi = vi.mocked(useModal)();

        render(
            <CadetDropDown
                returnConfig={null}
                returnConfigLoadFailed
                cadetStatus={CadetStatus.ACTIVE}
                userRole={AuthRole.inspector}
            />
        );

        await user.click(screen.getByTestId("btn_cadet_menu"));
        await user.click(screen.getByTestId("btn_cadet_menu_memberExit"));

        expect(toast.error).toHaveBeenCalledWith("cadetDetailPage.memberExit.directReturn.error");
        expect(modalApi.simpleWarningModal).not.toHaveBeenCalled();
        expect(returnCadetDirectly).not.toHaveBeenCalled();
        expect(screen.queryByTestId("member_exit_modal")).not.toBeInTheDocument();
    });

    it("opens the return modal when returnConfig has returnProcessEnabled=false", async () => {
        const user = userEvent.setup();

        render(
            <CadetDropDown
                returnConfig={{
                    returnProcessEnabled: false,
                    anonymizationMode: "MANUAL",
                    templates: [],
                }}
                returnConfigLoadFailed={false}
                cadetStatus={CadetStatus.ACTIVE}
                userRole={AuthRole.inspector}
            />
        );

        await user.click(screen.getByTestId("btn_cadet_menu"));
        await user.click(screen.getByTestId("btn_cadet_menu_memberExit"));

        expect(screen.getByTestId("member_exit_modal")).toBeInTheDocument();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it("opens the member-exit-modal when returnConfig has returnProcessEnabled=true", async () => {
        const user = userEvent.setup();

        render(
            <CadetDropDown
                returnConfig={{
                    returnProcessEnabled: true,
                    anonymizationMode: "MANUAL",
                    templates: [],
                }}
                returnConfigLoadFailed={false}
                cadetStatus={CadetStatus.ACTIVE}
                userRole={AuthRole.inspector}
            />
        );

        await user.click(screen.getByTestId("btn_cadet_menu"));
        await user.click(screen.getByTestId("btn_cadet_menu_memberExit"));

        expect(screen.getByTestId("member_exit_modal")).toBeInTheDocument();
        expect(toast.error).not.toHaveBeenCalled();
    });
});
