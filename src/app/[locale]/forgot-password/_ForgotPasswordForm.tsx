"use client";

import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { requestPasswordReset } from "@/dal/auth";
import { useScopedI18n } from "@/lib/locales/client";
import { ForgotPasswordSchema, ForgotPasswordType } from "@/zod/auth";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Organisation } from "@/prisma/client";
import { useState } from "react";
import { Button, Col, Row } from "react-bootstrap";


type PropType = {
    organisations: Organisation[];
};

const ForgotPasswordForm = ({ organisations }: PropType) => {
    const t = useScopedI18n("forgotPassword");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<"unknown" | "tooManyRequests" | null>(null);

    async function onSubmit(data: ForgotPasswordType) {
        setSubmitting(true);
        setError(null);
        try {
            const result = await requestPasswordReset(data);
            if (!result.success) {
                setError(('error' in result && result.error === "tooManyRequests") ? "tooManyRequests" : "unknown");
                return;
            }
            setSubmitted(true);
        } catch {
            setError("unknown");
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <p className="text-success" data-testid="success-message">
                {t("success")}
            </p>
        );
    }

    return (
        <Form<ForgotPasswordType> onSubmit={onSubmit} zodSchema={ForgotPasswordSchema}>
            {error && (
                <div className="alert alert-danger" role="alert" data-testid="error-message">
                    {error === "tooManyRequests" ? t("error.tooManyRequests") : t("error.unknown")}
                </div>
            )}
            <div className="mb-3">
                <SelectFormField
                    name="organisationId"
                    label={t("label.organisation")}
                    options={organisations.map((o) => ({ value: o.id, label: o.name }))}
                />
            </div>
            <div className="mb-3">
                <InputFormField
                    name="email"
                    label={t("label.email")}
                    type="email"
                />
            </div>
            <Row>
                <Col>
                    <Button variant="primary" type="submit" disabled={submitting} data-testid="btn_submit">
                        {submitting ? (
                            <FontAwesomeIcon icon={faSpinner} className="mx-3 fa-spin-pulse" />
                        ) : (
                            t("label.submit")
                        )}
                    </Button>
                </Col>
            </Row>
        </Form>
    );
};

export default ForgotPasswordForm;
