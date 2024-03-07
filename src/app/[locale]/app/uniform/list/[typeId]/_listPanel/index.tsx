"use client";

import { useI18n } from "@/lib/locales/client";
import { UniformType, UniformWithOwner } from "@/types/globalUniformTypes";
import { useEffect, useState } from "react";
import { Button, Table } from "react-bootstrap";
import { useSessionStorage } from "usehooks-ts";
import TableLine from "./tableLine";
import { getUniformListWithOwner } from "@/actions/uniform/list";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterType } from "../_filterPanel";
import { error } from "console";

export default function ListPanel({
    uniformType,
}: {
    uniformType: UniformType | null;
}) {
    const t = useI18n();
    const router = useRouter();

    const [uniformList, setUniformList] = useState<UniformWithOwner[]>([]);
    const [filter,] = useSessionStorage<FilterType | null>(`filter_${uniformType?.id}`, null);
    const searchParams = useSearchParams();
    const pathname = usePathname();

    async function loadData() {
        if (!uniformType)
            return;

        const orderBy = searchParams.get('orderBy') ?? "number";
        const asc = searchParams.get('asc') ?? "true";
        await getUniformListWithOwner(uniformType.id, orderBy, (asc === "true"), filter).then((data) => {
            if (data) {
                setUniformList(data);
            }
        }).catch(console.error);
    }

    useEffect(() => {
        loadData();
    }, [filter, searchParams])

    function changeSortOrder(orderBy: string) {
        const urlOrderBy = searchParams.get('orderBy') ?? "number";
        const params = new URLSearchParams(searchParams.toString());


        if (urlOrderBy === orderBy) {
            params.set('asc', String(searchParams.get('asc') === "false"));
        } else {
            params.set('orderBy', orderBy);
            params.set('asc', 'true');
        }
        router.push(`${pathname}?${params.toString()}`);
    }

    const filteredLines = uniformList
        ?.filter((d) => (!searchParams.has('search') || String(d.number).includes(searchParams.get('search')!)));

    return (
        <Table striped hover>
            <thead className="topoffset-nav sticky-top bg-white">
                <tr className=" ">
                    <th className="col-2 col-sm-1 d-md-none fs-7 fw-normal align-middle ps-2 ms-auto">{uniformList ? t('uniformList.numberOfEntries', { count: filteredLines.length }) : ""}</th>
                    <th className="col-3 col-sm-1 px-0">
                        <TableHeaderButton
                            testId="btn_header_number"
                            label={t('common.uniform.number')}
                            onClick={() => changeSortOrder("number")} />
                    </th>
                    {uniformType?.usingGenerations &&
                        <th className="d-none d-sm-table-cell col-sm-4 col-md-2 ">
                            <TableHeaderButton
                                testId="btn_header_generation"
                                label={t('common.uniform.generation')}
                                onClick={() => changeSortOrder("generation")} />
                        </th>}
                    {uniformType?.usingSizes &&
                        <th className="d-none d-sm-table-cell col-2 col-sm-1">
                            <TableHeaderButton
                                testId="btn_header_size"
                                label={t('common.uniform.size')}
                                onClick={() => changeSortOrder("size")} />
                        </th>}
                    <th className="col-7 col-sm-4 col-md-3">
                        <TableHeaderButton
                            testId="btn_header_owner"
                            label={t('common.uniform.owner')}
                            onClick={() => changeSortOrder("owner")} />
                    </th>
                    <th className="d-none d-md-table-cell col-3">
                        <TableHeaderButton
                            testId="btn_header_comment"
                            label={t('common.comment')}
                            onClick={() => changeSortOrder("comment")} />
                    </th>
                    <th data-testid="div_header_count"
                        className="d-none d-md-table-cell col-md-2 col-lg-1 col-xl-2 col-xxl-1 fs-7 fw-normal align-middle justify-self-end ps-2 ms-auto"
                    >
                        {uniformList ? t('uniformList.numberOfEntries', { count: filteredLines.length }) : ""}
                    </th>
                </tr>
            </thead>
            <tbody>
                {(uniformType && filteredLines && filteredLines.length > 0)
                    ? filteredLines.map((uniform) => {
                        return (
                            <TableLine
                                key={"tableLine" + uniform.id}
                                uniform={uniform}
                                uniformType={uniformType}
                                searchString={searchParams.get('search')!}
                            />
                        );
                    })
                    : <tr className="fs-4 fw-bold p-3">
                        <td colSpan={5} data-testid="div_nodata">{t('uniformList.noData')}</td>
                    </tr>}
            </tbody>
        </Table>
    )
}

type TableHeaderPropType = {
    label: string,
    onClick: () => void,
    testId: string;
}
const TableHeaderButton = ({ label, onClick, testId }: TableHeaderPropType) => {
    return (
        <Button
            variant="outline-secondary"
            className="border-0 text-dark fw-bold align-text-bottom p-1"
            onClick={onClick}
            data-testid={testId}>
            {label}
        </Button>
    )
}