"use client";

import { NewPasswordFormComponent } from "@/components/authentication/NewPasswordFormComponent";
import { Form } from "@/components/fields/Form";
import { userForcedChangePassword } from "@/dal/auth";
import { useScopedI18n } from "@/lib/locales/client";
import { ForcedChangePasswordFormSchema, ForcedChangePasswordFormType } from "@/zod/auth";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Col, Row } from "react-bootstrap";

type PropType = {
    locale: string;
};

type ChangePasswordError = "tooManyRequests" | "unknown";

/**
 * Client-side form for the forced password change flow.
 *
 * Renders `newPassword` and `confirmPassword` fields via `NewPasswordFormComponent`.
 * On success redirects to `/{locale}/app`. On failure shows an inline error alert.
 *
 * @param locale - BCP-47 locale string used to build the post-success redirect URL.
 */
const ChangePasswordForm = ({ locale }: PropType) => {
    const t = useScopedI18n("forcedPasswordChange");
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<ChangePasswordError | null>(null);

    async function onSubmit(data: ForcedChangePasswordFormType) {
        setSubmitting(true);
        setError(null);
        try {
            const result = await userForcedChangePassword({ newPassword: data.newPassword });
            if (!result) {
                router.push(`/${locale}/app`);
            } else {
                const typedResult = result as { error?: { tooManyRequests?: boolean } };
                if (typedResult?.error?.tooManyRequests) {
                    setError("tooManyRequests");
                } else {
                    setError("unknown");
                }
            }
        } catch {
            setError("unknown");
        } finally {
            setSubmitting(false);
        }
    }

    const errorKey = error ? `error.${error}` : null;

    return (
        <Form<ForcedChangePasswordFormType>
            onSubmit={onSubmit}
            zodSchema={ForcedChangePasswordFormSchema}
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

export default ChangePasswordForm;
