"use client";

import { useForm } from "react-hook-form";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import { Assosiation } from "@prisma/client";
import { AuthItem } from "@/lib/storageTypes";
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
    const t = (key: string) => key;

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegistrationFormType>({ defaultValues: { assosiation: undefined } });

    const [failedLogin, setFailedLogin] = useState<boolean>(false);
    const [hideLogin, setHideLogin] = useState<boolean>(false);

    async function onSubmit(data: RegistrationFormType) {
        data.username = data.username.trim();
        let deviceId: string;
        const storageString = localStorage.getItem(process.env.NEXT_PUBLIC_LOCAL_AUTH_KEY as string)
        if (storageString) {
            const authItem: AuthItem = JSON.parse(storageString);
            deviceId = authItem.deviceId;
        } else {
            deviceId = uuid();
        }

        await fetch('/api/auth/login', { method: "POST", body: JSON.stringify({ ...data, deviceId }) }).then(async response => {
            if (response.status === 200) {
                const returnBody = await response.json();
                const authItem: AuthItem = {
                    deviceId,
                    assosiationId: data.assosiation,
                    authToken: returnBody?.refreshToken,
                    lastLogin: new Date(),
                }

                localStorage.setItem(process.env.NEXT_PUBLIC_LOCAL_AUTH_KEY as string, JSON.stringify(authItem));

                /*  mutate(() => true, undefined, true);
                  if (router.query.returnUrl !== undefined) {
                      router.push(router.query.returnUrl as string);
                  } else {
                      router.push("/cadet");
                  }*/
            } else if (response.status === 401) {
                setFailedLogin(true);
            }

        }).catch(error => {
            setFailedLogin(false);
            console.error(error);
            // toast.error(t('error.login.unknown'));
        });
    }

    // onMount
    useEffect(() => {
        const storageString = localStorage.getItem(process.env.NEXT_PUBLIC_LOCAL_AUTH_KEY as string)
        if (!storageString) {
            return;
        }

        const authItem: AuthItem = JSON.parse(storageString);

        // no refreshToken
        if (!authItem.authToken) {
            if (authItem.assosiationId) {
                setValue("assosiation", authItem.assosiationId);
            }
            return;
        }

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
             });*/
    }, []);

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
                <Form.Label>{t('label.user.assosiation')}:</Form.Label>
                <Form.Select
                    id="assosiation"
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
                <Form.Label>{t('label.user.username')}:</Form.Label>
                <Form.Control
                    type="text"
                    isInvalid={!!errors.username || failedLogin}
                    {...register(
                        "username",
                        {
                            required: {
                                value: true,
                                message: t('error.login.username.required')
                            },
                        })
                    } />
            </Form.Group>
            <div className="text-danger-emphasis fs-7">
                {errors.username?.message}
            </div>
            <Form.Group className="mb-3">
                <Form.Label>{t('label.user.password')}:</Form.Label>
                <Form.Control
                    type="password"
                    isInvalid={!!errors.password || failedLogin}
                    {...register("password", {
                        required: {
                            value: true,
                            message: t('error.login.password.required')
                        },
                    })} />
            </Form.Group>
            <div className="text-danger-emphasis fs-7">
                {errors.password?.message}
            </div>
            <div className="text-danger-emphasis fs-6 mb-3">
                {failedLogin ? t('error.login.wrongCredentials') : ""}
            </div>
            <Row>
                <Col>
                    <Button variant="primary" type="submit">{t('label.user.login')}</Button>
                </Col>
            </Row>
        </Form>
    )
}

export default LoginForm;
