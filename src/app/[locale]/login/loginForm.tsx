"use client";

import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { refreshAccessToken, userLogin } from "@/dal/auth";
import { LoginFormSchema, LoginFormType } from "@/zod/auth";
import { useI18n } from "@/lib/locales/client";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Organisation } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Button, Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { NumberInputFormField } from "@/components/fields/NumberInputFormField";

type PropType = {
    organisations: Organisation[];
    lastUsedOrganisationId?: string;
    tryRefreshToken?: boolean;
}

const LoginForm = ({ organisations, lastUsedOrganisationId, ...props }: PropType) => {
    const t = useI18n();
    const router = useRouter();
    const params = useParams();

    const [tryRefreshToken, setTryRefreshToken] = useState(props.tryRefreshToken);
    const [failedLogin, setFailedLogin] = useState(false);
    const [userBlocked, setUserBlocked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(0);

    async function onSubmit(data: LoginFormType) {
        setIsSubmitting(true);
        setUserBlocked(false);
        setFailedLogin(false);

        userLogin({
            organisationId: data.organisationId,
            email: data.email.trim(),
            password: data.password
        }).then((response) => {
            setIsSubmitting(false);
            if (response.loginSuccessful) {

            } else {
                if (response.exceptionType === "TwoFactorRequired") {
                    setStep(1);
                } else if (response.exceptionType === "AuthenticationFailed") {
                    setFailedLogin(true);
                } else if (response.exceptionType === "UnknownError") {
                    setFailedLogin(false);
                    toast.error(t('login.error.unknown'));
                } else if (response.exceptionType === "User Blocked") {
                    setUserBlocked(true);
                }
            }
        })
    }

    useEffect(() => {
        if (tryRefreshToken)
            refreshAccessToken().then((result) => {
                if (result.success) {
                    router.push(`/${params.locale}/app/`)
                } else {
                    setTryRefreshToken(false);
                }
            }).catch(() => setTryRefreshToken(false))
    }, [tryRefreshToken, router, params.locale]);

    if (tryRefreshToken)
        return null;


    return (
        <Form<LoginFormType> onSubmit={onSubmit} zodSchema={LoginFormSchema} defaultValues={{ organisationId: lastUsedOrganisationId }} >
            {userBlocked &&
                <Alert variant="danger" style={{ maxWidth: "400px" }} onClose={() => setUserBlocked(false)} dismissible>
                    {t('login.error.userBlocked')}
                </Alert>
            }
            {!userBlocked && failedLogin &&
                <Alert variant="danger" style={{ maxWidth: "400px" }} onClose={() => setFailedLogin(false)} dismissible>
                    {t('login.error.failed')}
                </Alert>
            }
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
                            name="email"
                            label={t('login.label.username')}
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
                    <Row>
                        <Col>
                            <Button variant="primary" type="submit" disabled={isSubmitting} data-testid="btn_login">
                                {isSubmitting ?
                                    <FontAwesomeIcon icon={faSpinner} className="mx-3 fa-spin-pulse" />
                                    : t('login.label.login')
                                }
                            </Button>
                        </Col>
                    </Row>
                </div>
            }
            {step === 1 &&
                <div>
                    <NumberInputFormField name="twoFactorCode" label={t('login.label.twoFactorCode')} />
                </div>
            }
        </Form>
    )
}

export default LoginForm;
