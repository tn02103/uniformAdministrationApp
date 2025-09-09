/* eslint-disable no-console */
import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { User } from "@/types/userTypes";
import { UserFormType, UserFormSchema } from "@/zod/auth";
import { Row, Col, Button } from "react-bootstrap";
import { useState } from "react";
import { LabelIconButton } from "@/components/Buttons/LabelIconButton";
import { useFormContext } from "react-hook-form";
import { faKey, faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";
import { Field } from "@/components/fields/Field";

type UserDetailFormProps = {
    user: User | null;
    onClose: () => void;
}
export const UserOCDetailForm = ({ user, onClose }: UserDetailFormProps) => {
    const t = useI18n();

    const [editable, setEditable] = useState(!user);


    const handleSaveUser = (data: UserFormType) => {
        console.log("🚀 ~ handleSaveUser ~ data:", data)
    }
    const handleCancel = () => {
        if (!user) {
            onClose();
        } else {
            setEditable(false);
        }
    }
    const handleDeleteUser = () => {
        console.log("🚀 ~ handleDeleteUser ~ user:", user)
    }
    const handleActiveStateToggle = () => {
    }

    return (
        <div>
            <hr className="mb-0" />
            {(user) &&
                <Row className="mb-3 justify-content-evenly">
                    <LabelIconButton
                        variantKey="edit"
                        disabled={editable || !user.active}
                        onClick={() => setEditable(true)} />
                    <LabelIconButton
                        variantKey="delete"
                        onClick={handleDeleteUser}
                        disabled={editable}
                    />
                    <LabelIconButton
                        label="Passwort zurücksetzen"
                        icon={faKey}
                        disabled={editable || !user.active}
                        buttonVariant="outline-secondary"
                        onClick={() => console.log("Passwort zurücksetzen")}
                    />
                    <LabelIconButton
                        label={user.active ? "Deaktivieren" : "Aktivieren"}
                        icon={user.active ? faLock : faLockOpen}
                        buttonVariant={user.active ? "outline-danger" : "outline-success"}
                        onClick={() => console.log(user.active ? "Deaktivieren" : "Aktivieren")}
                    />

                </Row>
            }

            <Form<UserFormType>
                defaultValues={user ?? undefined}
                onSubmit={handleSaveUser}
                zodSchema={UserFormSchema}
                disabled={!editable}
                plaintext={!editable}
                formName="userDetailForm"
            >
                <Row className="justify-content-between">
                    <Col xs={editable ? 12 : 6} className="mb-3">
                        <InputFormField name="name" label="Name" />
                    </Col>

                    <Col xs={editable ? 12 : 6} className="mb-3">
                        <InputFormField name="email" label="E-Mail" />
                    </Col>

                    <Col xs={6} className="mb-3">
                        <SelectFormField
                            name="role"
                            label="Rolle"
                            options={[
                                { value: AuthRole.user, label: t('common.user.authRole.1') },
                                { value: AuthRole.inspector, label: t('common.user.authRole.2') },
                                { value: AuthRole.materialManager, label: t('common.user.authRole.3') },
                                { value: AuthRole.admin, label: t('common.user.authRole.4') },
                            ]}
                        />
                    </Col>
                    <Col xs={6} className="mb-3">
                        <Field
                            name="active"
                            label={t('common.status')}
                        >
                            <p aria-label={t('common.status')} aria-readonly className="py-2 m-0">
                                {t(`common.user.active.${user?.active ? 'true' : 'false'}`)}
                            </p>
                        </Field>
                    </Col>
                </Row>
                {editable && (
                    <Row>
                        <Col>
                            <CancelButton onClick={handleCancel} />
                        </Col>
                        <Col>
                            <Button type="submit" size="sm" variant="outline-primary" className="m-1">
                                {t('common.actions.save')}
                            </Button>
                        </Col>
                    </Row>
                )}
            </Form>
        </div>
    );
};
const CancelButton = ({ onClick }: { onClick: () => void }) => {
    const { reset } = useFormContext();
    const t = useScopedI18n('common.actions');

    const handleCancel = () => {
        reset();
        onClick();
    }

    return (
        <Button type="button" size="sm" variant="outline-secondary" className="m-1" onClick={handleCancel}>
            {t('cancel')}
        </Button>
    )
};