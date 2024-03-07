"use client"
import { useRouter } from "next/navigation";
import { Modal } from "react-bootstrap";

export default function PageInterceptionModal({
    children
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    function handleHide() {
        router.back();
    }

    return (
        <Modal show onHide={handleHide}>
            {children}
        </Modal>
    )
}