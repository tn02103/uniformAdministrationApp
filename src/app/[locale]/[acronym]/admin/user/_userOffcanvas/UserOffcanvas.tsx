"use client"

import { LabelIconButton } from "@/components/Buttons/LabelIconButton";
import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { ToggleFormField } from "@/components/fields/ToggleFormField";
import { useModal } from "@/components/modals/modalProvider";
import { adminTriggerPasswordReset, createUser, deleteUser, updateUser } from "@/dal/user";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { User } from "@/types/userTypes";
import { UserFormInput, UserFormSchema } from "@/zod/user";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import { Button, Col, Offcanvas, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "react-toastify";
import { KeyedMutator } from "swr";

export type Props = {
    user: User | null;
    editable: boolean;
    setEditable: Dispatch<SetStateAction<boolean>>;
    setSelectedUserId: (id: string | null) => void;
    mutate: KeyedMutator<User[]>;
    currentUserId?: string;
}

/**
 * Offcanvas panel for viewing, creating, and editing a single user.
 *
 * Operates in two modes determined by the `user` prop:
 * - **Create mode** (`user === null`): renders an empty form with a password field and a
 *   "Create" submit button. Calls `createUser` on submit. On success, closes the panel and
 *   triggers `mutate` to refresh the user list.
 * - **View/Edit mode** (`user !== null`): renders the user's current data as plaintext fields
 *   when `editable` is false. Switching to edit mode (`editable = true`) enables all fields
 *   and replaces the action buttons with Save / Cancel. Password field is hidden in this mode.
 *
 * Actions available in view mode (non-editable, existing user):
 * - **Edit**: calls `setEditable(true)` — controlled externally via the `editable` / `setEditable` props.
 * - **Delete**: opens a `dangerConfirmationModal` requiring confirmation text equals the user's
 *   name. On confirm, calls `deleteUser`, closes the panel, and triggers `mutate`.
 * - **Reset Password**: opens a `simpleYesNoModal` to confirm the action, then calls
 *   `adminTriggerPasswordReset`. On success displays the one-time temp password in a message
 *   modal; on failure shows an error modal.
 * - **Reset 2FA**: button is rendered but permanently disabled (not yet implemented).
 *
 * Form behaviour:
 * - Uses react-hook-form with `UserFormSchema` as Zod resolver.
 * - Field errors returned by DAL server actions (e.g. username/email duplication) are surfaced
 *   inline via `SAFormHandler` / `form.setError`.
 * - When `editable` transitions from `true` to `false` for an existing user, the form is reset
 *   to the current `user` prop values to discard unsaved changes.
 * - Cancel for a new user closes the panel; cancel for an existing user exits edit mode and
 *   restores original field values.
 *
 * @param user - The user to display, or `null` to open in create mode.
 * @param editable - Whether the form fields are currently editable.
 * @param setEditable - Setter to toggle edit mode (lifted to parent `UserTable`).
 * @param setSelectedUserId - Setter to close the panel (pass `null`) or switch users.
 * @param mutate - SWR mutate function to revalidate the user list after mutations.
 */
export const UserOffcanvas = ({
    user,
    editable,
    setEditable,
    setSelectedUserId,
    mutate,
    currentUserId,
}: Props) => {
    const t = useI18n();
    const modal = useModal();
    const isNewUser = user === null;
    const form = useForm<UserFormInput>({
        resolver: zodResolver(UserFormSchema),
        defaultValues: isNewUser ? {
            role: AuthRole.user,
            active: true,
        } : user,
    });
    const { reset } = form;

    useEffect(() => {
        if (!editable && !isNewUser && user) {
            reset(user, { keepDirty: false, keepTouched: false, keepValues: false });
        }
    }, [user, reset, editable, isNewUser]);

    const roleOptions = [
        { value: AuthRole.user, label: t('common.user.authRole.1') },
        { value: AuthRole.inspector, label: t('common.user.authRole.2') },
        { value: AuthRole.materialManager, label: t('common.user.authRole.3') },
        { value: AuthRole.admin, label: t('common.user.authRole.4') },
    ];

    const isOwnRecord = !isNewUser && currentUserId === user?.id;

    const handleSave = async (data: UserFormInput, form: UseFormReturn<UserFormInput>) => {
        if (isNewUser) {
            return handleCreate(data, form);
        }

        await SAFormHandler(
            updateUser({ ...data, id: user!.id }),
            form.setError,
            (data) => {
                setEditable(false);
                mutate(data);
                toast.success(t('admin.user.success.saved'));
            },
            t('admin.user.error.save'),
        );
    };

    const handleCreate = async (data: UserFormInput, form: UseFormReturn<UserFormInput>) => {
        await SAFormHandler(
            createUser(data),
            form.setError,
            (result) => {
                setEditable(false);
                setSelectedUserId(null);
                mutate();
                if (result?.tempPassword) showTempPasswordModal(result.tempPassword);
            },
            t('admin.user.error.create'),
        );
    };

    const handleCancel = () => {
        if (isNewUser) {
            setSelectedUserId(null);
            setEditable(false);
        } else {
            setEditable(false);
            if (user) {
                reset(user);
            }
        }
    };

    const showTempPasswordModal = useCallback((tempPassword: string) => {
        modal?.showMessageModal(
            t('admin.user.success.passwordReset'),
            <>
                <p>{t('admin.user.tempPassword.label')}</p>
                <div className="d-flex align-items-center gap-2 mb-2">
                    <code className="fs-5 user-select-all text-dark bg-body-secondary p-2 rounded">
                        <span data-testid="temp-password">{tempPassword}</span>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm border-0 ms-2 p-1 rounded"
                            onClick={() => navigator.clipboard.writeText(tempPassword)}
                            aria-label="copy password"
                        >
                            <FontAwesomeIcon icon={faCopy} />
                        </button>
                    </code>
                </div>
                <p className="mb-0 small fst-italic">{t('admin.user.tempPassword.warning')}</p>
            </>,
            [{ type: 'primary', option: t('common.actions.close'), function: () => { }, testId: 'btn_close' }],
            'message',
        );
    }, [modal, t]);

    const handleResetPassword = useCallback(() => {
        if (isNewUser || !user) return;

        modal?.simpleYesNoModal({
            header: t('admin.user.actions.resetPassword'),
            message: t('admin.user.actions.resetPasswordConfirm', { user: user.name }),
            primaryOption: t('common.actions.reset'),
            primaryFunction: async () => {
                try {
                    const result = await adminTriggerPasswordReset({ id: user.id });
                    showTempPasswordModal(result.tempPassword);
                } catch {
                    modal?.simpleErrorModal({
                        header: t('admin.user.error.passwordReset'),
                        message: t('admin.user.error.passwordReset'),
                    });
                }
            },
        });
    }, [isNewUser, user, modal, t, showTempPasswordModal]);

    const handleDelete = async () => {
        if (isNewUser || !user) return;

        modal?.dangerConfirmationModal({
            header: t('admin.user.actions.delete', { user: user.name }),
            message: t('admin.user.actions.deleteWarning.message'),
            confirmationText: user.name,
            dangerOption: {
                option: t('common.actions.delete'),
                function: async () => {
                    await SAFormHandler(
                        deleteUser({ id: user.id }),
                        null,
                        () => {
                            setSelectedUserId(null);
                            mutate();
                            toast.success(t('admin.user.success.deleted'));
                        },
                        t('admin.user.error.delete'),
                    );
                },
            }
        });
    };

    const reset2FATooltip = (
        <Tooltip>{t('admin.user.actions.reset2FA.notAvailable')}</Tooltip>
    );

    return (
        <Offcanvas
            show={true}
            onHide={() => {
                setEditable(false);
                setSelectedUserId(null);
            }}
            placement="end"
            backdrop={false}
            style={{ width: "500px" }}
            aria-labelledby="userCanvasHeader"
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                    <h2 id="userCanvasHeader">{isNewUser ? t('common.actions.create') : user?.name}</h2>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h3 className="text-center">{t('common.details')}</h3>
                <hr className="my-0" />
                {!isNewUser && (
                    <Row className="mb-4 justify-content-evenly">
                        <LabelIconButton
                            variantKey="edit"
                            disabled={editable}
                            onClick={() => setEditable(!editable)}
                        />
                        <LabelIconButton
                            variantKey="delete"
                            disabled={editable}
                            onClick={handleDelete}
                        />
                    </Row>
                )}
                <Form<UserFormInput>
                    onSubmit={handleSave}
                    formName="userForm"
                    formReturn={form}
                >
                    <Row>
                        <Col xs={12}>
                            <InputFormField<UserFormInput>
                                name="name"
                                label={t('admin.user.label.name')}
                                required
                                plaintext={!editable && !isNewUser}
                                disabled={!editable && !isNewUser}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12}>
                            <InputFormField<UserFormInput>
                                name="username"
                                label={t('admin.user.label.username')}
                                required
                                disabled={!isNewUser && !editable}
                                plaintext={!editable && !isNewUser}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12}>
                            <InputFormField<UserFormInput>
                                name="email"
                                label={t('admin.user.label.email')}
                                required
                                type="email"
                                plaintext={!editable && !isNewUser}
                                disabled={!editable && !isNewUser}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={6}>
                            <SelectFormField<UserFormInput>
                                name="role"
                                label={t('admin.user.label.role')}
                                options={roleOptions}
                                required
                                plaintext={!editable && !isNewUser}
                                disabled={(!editable && !isNewUser) || isOwnRecord}
                                valueAsNumber
                            />
                            {(editable && isOwnRecord) && (
                                <p className="form-text text-muted">{t('admin.user.role.selfChange.disabled')}</p>
                            )}
                        </Col>
                        <Col xs={6}>
                            <ToggleFormField<UserFormInput>
                                name="active"
                                label={t('admin.user.label.activeStatus')}
                                disabled={!editable && !isNewUser}
                            />
                        </Col>
                    </Row>

                    {editable && (
                        <Row className="mt-4 gap-2">
                            <Col xs="auto">
                                <Button
                                    type="submit"
                                    variant="primary"
                                >
                                    {isNewUser ? t('common.actions.create') : t('common.actions.save')}
                                </Button>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    onClick={handleCancel}
                                >
                                    {t('common.actions.cancel')}
                                </Button>
                            </Col>
                        </Row>
                    )}
                    {!editable && !isNewUser && (
                        <Row className="mt-4 gap-2">
                            <Col xs="auto">
                                <Button
                                    type="button"
                                    variant="outline-primary"
                                    onClick={handleResetPassword}
                                >
                                    {t('admin.user.actions.resetPassword')}
                                </Button>
                            </Col>
                            <Col xs="auto">
                                <OverlayTrigger
                                    placement="top"
                                    overlay={reset2FATooltip}
                                >
                                    <span className="d-inline-block">
                                        <Button
                                            type="button"
                                            variant="outline-secondary"
                                            disabled
                                        >
                                            {t('admin.user.actions.reset2FA')}
                                        </Button>
                                    </span>
                                </OverlayTrigger>
                            </Col>
                        </Row>
                    )}
                </Form>
            </Offcanvas.Body>
        </Offcanvas>
    );
};
