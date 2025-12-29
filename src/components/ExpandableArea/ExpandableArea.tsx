"use client";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { Row, Button } from "react-bootstrap";
import styles from "./ExpandableArea.module.css";
import { useI18n } from "@/lib/locales/client";

type ExpandableAreaProps = {
    children: React.ReactNode;
    header: string | React.ReactNode | ((props: { expanded: boolean, setExpanded: React.Dispatch<React.SetStateAction<boolean>> }) => React.ReactNode)
    headerClassName?: string;
    defaultExpanded?: boolean;
}

export const ExpandableArea = ({ children, header, headerClassName, defaultExpanded = false }: ExpandableAreaProps) => {
    const t = useI18n();
    const [expanded, setExpanded] = useState(defaultExpanded);

    const getHeader = () => {
        if (typeof header === "function") {
            return header({ expanded, setExpanded });
        } else if (typeof header === "string") {
            return (
                <Button variant='link' onClick={() => setExpanded(!expanded)} className={`text-black text-decoration-none ${headerClassName ?? ""}`}>
                    {header} <FontAwesomeIcon icon={faChevronDown} rotation={expanded ? 180 : undefined} className={""} />
                </Button>
            )
        } else {
            return header;
        }
    }
    return (
        <>
            {getHeader()}
            {expanded && (
                <Row>
                    {children}
                </Row>
            )}
        </>
    )
}


export const ExpandableDividerArea = ({ children }: Pick<ExpandableAreaProps, "children">) => {
    const t = useI18n();
    return ExpandableArea({
        children,
        header: ({ expanded, setExpanded }) => (
            <Row style={{ height: "2rem" }} className="align-items-center justify-content-center">
                <div className="position-relative">
                    <hr className="" />
                    <div
                        className="w-auto bg-white align-center position-absolute top-50 start-50 translate-middle"
                    >
                        <Button
                            size="sm"
                            variant="light"
                            className="border-0"
                            onClick={() => setExpanded(!expanded)}
                        >
                            <FontAwesomeIcon icon={faChevronDown} className={"text-dark me-2 " + (expanded && styles.open)} />
                            {expanded ? t('expandableArea.showLess') : t('expandableArea.showMore')}
                        </Button>
                    </div>
                </div>
            </Row>
        )
    });
}
