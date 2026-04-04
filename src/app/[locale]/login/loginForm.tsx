/* eslint-disable no-console */
"use client";

import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { userLogin } from "@/dal/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCurrentLocale, useI18n } from "@/lib/locales/client";
import { LoginFormSchema, LoginFormType } from "@/zod/auth";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Organisation } from "@/prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { UseFormReturn } from "react-hook-form";
import { toast } from "react-toastify";
import { LoginFormAlert } from "./LoginFormAlert";

type PropType = {
    organisations: Organisation[];
    lastUsedOrganisationId?: string;
    tryRefreshToken?: boolean;
}

const LoginForm = ({ organisations, lastUsedOrganisationId, ...props }: PropType) => {
    const t = useI18n();
    const locale = useCurrentLocale();
    const { onLoginSuccess } = useAuth();

    const [tryRefreshToken, setTryRefreshToken] = useState(props.tryRefreshToken);
    const [loginState, setLoginState] = useState<"error" | "success" | "userBlocked" | "tooManyRequests" | "null" | "submitting">("null");
    const [step, setStep] = useState(0);

    async function onSubmit(data: LoginFormType, form: UseFormReturn<LoginFormType>) {
        setLoginState("submitting");

        userLogin({
            organisationId: data.organisationId,
            identifier: data.identifier.trim(),
            password: data.password,
            secondFactor: data.secondFactor ?? undefined
        }).then((response) => {
            console.log("loginForm response" + JSON.stringify(response));
            if (response.loginSuccessful) {
                setLoginState("success");

                // Use AuthProvider's login success handler
                onLoginSuccess();
            } else {
                switch (response.exceptionType) {
                    case "TwoFactorRequired":
                        setLoginState("null");
                        setStep(1);
                        form.setValue("secondFactor.token", "");
                        form.setValue("secondFactor.method", response.method as string);
                        break;
                    case "UnknownError":
                        setLoginState("null");
                        toast.error(t('login.error.unknown'));
                        break;
                    case "User Blocked":
                        setLoginState("userBlocked");
                        break;
                    case "TooManyRequests":
                        setLoginState("tooManyRequests");
                        break;
                    case "AuthenticationFailed":
                        setLoginState("error");
                        break;
                }
            }
        })
    }

    useEffect(() => {
        if (tryRefreshToken) {
            console.debug("🚀 ~ LoginForm ~ Trying to refresh access token using refresh token");
            fetch('/api/auth/refresh', { method: 'POST' }).then((result) => {
                if (result.ok) {
                    // Use AuthProvider's login success - find the user's organization
                    // We don't have the organization acronym here, so we redirect to a default
                    console.debug("🚀 ~ LoginForm ~ Token refreshed successfully, calling onLoginSuccess");
                    onLoginSuccess();
                } else {
                    setTryRefreshToken(false);
                }
            }).catch(() => {
                setTryRefreshToken(false);
            });
        }
    }, [tryRefreshToken, organisations, onLoginSuccess]);

    if (tryRefreshToken)
        return null;

    return (
        <Form<LoginFormType> onSubmit={onSubmit} zodSchema={LoginFormSchema} defaultValues={{ organisationId: lastUsedOrganisationId }} >
            <LoginFormAlert loginState={loginState} />
            {step === 0 &&
                <div>
                    <div className="mb-3">
                        <SelectFormField
                            name="organisationId"
                            label={t('login.label.organisation')}
                            options={organisations.map(o => ({ value: o.id, label: o.name }))}
                        />
                    </div>
                    <div className="mb-3">
                        <InputFormField
                            name="identifier"
                            label={t('login.label.identifier')}
                        />
                    </div>
                    <div className="mb-3">
                        <InputFormField
                            name="password"
                            label={t('login.label.password')}
                            type="password"
                            autoComplete={"off"}
                        />
                    </div>
                </div>
            }
            {step === 1 &&
                <div>
                    <InputFormField<LoginFormType> name="secondFactor.token" label={t('login.label.twoFactorCode')} />
                </div>
            }
            <Row>
                <Col>
                    <Button variant="primary" type="submit" disabled={loginState === "submitting"} data-testid="btn_login">
                        {(loginState === "submitting") ?
                            <FontAwesomeIcon icon={faSpinner} className="mx-3 fa-spin-pulse" />
                            : t('login.label.login')
                        }
                    </Button>
                </Col>
                {step === 0 &&
                    <Col className="d-flex align-items-center justify-content-end">
                        <Link href={`/${locale}/forgot-password`} className="text-muted small">
                            {t('login.label.forgotPassword')}
                        </Link>
                    </Col>
                }
            </Row>
        </Form>
    )
}

export default LoginForm;
