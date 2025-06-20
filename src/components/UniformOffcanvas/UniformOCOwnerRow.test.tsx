import { render, screen } from "@testing-library/react";
import { UniformOCOwnerRow } from "./UniformOCOwnerRow";
import { mockUniform } from "./UniformOffcanvasJestHelper";

// Mock next/navigation
let pathnameValue = "/de/app/uniform/list/81ff8e9b-a097-4879-a0b2-352e54d41e6c";
jest.mock("next/navigation", () => ({
    usePathname: () => pathnameValue,
}));

describe("UniformOCOwnerRow", () => {
    beforeEach(() => {
        pathnameValue = "/de/app/uniform/list/81ff8e9b-a097-4879-a0b2-352e54d41e6c";
    });

    it("renders owner label, issuedTo, and issuedDate", () => {
        render(<UniformOCOwnerRow uniform={mockUniform} />);
        expect(screen.getByText("uniformOffcanvas.owner.label")).toBeInTheDocument();
        expect(screen.getByText("uniformOffcanvas.owner.issuedTo:")).toBeInTheDocument();
        expect(screen.getByText("uniformOffcanvas.owner.issuedDate:")).toBeInTheDocument();
        expect(screen.getByText("01.10.2023")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders cadet as link if not in cadet overview", () => {
        render(<UniformOCOwnerRow uniform={mockUniform} />);
        const link = screen.getByRole("link", { name: "John Doe" });
        expect(link).toHaveAttribute("href", "/app/cadet/cadet1");
    });

    it("renders cadet as plain text if in cadet overview", () => {
        pathnameValue = "/de/app/cadet/d1a0bd34-3773-472e-9965-b9a486bc3151";
        render(<UniformOCOwnerRow uniform={mockUniform} />);
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "John Doe" })).not.toBeInTheDocument();
    });

    it("formats issued date correctly", () => {
        render(<UniformOCOwnerRow uniform={mockUniform} />);
        expect(screen.getByText("01.10.2023")).toBeInTheDocument();
    });
});
