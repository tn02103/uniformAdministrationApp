"use client";

import { useI18n } from "@/lib/locales/client";
import { AuthItem } from "@/lib/storageTypes";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Assosiation } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { mutate } from "swr";
import { useLocalStorage } from "usehooks-ts";
import { uuid } from "uuidv4";

type PropType = {
    assosiations: Assosiation[];
}
export type RegistrationFormType = {
    username: string,
    password: string,
    assosiation: string,
}
const LoginForm = ({ assosiations }: PropType) => {
    const t = useI18n();
    const router = useRouter();
    const searchParam = useSearchParams();
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegistrationFormType>({ defaultValues: { assosiation: undefined } });


    const [failedLogin, setFailedLogin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authItem, setAuthItem] = useLocalStorage<AuthItem | null>(process.env.NEXT_PUBLIC_LOCAL_AUTH_KEY as string, null);

    useEffect(() => {
        if (authItem) {
            setValue("assosiation", authItem.assosiationId);
        }
    }, [authItem, setValue])

    async function onSubmit(data: RegistrationFormType) {
        setIsSubmitting(true);
        data.username = data.username.trim();
        const deviceId = authItem?.deviceId ?? uuid();

        await fetch('/api/auth/login', { method: "POST", body: JSON.stringify({ ...data, deviceId }) }).then(async response => {
            if (response.status === 200) {
                const returnBody = await response.json();
                const authItem: AuthItem = {
                    deviceId,
                    assosiationId: data.assosiation,
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
        })
    }

    /*
        // Try to login with refreshToken
        /* setHideLogin(true);
         refreshSessionCookie()
             .then((success) => {
                 if (success) {
                     mutate(() => true, undefined, true);
                     if (router.query.returnUrl !== undefined) {
                         router.push(router.query.returnUrl as string);
                     } else {
                         router.push("/cadet");
                     }
                 } else {
                     setHideLogin(false);
                     if (authItem.assosiationId) {
                         setValue("assosiation", authItem.assosiationId);
                     }
                 }
             });
    }, []);*/

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
                <Form.Label>{t('login.label.assosiation')}:</Form.Label>
                <Form.Select
                    id="assosiation"
                    autoFocus
                    isInvalid={!!errors.assosiation}
                    {...register("assosiation", { required: true })}>
                    {assosiations?.map((ass) => {
                        return (
                            <option key={ass.id} value={ass.id}>{ass.name}</option>
                        )
                    })}
                </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>{t('login.label.username')}:</Form.Label>
                <Form.Control
                    type="text"
                    isInvalid={!!errors.username || failedLogin}
                    {...register(
                        "username",
                        {
                            required: {
                                value: true,
                                message: t('common.error.string.required')
                            },
                        })
                    } />
            </Form.Group>
            <div className="text-danger-emphasis fs-7">
                {errors.username?.message}
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
            </Row>
        </Form>
    )
}

export default LoginForm;
