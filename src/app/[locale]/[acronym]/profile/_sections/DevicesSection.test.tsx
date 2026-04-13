import React from "react";
import { render, screen } from "@testing-library/react";
import { DevicesSection } from "./DevicesSection";
import type { OwnProfileData } from "@/dataFetcher/profile";

type Device = OwnProfileData["devices"][number];

const makeDevice = (overrides: Partial<Device> = {}): Device => ({
    id: "device-1",
    name: "My Laptop",
    createdAt: new Date("2024-06-01"),
    lastUsedAt: new Date("2024-11-20"),
    valid: true,
    ...overrides,
});

describe("DevicesSection", () => {
    describe("rendering with devices", () => {
        it("renders the section with data-testid", () => {
            render(<DevicesSection devices={[makeDevice()]} />);
            expect(screen.getByTestId("section-devices")).toBeInTheDocument();
        });

        it("renders a device name", () => {
            render(<DevicesSection devices={[makeDevice({ name: "Work Desktop" })]} />);
            expect(screen.getByText("Work Desktop")).toBeInTheDocument();
        });

        it("renders multiple devices", () => {
            const devices = [
                makeDevice({ id: "d-1", name: "Laptop" }),
                makeDevice({ id: "d-2", name: "Phone" }),
            ];
            render(<DevicesSection devices={devices} />);
            expect(screen.getByText("Laptop")).toBeInTheDocument();
            expect(screen.getByText("Phone")).toBeInTheDocument();
        });

        it("renders createdAt date for a device", () => {
            render(<DevicesSection devices={[makeDevice({ createdAt: new Date("2024-06-01") })]} />);
            expect(screen.getByText(new RegExp(new Date("2024-06-01").toLocaleDateString()))).toBeInTheDocument();
        });

        it("renders lastUsedAt date when provided", () => {
            render(<DevicesSection devices={[makeDevice({ lastUsedAt: new Date("2024-11-20") })]} />);
            expect(screen.getByText(new RegExp(new Date("2024-11-20").toLocaleDateString()))).toBeInTheDocument();
        });

        it("renders inactive badge for invalid device", () => {
            render(<DevicesSection devices={[makeDevice({ valid: false })]} />);
            expect(screen.getByText("profile.devices.inactive")).toBeInTheDocument();
        });

        it("does not render inactive badge for valid device", () => {
            render(<DevicesSection devices={[makeDevice({ valid: true })]} />);
            expect(screen.queryByText("profile.devices.inactive")).toBeNull();
        });
    });

    describe("empty state", () => {
        it("renders the no-devices message when devices list is empty", () => {
            render(<DevicesSection devices={[]} />);
            expect(screen.getByText("profile.devices.noDevices")).toBeInTheDocument();
        });

        it("does not render a list when devices is empty", () => {
            render(<DevicesSection devices={[]} />);
            expect(screen.queryByRole("list")).toBeNull();
        });
    });

    describe("logoutAll button", () => {
        it("renders the logoutAll button", () => {
            render(<DevicesSection devices={[makeDevice()]} />);
            expect(
                screen.getByRole("button", { name: "profile.devices.logoutAll" })
            ).toBeInTheDocument();
        });

        it("logoutAll button is disabled", () => {
            render(<DevicesSection devices={[makeDevice()]} />);
            expect(
                screen.getByRole("button", { name: "profile.devices.logoutAll" })
            ).toBeDisabled();
        });
    });
});
