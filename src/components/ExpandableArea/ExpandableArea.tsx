import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Row, Button } from "react-bootstrap";
import styles from "./ExpandableArea.module.css";
import { useI18n } from "@/lib/locales/client";

export const ExpandableArea = ({ children }: { children: React.ReactNode }) => {
    const t = useI18n();
    const [expanded, setExpanded] = useState(false);

    return (
        <>
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
            {expanded && (
                <Row>
                    {children}
                </Row>
            )}
        </>
    );
}
