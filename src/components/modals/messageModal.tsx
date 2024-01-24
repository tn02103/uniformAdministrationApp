"use client"

import { faCircleXmark, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import { Button, Col, Modal, Row } from "react-bootstrap";


export type MessageModalPropType = {
    type: MessageModalType,
    header: string,
    message: string | ReactNode,
    options: MessageModalOption[],
    onClose: () => void,
}

const MessageModalTypes = {
    error: {
        bgHeader: "bg-danger bg-gradient",
        icon: {
            icon: faCircleXmark,
            color: "text-danger",
        }
    },
    danger: {
        bgHeader: "bg-danger bg-gradient",
        icon: {
            icon: faTriangleExclamation,
            color: "text-danger",
        }
    },
    warning: {
        bgHeader: "bg-warning bg-gradient",
        icon: {
            icon: faTriangleExclamation,
            color: "text-warning",
        }
    },
    message: {
        bgHeader: "bg-secondary bg-gradient bg-opacity-25",
        icon: undefined
    },
}
export type MessageModalOption = {
    type: "primary" | "danger" | "sucess" | "secondary" | "warning" | "outline-primary" | "outline-danger" | "outline-secondary" | "outline-warning",
    option: string,
    function: () => void,
    closeOnAction?: boolean,
    usingConfirmationText?: boolean,
    testId: string,
}
export type MessageModalType = "error" | "warning" | "message" | "danger";

const MessageModal = ({ type, header, message, options, onClose }: MessageModalPropType) => {

    const modalType = MessageModalTypes[type];

    const handleOnClick = (option: MessageModalOption) => {
        if (option.closeOnAction === undefined || option.closeOnAction === true) {
            onClose();
        }
        if (option.function) {
            option.function();
        }
    }

    return (
        <Modal data-testid="div_messageModal_popup" show={true} onHide={onClose}>
            <Modal.Header data-testid="div_header" closeButton className={`${modalType.bgHeader} fs-5 fw-bold`}>
                {header}
            </Modal.Header>
            <Modal.Body>
                <Row>
                    {modalType.icon ?
                        <Col xs={1} data-testid="div_icon">
                            <FontAwesomeIcon icon={modalType.icon.icon} size="xl" className={modalType.icon.color} />
                        </Col>
                        : ""}
                    <Col data-testid="div_message">
                        {message}
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Row className="justify-content-between w-100">
                    {options.map(option => {
                        return (
                            <Col xs={"auto"} key={option.option}>
                                <Button variant={option.type} data-testid={option.testId} onClick={() => handleOnClick(option)}>
                                    {option.option}
                                </Button>
                            </Col>
                        )
                    })}
                </Row>
            </Modal.Footer>
        </Modal>
    );
}

export default MessageModal;
