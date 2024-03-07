"use client";
import { ReactNode, createContext, useCallback, useContext, useState } from "react";
import MessageModal, { MessageModalOption, MessageModalPropType, MessageModalType } from "./messageModal";
import { useI18n } from "@/lib/locales/client";
import SimpleFormModal, { SimpleFormModalProps } from "./simpleFormModal";
import { CadetMaterial, MaterialGroup } from "@/types/globalMaterialTypes";
import IssueMaterialModal, { IssueMaterialModalProps } from "./issueMaterial";
import { UniformType } from "@/types/globalUniformTypes";
import UniformItemDetailModal, { UIDModalProps } from "./uniformItemDetail";



type ModalContextType = {
    showMessageModal: (header: string, message: string | ReactNode, options: MessageModalOption[], type: MessageModalType) => void,
    simpleYesNoModal: (props: SimpleYesNoPropType) => void,
    simpleWarningModal: (props: SimpleYesNoPropType) => void,
    //dangerConfirmationModal: (header: string, message: string | ReactNode, confirmationText: string, dangerOption: string, dangerFunction: () => void, cancelOption?: string, cancelFunction?: () => void) => void,
    simpleFormModal: (props: SimpleFormModalProps) => void,
    issueMaterialModal: (cadetId: string, materialGroup: MaterialGroup, issuedMaterialList: CadetMaterial[], oldMaterial?: CadetMaterial) => void,
    uniformItemDetailModal: (uniformId: string, uniformType: UniformType, ownerId: string | null) => void,
}

type ModalCapsule = {
    modalType: ModalTypes,
    props: any,
}
type ModalTypes = "DangerConfirmationModal" | "EditGenerationModal" | "EditMaterialTypeModal" | "InspectionReviewPopup" | "IssueMaterialModal"
    | "IssueUniformModal" | "ChangeUserPasswordModal" | "SimpleFormModal" | "UniformItemDetailModal"

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
    }, []);

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
    }, []);
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
    }, []);

    // COMPLEX MODALS
    const showModal = useCallback((type: ModalTypes, modalProps: any) => {
        const modal: ModalCapsule = {
            modalType: type,
            props: modalProps,
        }
        setQueue(prevState => [...prevState, modal]);
    }, []);

    const simpleFormModal = useCallback(({ elementLabel, elementValidation, header, save, abort, defaultValue }: SimpleFormModalProps) => {
        showModal("SimpleFormModal", {
            save: (data: { input: string | number }) => { onClose(); save(data); },
            abort: () => { onClose(); abort(); },
            elementLabel,
            elementValidation,
            header,
            defaultValue
        });
    }, []);

    const issueMaterialModal = useCallback((cadetId: string, materialGroup: MaterialGroup, issuedMaterialList: CadetMaterial[], oldMaterial?: CadetMaterial) => {
        const props: IssueMaterialModalProps = {
            cadetId,
            materialGroup,
            issuedMaterialList,
            oldMaterial,
            onClose,
        };
        showModal("IssueMaterialModal", props);
    }, []);

    const uniformItemDetailModal = useCallback((uniformId: string, uniformType: UniformType, ownerId: string | null) => {
        const props: UIDModalProps = {
            uniformId,
            uniformType,
            ownerId,
            onClose,
        };
        showModal("UniformItemDetailModal", props);
    }, [])

    const onClose = () => {
        setQueue(prevState => prevState.slice(1))
    }
    const getModalContext = useCallback(() => {
        return {
            showMessageModal,
            simpleYesNoModal,
            simpleWarningModal,
            /* dangerConfirmationModal,
             issueUniformModal,
             editGenerationModal,
             editMaterialTypeModal,
             inspectionReviewPopup,
             changeUserPasswordModal,*/
            issueMaterialModal,
            simpleFormModal,
            uniformItemDetailModal
        }
    }, [showMessageModal,
        simpleYesNoModal,
        simpleWarningModal,
        /* dangerConfirmationModal,
        issueUniformModal,
        editGenerationModal,
        editMaterialTypeModal,
         inspectionReviewPopup,
         changeUserPasswordModal,*/
        issueMaterialModal,
        simpleFormModal,
        uniformItemDetailModal]);

    function renderModal(modal: ModalCapsule) {
        switch (modal.modalType) {
            /*      case "DangerConfirmationModal":
                      return <DangerConfirmationModal {...modal.props} onClose={onClose} />
                  case "IssueUniformModal":
                      return <IssueUniformModal {...modal.props} />
                  case "EditGenerationModal":
                      return <EditGenerationModal {...modal.props} />
                  case "EditMaterialTypeModal":
                      return <EditMaterialTypeModal {...modal.props} />
                  case "InspectionReviewPopup":
                      return <InspectionReviewPopup {...modal.props} />
                      case "ChangeUserPasswordModal":
                          return <ChangeUserPasswordModal {...modal.props} />*/
            case "SimpleFormModal":
                return <SimpleFormModal {...modal.props} />
            case "IssueMaterialModal":
                return <IssueMaterialModal {...modal.props} />
            case "UniformItemDetailModal":
                return <UniformItemDetailModal {...modal.props} />
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
