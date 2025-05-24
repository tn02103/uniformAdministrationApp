import React, { ReactNode } from "react"
import { Col, Row } from "react-bootstrap"

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
};

export function Card({ children, ...props }: CardProps) {
    return (
        <div {...props} className="container border border-1 rounded-top border-dark">
            {children}
        </div>
    );
}

export function CardBody({ children }: {children: ReactNode}) {
    return (
        <Row className="bg-white border-top border-1 border-dark">
            <Col xs={12} className="p-0">
                {children}
            </Col>
        </Row>
    );
}

type PropType = {
    title?: string,
    tooltipIconButton?: ReactNode,
    endButton?: ReactNode,
    children?: ReactNode,
    testId?: string;
}
export function CardHeader({ title, children, tooltipIconButton, endButton, testId }: PropType) {
    if (children && React.isValidElement(children)) {
        return (
            <Row data-testid={testId} className="bg-body-secondary p-1 rounded-top text-center">
                {children}
            </Row>
        );
    }

    return (
        <Row className="bg-body-secondary p-1 rounded-top justify-content-between">
            <Col xs={"auto"}>
            </Col>
            <Col xs={"auto"} className="">
                <h3 data-testid={testId} className="fs-5 fw-bold text-center align-middle m-0">
                    {title ? title : children}
                    {tooltipIconButton}
                </h3>
            </Col>
            <Col xs={"auto"}>
                {endButton}
            </Col>
        </Row>
    );
}

export function CardFooter({ children }: {children: ReactNode}) {
    return (
        <Row className="bg-body-tertiary border-top border-dark border-1 p-1 justify-content-between rounded-bottom-">
            {children}
        </Row>
    );
}
