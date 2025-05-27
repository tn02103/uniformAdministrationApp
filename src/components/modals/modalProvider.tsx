"use client";

import { useI18n } from "@/lib/locales/client";
import { AdministrationMaterial, CadetMaterial, MaterialGroup } from "@/types/globalMaterialTypes";
import { ReactNode, createContext, useCallback, useContext, useState } from "react";
import ChangeLanguageModal from "./changeLanguageModal";
import DangerConfirmationModal, { DangerConfirmationModalPropType } from "./dangerConfirmationModal";
import EditMaterialTypeModal, { EditMaterialTypeModalPropType } from "./editMaterialType";
import IssueMaterialModal, { IssueMaterialModalProps } from "./issueMaterial";
import MessageModal, { MessageModalOption, MessageModalPropType, MessageModalType } from "./messageModal";
import SimpleFormModal, { SimpleFormModalProps } from "./simpleFormModal";
import ChangeUserPasswordModal, { ChangeUserPasswordModalPropType } from "./userPassword";

type ModalContextType = {
    showMessageModal: (header: string, message: string | ReactNode, options: MessageModalOption[], type: MessageModalType) => void,
    simpleYesNoModal: (props: SimpleYesNoPropType) => void,
    simpleWarningModal: (props: SimpleYesNoPropType) => void,
    simpleErrorModal: (props: SimpleErrorPropType) => void,
    dangerConfirmationModal: (props: DangerConfirmationModalPropType) => void,
    simpleFormModal: (props: SimpleFormModalProps) => void,
    issueMaterialModal: (cadetId: string, materialGroup: MaterialGroup, issuedMaterialList: CadetMaterial[], oldMaterial?: CadetMaterial) => void,
    changeUserPasswordModal: (save: (p: string) => Promise<void>, nameOfUser?: string) => void,
    editMaterialTypeModal: (groupName: string, groupId: string, type?: AdministrationMaterial) => void,
    changeLanguage: () => void,
}

type ModalCapsule = {
    modalType: ModalTypes,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: any,
}

type ModalTypes = "DangerConfirmationModal" | "EditMaterialTypeModal" | "InspectionReviewPopup" | "IssueMaterialModal"
    | "IssueUniformModal" | "ChangeUserPasswordModal" | "SimpleFormModal" | "ChangeLanguageModal"

export const ModalContext = createContext<ModalContextType | undefined>(undefined);
export const useModal = () => useContext(ModalContext);

type SimpleYesNoPropType = {
    type?: MessageModalType,
    header: string,
    message: string | ReactNode,
    cancelOption?: string,
    primaryOption?: string,
    primaryFunction: () => void,
    cancelFunction?: () => void,
}

type SimpleErrorPropType = {
    header: string;
    message: string | ReactNode;
    option?: string;
    optionFunction?: () => void;
}


