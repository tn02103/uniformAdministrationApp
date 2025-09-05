/* eslint-disable no-console */
"use client";

import { refreshAccessToken, userLogin } from "@/dal/auth";
import { useI18n } from "@/lib/locales/client";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Organisation } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

type PropType = {
    organisations: Organisation[];
    lastUsedOrganisationId?: string;
}
export type RegistrationFormType = {
    email: string,
    password: string,
    organisation: string,
}
const LoginForm = ({ organisations, lastUsedOrganisationId }: PropType) => {
    const t = useI18n();
    const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormType>({
        defaultValues: { organisation: lastUsedOrganisationId }
    });


    const [failedLogin, setFailedLogin] = useState(false);
    const [userBlocked, setUserBlocked] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function onSubmit(data: RegistrationFormType) {
        setIsSubmitting(true);
        data.email = data.email.trim();

        userLogin({
            organisationId: data.organisation,
            email: data.email,
            password: data.password
        }).then((response) => {
            setIsSubmitting(false);
            if (response.loginSuccessful) {

            } else {
                if (response.exceptionType === "AuthenticationFailed") {
                    setFailedLogin(true);
                } else if (response.exceptionType === "UnknownError") {
                    setFailedLogin(false);
                    toast.error(t('login.error.unknown'));
                } else if (response.exceptionType === "User Blocked") {
                    setUserBlocked(true);
                }
            }
        })
        /* await fetch('/api/auth/login', { method: "POST", body: JSON.stringify({ ...data, deviceId }) }).then(async response => {
             if (response.status === 200) {
                 const returnBody = await response.json();
                 const authItem: AuthItem = {
                     deviceId,
                     organisationId: data.organisation,
                     authToken: returnBody?.refreshToken,
                     lastLogin: new Date(),
                 }
 
                 setAuthItem(authItem);
 
                 mutate(() => true, undefined, true);
                 if (searchParam.has('returnUrl')) {
                     router.push(searchParam.get('returnUrl') as string);
                 } else {
                     router.push(`/app/cadet`);
                 }
             } else if (response.status === 401) {
                 setFailedLogin(true);
                 setIsSubmitting(false);
             }
         }).catch(error => {
             setFailedLogin(false);
             console.error(error);
             toast.error(t('login.error.unknown'));
             setIsSubmitting(false);
         })*/
    }

    const handleRefreshToken = async () => {
        console.log(await refreshAccessToken());
    }

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
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

            <Form.Group className="mb-3">
                <Form.Label>{t('login.label.organisation')}:</Form.Label>
                <Form.Select
                    id="organisation"
                    autoFocus
                    isInvalid={!!errors.organisation}
                    {...register("organisation", { required: true })}>
                    {organisations?.map((org) => {
                        return (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        )
                    })}
                </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>{t('login.label.username')}:</Form.Label>
                <Form.Control
                    type="text"
                    isInvalid={!!errors.email || failedLogin}
                    {...register(
                        "email",
                        {
                            required: {
                                value: true,
                                message: t('common.error.string.required')
                            },
                        })
                    } />
            </Form.Group>
            <div className="text-danger-emphasis fs-7">
                {errors.email?.message}
            </div>
            <Form.Group className="mb-3">
                <Form.Label>{t('login.label.password')}:</Form.Label>
                <Form.Control
                    type="password"
                    autoComplete={"off"}
                    isInvalid={!!errors.password || failedLogin}
                    {...register("password", {
                        required: {
                            value: true,
                            message: t('common.error.string.required')
                        },
                    })} />
            </Form.Group>
            <div className="text-danger-emphasis fs-7">
                {errors.password?.message}
            </div>
            <div className="text-danger-emphasis fs-6 mb-3">
                {failedLogin && t('login.error.failed')}
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
                <Col>
                    <Button variant="secondary" onClick={handleRefreshToken} data-testid="btn_refreshToken">
                        Refresh Token
                    </Button>
                </Col>
            </Row>
        </Form>
    )
}

export default LoginForm;
