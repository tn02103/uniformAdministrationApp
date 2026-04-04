"use client";

import { NewPasswordFormComponent } from "@/components/authentication/NewPasswordFormComponent";
import { Form } from "@/components/fields/Form";
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

/**
 * Client-side form for completing a password-reset flow.
 *
 * Receives a one-time `token` (embedded in the reset link) and the current
 * `locale` (used to construct the post-success login link). On submit it calls
 * `executePasswordReset`; depending on the result it either transitions to a
 * success view with a link to the login page, or shows an inline error alert
 * (`tokenInvalid`, `tooManyRequests`, or `unknown`).
 *
 * @param token  - The password-reset token extracted from the URL search params.
 * @param locale - BCP-47 locale string used to build the `/{locale}/login` href.
 */
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
            <NewPasswordFormComponent />
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
