"use client";

import { useScopedI18n } from "@/lib/locales/client";
import { useState } from "react";
import { Col, Pagination, Row } from "react-bootstrap";
import GeneratedWorkflow from "./_generateWorkflow";
import KnownIdsWorkflow from "./_knownIdsWorkflow";

export default function Page() {
    const t = useScopedI18n('createUniform');
    const [generateNumbers, setGenerateNumbers] = useState<boolean | null>(null);
    const stepState = useState<number>(0);
    const [step] = stepState

    return (
        <div className="container-sm content-center bg-light rounded pb-xl-3 p-md-4 position-relative">
            <h1 className="text-center">Neue Uniformteile anlegen</h1>
            <Row className="justify-content-center mt-5">
                <Col xs="12" md={10} lg={7} xl={7} xxl={6}>
                    <Row>
                        <Pagination>
                            <Pagination.Item
                                disabled={(step !== 0) && !!generateNumbers}
                                active={generateNumbers !== null && !generateNumbers}
                                onClick={() => { if (step == 0) setGenerateNumbers(false) }}
                                data-testid="btn_tab_knownIds"
                            >
                                {t('pagination.known')}
                            </Pagination.Item>
                            <Pagination.Item
                                disabled={(step !== 0) && !generateNumbers}
                                active={generateNumbers !== null && generateNumbers}
                                onClick={() => { if (step == 0) setGenerateNumbers(true) }}
                                data-testid="btn_tab_generateIds"
                            >
                                {t('pagination.generate')}
                            </Pagination.Item>
                        </Pagination>
                    </Row>
                    {(generateNumbers !== null && generateNumbers) &&
                        <GeneratedWorkflow stepState={stepState} />
                    }
                    {(generateNumbers !== null && !generateNumbers) &&
                        <KnownIdsWorkflow stepState={stepState} />
                    }
                </Col>
            </Row>
        </div>
    );
}
