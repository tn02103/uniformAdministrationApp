"use client";

import { ExpandableDividerArea } from "@/components/ExpandableArea/ExpandableArea";
import { useScopedI18n } from "@/lib/locales/client";
import { Col, Tab, Tabs } from "react-bootstrap";
import { InspectionHistoryTab } from "./InspectionHistoryTab";

type Props = {
    cadetId: string;
};

/**
 * Collapsible section on the cadet detail page showing extended information tabs.
 *
 * @param cadetId - ID of the cadet whose data is displayed.
 */
export const ExtendedInformationDiv = ({ cadetId }: Props) => {
    const t = useScopedI18n("cadetDetailPage.extendedInformation");

    return (
        <ExpandableDividerArea>
            <Col xs={12} className="mb-3">
                <h2 className="text-center mb-3">{t("header")}</h2>
                <Tabs defaultActiveKey="inspection">
                    <Tab eventKey="inspection" title={t("tabs.inspectionHistory")} className="border">
                        <InspectionHistoryTab cadetId={cadetId} />
                    </Tab>
                </Tabs>
            </Col>
        </ExpandableDividerArea>
    );
};