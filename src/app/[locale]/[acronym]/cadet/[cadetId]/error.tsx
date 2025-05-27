"use client"
import { useI18n } from "@/lib/locales/client";
import { useEffect } from "react"
import { Col } from "react-bootstrap";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const t = useI18n();
    useEffect(() => {
        console.error("Error2", error);
    }, [error]);

    return (
        <div data-testid="div_personalData" className="container border border-2 rounded">
            <div className="fs-5 fw-bold p-0 row">
                <Col data-testid="div_header" xs={7} className="text-center p-0">
                    {t('cadetDetailPage.header.cadetTable')}
                </Col>
            </div>
            <div className="bg-white border-top border-1 border-dark p-2 row">
                <h2>Something went wrong!</h2>
                <button onClick={() => reset()}>Try again</button>
            </div>
        </div>
    )
}