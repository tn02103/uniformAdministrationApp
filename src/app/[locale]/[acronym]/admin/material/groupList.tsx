"use client";

import { TooltipActionButton } from "@/components/TooltipIconButton";
import { Card, CardBody, CardHeader } from "@/components/card";
import { createMaterialGroup, changeMaterialGroupSortOrder } from "@/dal/material/group/_index";
import { useI18n } from "@/lib/locales/client";
import { AdministrationMaterialGroup } from "@/types/globalMaterialTypes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";

export default function MaterialConfigGroupList({
    config,
}: {
    config: AdministrationMaterialGroup[],
}) {
    const t = useI18n();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const selectedGroupId = searchParams.get("selectedGroupId");
    const editable = searchParams.get('editable') === "true";

    const handleCreateGroup = async () => createMaterialGroup().then((data) => {
        const params = new URLSearchParams();
        params.set("selectedGroupId", data.id);
        params.set("editable", "true");
        router.replace(`${pathname}?${params.toString()}`);
    }).catch((error) => {
        console.error(error);
        toast.error(t('admin.material.error.createGroup'));
    });
    const handleChangeSortOrder = async (groupId: string, up: boolean) =>
        changeMaterialGroupSortOrder({ groupId, up }).catch((error: any) => {
            console.error(error);
            toast.error(t('common.error.actions.changeSortorder'));
        });

    const handleOpenGroup = async (groupId: string) => {
        const params = new URLSearchParams();
        params.set("selectedGroupId", groupId);
        router.replace(`${pathname}?${params.toString()}`);
    }

    return (
        <Card>
            <CardHeader
                title={t('admin.material.header.groupList')}
                tooltipIconButton={
                    <TooltipActionButton
                        variantKey="create"
                        onClick={handleCreateGroup}
                        disabled={editable}
                        buttonClass="ms-2"
                        testId="btn_mGroup_create" />
                }
            />
            <CardBody>
                {config?.map((group, index) =>
                    <Row data-testid={`div_mGroup_row_${group.id}`} key={group.id} className={`border-top border-1 bg-white p-1 m-0 justify-content-between ${(selectedGroupId === group.id) ? "bg-primary-subtle" : ""}`}>
                        <Col xs={"auto"} className="p-0 py-1">
                            <TooltipActionButton
                                variantKey="moveUp"
                                onClick={() => handleChangeSortOrder(group.id, true)}
                                disabled={!group.id || (index === 0)}
                            />
                            <TooltipActionButton
                                variantKey="moveDown"
                                onClick={() => handleChangeSortOrder(group.id, false)}
                                disabled={!group.id || (index + 1) === config.length}
                            />
                        </Col>
                        <Col data-testid="div_name" className="fw-bold py-1 text-truncate">
                            {group.description}
                        </Col>
                        <Col xs="auto">
                            {(!editable && (selectedGroupId !== group.id)) &&
                                <TooltipActionButton
                                    variantKey={"open"}
                                    disabled={!group.id}
                                    onClick={() => handleOpenGroup(group.id)}
                                    buttonSize="md"
                                />
                            }
                        </Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    )
}