const ModalProvider = ({ children }: { children: ReactNode }) => {
    const t = useI18n();

    const [messageQueue, setMessageQueue] = useState<MessageModalPropType[]>([]);
    const [queue, setQueue] = useState<ModalCapsule[]>([]);

    // SIMPLE MESSAGE MODALS
    const showMessageModal = useCallback((header: string, message: string | ReactNode, options: MessageModalOption[], type: MessageModalType) => {
        const newModal: MessageModalPropType = {
            header: header,
            message: message,
            options: options,
            type: type,
            onClose: () => { setMessageQueue(prevState => prevState.slice(1)) },
        }
        setMessageQueue(prevState => [...prevState, newModal]);
    }, [setMessageQueue]);

    const simpleYesNoModal = useCallback(({ header, message, primaryOption, cancelOption, primaryFunction, cancelFunction, type }: SimpleYesNoPropType) => {
        showMessageModal(
            header,
            message,
            [{
                type: "secondary",
                option: cancelOption ?? t('common.actions.cancel'),
                function: cancelFunction ? cancelFunction : () => { },
                testId: "btn_cancel"
            },
            {
                type: "primary",
                option: primaryOption ?? t('common.actions.save'),
                function: primaryFunction,
                testId: "btn_save"
            }],
            type ?? "message",
        )
    }, [showMessageModal, t]);
    const simpleWarningModal = useCallback(({ header, message, primaryOption, cancelOption, primaryFunction, cancelFunction }: SimpleYesNoPropType) => {
        showMessageModal(
            header,
            message,
            [{
                type: "outline-secondary",
                option: cancelOption ?? t('common.actions.cancel'),
                function: cancelFunction ? cancelFunction : () => { },
                testId: "btn_cancel"
            },
            {
                type: "outline-danger",
                option: primaryOption ?? t('common.actions.save'),
                function: primaryFunction,
                testId: "btn_save"
            }],
            "warning",
        )
    }, [showMessageModal, t]);
    const simpleErrorModal = useCallback(({ header, message, option, optionFunction }: SimpleErrorPropType) => {
        showMessageModal(
            header,
            message,
            [{
                type: "outline-secondary",
                option: option ?? t('common.actions.ok'),
                function: optionFunction ? optionFunction : () => { },
                testId: "btn_save",
            }],
            "error",
        );
    }, [showMessageModal, t]);

    // COMPLEX MODALS
    const showModal = useCallback((type: ModalTypes, modalProps: object) => {
        const modal: ModalCapsule = {
            modalType: type,
            props: modalProps,
        }
        setQueue(prevState => [...prevState, modal]);
    }, [setQueue]);

    const simpleFormModal = useCallback((props: SimpleFormModalProps) => {
        showModal("SimpleFormModal", {
            ...props,
            save: async (data: { input: string }) => { onClose(); await props.save(data); },
            abort: () => { onClose(); props.abort(); },
        });
    }, [showModal]);

    const dangerConfirmationModal = useCallback((props: DangerConfirmationModalPropType) => {
        showModal("DangerConfirmationModal", props);
    }, [showModal]);

    const issueMaterialModal = useCallback((cadetId: string, materialGroup: MaterialGroup, issuedMaterialList: CadetMaterial[], oldMaterial?: CadetMaterial) => {
        const props: IssueMaterialModalProps = {
            cadetId,
            materialGroup,
            issuedMaterialList,
            oldMaterial,
            onClose,
        };
        showModal("IssueMaterialModal", props);
    }, [showModal]);

    const editMaterialTypeModal = useCallback((groupName: string, groupId: string, type?: AdministrationMaterial) => {
        const props: EditMaterialTypeModalPropType = {
            type,
            groupName,
            groupId,
            onClose: onClose,
        }
        showModal("EditMaterialTypeModal", props);
    }, [showModal]);

    const changeUserPasswordModal = useCallback((save: (password: string) => Promise<void>, nameOfUser?: string) => {
        const props: ChangeUserPasswordModalPropType = {
            nameOfUser,
            onClose,
            save,
        }
        showModal("ChangeUserPasswordModal", props);
    }, [showModal]);
    const changeLanguage = useCallback(() => {
        showModal("ChangeLanguageModal", {});
    }, [showModal])

    const onClose = () => {
        setQueue(prevState => prevState.slice(1))
    }
    const getModalContext = useCallback(() => {
        return {
            showMessageModal,
            simpleYesNoModal,
            simpleWarningModal,
            dangerConfirmationModal,
            simpleErrorModal,
            editMaterialTypeModal,
            /*issueUniformModal,
            inspectionReviewPopup,*/
            changeUserPasswordModal,
            issueMaterialModal,
            simpleFormModal,
            changeLanguage,
        }
    }, [showMessageModal,
        simpleYesNoModal,
        simpleWarningModal,
        dangerConfirmationModal,
        simpleErrorModal,
        editMaterialTypeModal,
        /* issueUniformModal,
         inspectionReviewPopup,*/
        changeUserPasswordModal,
        issueMaterialModal,
        simpleFormModal,
        changeLanguage
    ]);

    function renderModal(modal: ModalCapsule) {
        switch (modal.modalType) {
            case "DangerConfirmationModal":
                return <DangerConfirmationModal {...modal.props} onClose={onClose} />
            case "EditMaterialTypeModal":
                return <EditMaterialTypeModal {...modal.props} />
            /*      case "IssueUniformModal":
                      return <IssueUniformModal {...modal.props} />
                  case "InspectionReviewPopup":
                      return <InspectionReviewPopup {...modal.props} />*/
            case "ChangeUserPasswordModal":
                return <ChangeUserPasswordModal {...modal.props} />
            case "SimpleFormModal":
                return <SimpleFormModal {...modal.props} />
            case "IssueMaterialModal":
                return <IssueMaterialModal {...modal.props} />
            case "ChangeLanguageModal":
                return <ChangeLanguageModal onClose={onClose} />
        }
    }

    return (
        <ModalContext.Provider value={getModalContext()}>
            {(queue?.length > 0) && renderModal(queue[0])}
            {(messageQueue?.length > 0) &&
                <MessageModal {...messageQueue[0]} />}
            {children}
        </ModalContext.Provider>
    );
}

export default ModalProvider;
