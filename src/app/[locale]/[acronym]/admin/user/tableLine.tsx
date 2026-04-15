"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { changeUserPassword, createUser, deleteUser, updateUser } from "@/actions/controllers/UserController";
import { InputFormField } from "@/components/fields/InputFormField";
import { useModal } from "@/components/modals/modalProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { nameValidationPattern, userNameValidationPattern } from "@/lib/validations";
import { User } from "@/types/userTypes";
import { faBars, faCheck, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Button, Dropdown, FormGroup, FormLabel, FormSelect } from "react-bootstrap";
import { Control, Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

export default function UserAdminTableRow({
    user, userList, onCancel, onSave
}: {
    user: User | undefined;
    userList: User[];
    onCancel?: () => void;
    onSave?: () => void;
}) {
    const t = useI18n();
    const tError = useScopedI18n('common.error');
    const modal = useModal();

    const formId = `user_${user ? user.id : "new"}`;
    const { control, handleSubmit, reset } = useForm<User>({ defaultValues: user, mode: "onChange" });
    const mobileForm = useForm<User>({ defaultValues: user, mode: "onChange" });

    const [editable, setEditable] = useState(!user);

    useEffect(() => {
        if (!editable) {
            reset(user);
            mobileForm.reset(user);
        }
    }, [user, reset, mobileForm.reset, editable]);

    async function handleSave(data: User) {
        data.active = (String(data.active) === "true");

        if (!user) return handleCreate(data);
        updateUser(data)
            .then(() => {
                setEditable(false);
                toast.success(t('admin.user.saved'))
            }).catch((error) => {
                console.error(error);
                toast.error(t('common.error.actions.save'));
            });
    }
    async function handleCreate(data: User) {
        modal?.changeUserPasswordModal(
            (password: string) => createUser(data, password)
                .then(() => {
                    onSave?.();
                    toast.success(t('admin.user.created'));
                }).catch((error) => {
                    console.error(error);
                    toast.error(t('common.error.actions.create'));
                })
        );
    }

    async function handlePasswortChange() {
        if (!user) return;

        modal?.changeUserPasswordModal(
            async (password: string) => {
                await changeUserPassword(user?.id, password).catch((error) => {
                    console.error(error);
                    toast.error(t('admin.user.error.changePassword'));
                });
            },
            user.name,
        );
    }
    async function handleDelete() {
        if (!user) return;

        modal?.simpleWarningModal({
            header: t('admin.user.deleteWarning.header', { user: user.name }),
            message: t('admin.user.deleteWarning.message'),
            primaryOption: t('common.actions.delete'),
            primaryFunction: () => deleteUser(user.id).catch((error) => {
                console.error(error);
                toast.error(t('common.error.actions.save'));
            }),
        });
    }

    return (
        <tr data-testid={`div_user_${user ? user.id : "new"}`}>
            <td className={`col-3 col-md-2 ${editable ? "d-none d-md-table-cell" : ""}`}>
                <UsernameControl
                    formId={formId}
                    userList={userList.filter(u => !user || u.id !== user.id)}
                    disabled={!editable || !!user}
                    plaintext={!editable}
                    control={control}
                    tError={tError} />
            </td>
            <td className={`col-8 col-sm-5 col-md-3 ${editable ? "d-none d-md-table-cell" : ""}`}>
                <NameControl
                    formId={formId}
                    editable={editable}
                    control={control}
                    tError={tError} />
            </td>
            <td className={`col-2 col-md-3 ${editable ? "d-none d-md-table-cell" : "d-none d-md-table-cell"}`}>
                {(!editable && user)
                    ? <div className="my-1" data-testid="div_role">
                        {t(`common.user.authRole.${user.role as 1 | 2 | 3 | 4}`)}
                    </div>
                    : <RoleSelect
                        formId={formId}
                        control={control}
                        t={t} />
                }
            </td>
            <td className={`d-none col-2 ${editable ? "d-md-table-cell" : "d-sm-table-cell"}`} >
                {(!editable && user)
                    ? <div className="my-1" data-testid="div_active">
                        {t(`common.user.active.${user.active ? "true" : "false"}`)}
                    </div>
                    : <ActiveSelect
                        formId={formId}
                        control={control}
                        t={t} />
                }
            </td>
            <td className={`col-1 col-md-2 col-lg-1 ${editable ? "d-none d-md-table-cell" : ""} p-auto align-end`}>
                <form id={formId} onSubmit={handleSubmit(handleSave)} />
                {editable ?
                    <div className="float-end mt-1">
                        <Button
                            form={formId}
                            size="sm"
                            type="submit"
                            variant="outline-success"
                            className="border-0 fw-bold"
                            data-testid="btn_save"
                        >
                            <FontAwesomeIcon icon={faCheck} />
                        </Button>
                        <Button
                            size="sm"
                            type="button"
                            className="border-0"
                            variant="outline-danger"
                            data-testid="btn_cancel"
                            onClick={() => {
                                if (onCancel) onCancel();

                                reset(user);
                                setEditable(false);
                            }}
                        >
                            <FontAwesomeIcon icon={faX} />
                        </Button>
                    </div>
                    :
                    <Dropdown drop="start" className="float-end">
                        <Dropdown.Toggle
                            variant="outline-primary"
                            disabled={user?.id === "null"}
                            className="border-0"
                            id={user?.id + "-Editdropdown"}
                            data-testid="btn_menu"
                        >
                            <FontAwesomeIcon icon={faBars} size="sm" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item
                                onClick={() => {
                                    setEditable(true);
                                }}
                                data-testid="btn_menu_edit"
                            >
                                {t('common.actions.edit')}
                            </Dropdown.Item>
                            <Dropdown.Item data-testid="btn_menu_password" onClick={handlePasswortChange}>
                                {t('common.actions.changePassword')}
                            </Dropdown.Item>
                            <Dropdown.Item data-testid="btn_menu_delete" onClick={handleDelete}>
                                {t('common.actions.delete')}
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                }
            </td>
            <td data-testid="div_mobile" colSpan={5} className={editable ? "d-md-none" : "d-none"}>
                <form id={formId + "_mobil"} onSubmit={mobileForm.handleSubmit(handleSave)}>
                    <FormGroup>
                        <FormLabel className="ms-1 mb-0">{t('admin.user.header.username')}</FormLabel>
                        <UsernameControl
                            formId={formId + "_mobil"}
                            userList={userList.filter(u => !user || u.id !== user.id)}
                            plaintext={false}
                            disabled={!editable || !!user}
                            tError={tError}
                            control={mobileForm.control} />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel className="ms-1 mt-1 mb-0">{t('admin.user.header.name')}</FormLabel>
                        <NameControl
                            formId={formId + "_mobil"}
                            editable={editable}
                            control={mobileForm.control}
                            tError={tError} />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel className="ms-1 mt-1 mb-0">{t('admin.user.header.role')}</FormLabel>
                        <RoleSelect
                            formId={formId + "_mobil"}
                            control={mobileForm.control}
                            t={t} />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel className="ms-1 mt-1 mb-0">{t('admin.user.header.status')}</FormLabel>
                        <ActiveSelect
                            formId={formId + "_mobil"}
                            control={mobileForm.control}
                            t={t} />
                    </FormGroup>
                    <div className="row m-2 mt-4 justify-content-between">
                        <Button
                            type="button"
                            variant="outline-danger"
                            data-testid="btn_cancel"
                            className="col col-auto"
                            onClick={() => {
                                if (onCancel) onCancel();

                                mobileForm.reset(user);
                                reset(user);
                                setEditable(false);
                            }}
                        >
                            Abbrechen
                        </Button>
                        <Button
                            form={formId + "_mobil"}
                            type="submit"
                            variant="outline-primary"
                            className="col col-auto"
                            data-testid="btn_save"
                        >
                            Speichern
                        </Button>
                    </div>
                </form>
            </td>
        </tr>
    );
}

const UsernameControl = ({
    userList,
    formId,
    disabled,
    plaintext,
    control,
    tError,
}: {
    userList: User[];
    formId: string;
    disabled: boolean;
    plaintext: boolean;
    control: Control<User>;
    tError: any;
}) => (
    <>
        <InputFormField
            name="username"
            formName={formId}
            label=""
            disabled={disabled}
            plaintext={plaintext}
            control={control}
            hookFormValidation
            required
            maxLength={6}
            hookFormValidationRules={{
                pattern: {
                    value: userNameValidationPattern,
                    message: tError('user.username.pattern'),
                },
                validate: (value) => userList.every(u => u.username !== value) || tError('user.username.duplicate'),
            }}
        />
    </>
);

const NameControl = ({
    formId,
    editable,
    control,
    tError,
}: {
    formId: string;
    editable: boolean;
    control: Control<User>;
    tError: any;
}) => (
    <InputFormField
        name="name"
        control={control}
        formName={formId}
        disabled={!editable}
        plaintext={!editable}
        label=""
        hookFormValidation
        required
        maxLength={20}
        hookFormValidationRules={{
            pattern: {
                value: nameValidationPattern,
                message: tError('string.noSpecialChars'),
            },
        }}
    />
);
const RoleSelect = ({
    formId,
    control,
    t,
}: {
    formId: string;
    control: Control<User>;
    t: any;
}) => (
    <Controller
        control={control}
        name="role"
        render={({ field }) => (
            <FormSelect
                form={formId}
                {...field}
                value={String(field.value)}
                onChange={(e) => field.onChange(+e.target.value)}
            >
                <option value={AuthRole.user}>{t('common.user.authRole.1')}</option>
                <option value={AuthRole.inspector}>{t('common.user.authRole.2')}</option>
                <option value={AuthRole.materialManager}>{t('common.user.authRole.3')}</option>
                <option value={AuthRole.admin}>{t('common.user.authRole.4')}</option>
            </FormSelect>
        )}
    />
);

const ActiveSelect = ({
    formId,
    control,
    t,
}: {
    formId: string;
    control: Control<User>;
    t: any;
}) => (
    <Controller
        control={control}
        name="active"
        render={({ field }) =>
            <FormSelect
                {...field}
                value={String(field.value)}
                form={formId}
                onChangeCapture={(e) => field.onChange(e.target.value === "true")}
            >
                <option value={"true"}>{t('common.user.active.true')}</option>
                <option value={"false"}>{t('common.user.active.false')}</option>
            </FormSelect>
        }
    />
)
