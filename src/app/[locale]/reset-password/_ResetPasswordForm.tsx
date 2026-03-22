"use client";

import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { executePasswordReset } from "@/dal/auth";
import { useScopedI18n } from "@/lib/locales/client";
import { ResetPasswordFormSchema, ResetPasswordFormType } from "@/zod/auth";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import { Button, Col, Row } from "react-bootstrap";


type PropType = {
    token: string;
    locale: string;
};

type ResetError = "tokenInvalid" | "tooManyRequests" | "unknown";

const ResetPasswordForm = ({ token, locale }: PropType) => {
    const t = useScopedI18n("resetPassword");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<ResetError | null>(null);

    async function onSubmit(data: ResetPasswordFormType) {
        setSubmitting(true);
        setError(null);
        try {
            const result = await executePasswordReset({
                token: data.token,
                newPassword: data.newPassword,
            });
            if (result.success) {
                setSuccess(true);
            } else {
                setError((result.error as ResetError) ?? "unknown");
            }
        } catch {
            setError("unknown");
        } finally {
            setSubmitting(false);
        }
    }

    if (success) {
        return (
            <div data-testid="success-message">
                <p className="text-success">{t("success")}</p>
                <Link href={`/${locale}/login`} className="btn btn-primary">
                    {t("label.login")}
                </Link>
            </div>
        );
    }

    const errorKey = error ? `error.${error}` : null;

    return (
        <Form<ResetPasswordFormType>
            onSubmit={onSubmit}
            zodSchema={ResetPasswordFormSchema}
            defaultValues={{ token }}
        >
            {errorKey && (
                <div className="alert alert-danger" role="alert" data-testid="error-message">
                    {t(errorKey as Parameters<typeof t>[0])}
                </div>
            )}
            <div className="mb-3">
                <InputFormField
                    name="newPassword"
                    label={t("label.newPassword")}
                    type="password"
                    autoComplete="new-password"
                />
            </div>
            <div className="mb-3">
                <InputFormField
                    name="confirmPassword"
                    label={t("label.confirmPassword")}
                    type="password"
                    autoComplete="new-password"
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

export default ResetPasswordForm;
