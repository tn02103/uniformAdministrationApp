import { updateAssosiationAnonymizationConfig } from "@/dal/assosiation";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AnonymizationConfigSection } from "./AnonymizationConfigSection";

vi.mock("@/dal/assosiation", () => ({
    updateAssosiationAnonymizationConfig: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

const defaultConfig = {
    anonymizationMode: "MANUAL" as const,
    anonymizationDelayDays: null,
};

describe("<AnonymizationConfigSection />", () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.mocked(updateAssosiationAnonymizationConfig).mockResolvedValue({
            returnProcessEnabled: true,
            anonymizationMode: "MANUAL",
            anonymizationDelayDays: 0,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders the mode select and save button", () => {
        render(<AnonymizationConfigSection initialConfig={defaultConfig} />);
        expect(screen.getByRole("combobox", { name: /admin.settings.anonymization.anonymizationMode/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /common.actions.save/i })).toBeInTheDocument();
    });

    it("save button is disabled when form is not dirty", () => {
        render(<AnonymizationConfigSection initialConfig={defaultConfig} />);
        expect(screen.getByRole("button", { name: /common.actions.save/i })).toBeDisabled();
    });

    it("save button is enabled after changing anonymizationMode", async () => {
        render(<AnonymizationConfigSection initialConfig={defaultConfig} />);
        await user.selectOptions(
            screen.getByRole("combobox", { name: /admin.settings.anonymization.anonymizationMode/i }),
            "IMMEDIATELY"
        );
        expect(screen.getByRole("button", { name: /common.actions.save/i })).toBeEnabled();
    });

    it("does not show delay-days input when mode is MANUAL", () => {
        render(<AnonymizationConfigSection initialConfig={defaultConfig} />);
        expect(screen.queryByLabelText(/admin.settings.anonymization.anonymizationDelayDays/i)).not.toBeInTheDocument();
    });

    it("shows delay-days input when mode is AFTER_DAYS", async () => {
        render(<AnonymizationConfigSection initialConfig={{ anonymizationMode: "AFTER_DAYS", anonymizationDelayDays: 3 }} />);
        expect(screen.getByLabelText(/admin.settings.anonymization.anonymizationDelayDays/i)).toBeInTheDocument();
    });

    it("shows delay-days input after switching to AFTER_DAYS", async () => {
        render(<AnonymizationConfigSection initialConfig={defaultConfig} />);
        await user.selectOptions(
            screen.getByRole("combobox", { name: /admin.settings.anonymization.anonymizationMode/i }),
            "AFTER_DAYS"
        );
        expect(screen.getByLabelText(/admin.settings.anonymization.anonymizationDelayDays/i)).toBeInTheDocument();
    });

    it("hides delay-days input after switching away from AFTER_DAYS", async () => {
        render(<AnonymizationConfigSection initialConfig={{ anonymizationMode: "AFTER_DAYS", anonymizationDelayDays: 3 }} />);
        await user.selectOptions(
            screen.getByRole("combobox", { name: /admin.settings.anonymization.anonymizationMode/i }),
            "MANUAL"
        );
        expect(screen.queryByLabelText(/admin.settings.anonymization.anonymizationDelayDays/i)).not.toBeInTheDocument();
    });

    it("calls updateAssosiationAnonymizationConfig with correct args on submit", async () => {
        render(<AnonymizationConfigSection initialConfig={defaultConfig} />);
        await user.selectOptions(
            screen.getByRole("combobox", { name: /admin.settings.anonymization.anonymizationMode/i }),
            "IMMEDIATELY"
        );
        await user.click(screen.getByRole("button", { name: /common.actions.save/i }));
        expect(updateAssosiationAnonymizationConfig).toHaveBeenCalledWith({
            anonymizationMode: "IMMEDIATELY",
            anonymizationDelayDays: undefined,
        });
    });

    it("shows success toast and disables save button after successful submit", async () => {
        const { toast } = await import("react-toastify");
        render(<AnonymizationConfigSection initialConfig={defaultConfig} />);
        await user.selectOptions(
            screen.getByRole("combobox", { name: /admin.settings.anonymization.anonymizationMode/i }),
            "IMMEDIATELY"
        );
        await user.click(screen.getByRole("button", { name: /common.actions.save/i }));
        expect(toast.success).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("button", { name: /common.actions.save/i })).toBeDisabled();
    });

    it("shows error toast when submit fails", async () => {
        vi.mocked(updateAssosiationAnonymizationConfig).mockRejectedValue(new Error("fail"));
        const { toast } = await import("react-toastify");
        render(<AnonymizationConfigSection initialConfig={defaultConfig} />);
        await user.selectOptions(
            screen.getByRole("combobox", { name: /admin.settings.anonymization.anonymizationMode/i }),
            "IMMEDIATELY"
        );
        await user.click(screen.getByRole("button", { name: /common.actions.save/i }));
        expect(toast.error).toHaveBeenCalledTimes(1);
    });
});
