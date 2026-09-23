import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { useModal } from "@/components/modals/modalProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { CadetStatus } from "@/prisma/browser";
import { resignMemberDirectly } from "@/dal";
import { useParams } from "next/navigation";
import CadetDropDown from "./cadetDropDown";

vi.mock("@/dal", () => ({
    resignMemberDirectly: vi.fn(),
}));

vi.mock("./_returnUniform/CadetReturnUniformModal", () => ({
    default: vi.fn(() => <div data-testid="return-uniform-modal" />),
}));

describe("CadetDropDown fail-closed return config behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ cadetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
        vi.mocked(resignMemberDirectly).mockResolvedValue(undefined);
    });

    it("shows an error and blocks return action when return config failed to load", async () => {
        const user = userEvent.setup();
        const modalApi = vi.mocked(useModal)();

        render(
            <CadetDropDown
                resignationConfig={null}
                resignationConfigLoadFailed
                cadetStatus={CadetStatus.ACTIVE}
                userRole={AuthRole.inspector}
            />
        );

        await user.click(screen.getByTestId("btn_cadet_menu"));
        await user.click(screen.getByTestId("btn_cadet_menu_memberExit"));

        expect(toast.error).toHaveBeenCalledWith("cadetDetailPage.memberExit.directReturn.error");
        expect(modalApi.simpleWarningModal).not.toHaveBeenCalled();
        expect(resignMemberDirectly).not.toHaveBeenCalled();
        expect(screen.queryByTestId("member_exit_modal")).not.toBeInTheDocument();
    });

    it("opens the return modal when resignationConfig has resignationProcessEnabled=false", async () => {
        const user = userEvent.setup();

        render(
            <CadetDropDown
                resignationConfig={{
                    resignationProcessEnabled: false,
                    anonymizationMode: "MANUAL",
                    templates: [],
                }}
                resignationConfigLoadFailed={false}
                cadetStatus={CadetStatus.ACTIVE}
                userRole={AuthRole.inspector}
            />
        );

        await user.click(screen.getByTestId("btn_cadet_menu"));
        await user.click(screen.getByTestId("btn_cadet_menu_memberExit"));

        expect(screen.getByTestId("member_exit_modal")).toBeInTheDocument();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it("opens the member-exit-modal when resignationConfig has resignationProcessEnabled=true", async () => {
        const user = userEvent.setup();

        render(
            <CadetDropDown
                resignationConfig={{
                    resignationProcessEnabled: true,
                    anonymizationMode: "MANUAL",
                    templates: [],
                }}
                resignationConfigLoadFailed={false}
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
