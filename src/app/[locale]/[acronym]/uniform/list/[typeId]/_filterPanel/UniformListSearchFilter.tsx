"use client"

import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { UniformType } from "@/types/globalUniformTypes";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useFormContext, useWatch } from "react-hook-form";

export function UniformListSearchFilter({ search }: { search: (data: { number: number | null, typeId?: string }) => void }) {
    const form = useFormContext();
    const t = useI18n();
    const { typeList } = useUniformTypeList();
    const [searchedState, setSearchedState] = useState<{
        valid: boolean,
        type: UniformType | null,
        number: number | null,
    }>();

    const searchTerm = useWatch({name: "search"});
    useEffect(() => {
        const value = searchTerm?.replaceAll(' ', '')?.replaceAll('-', '');
        if (!value || value === "") {
            setSearchedState({ valid: true, number: null, type: null });
            return;
        }
        const firstChars = value.substring(0, 2).toLocaleUpperCase();

        if (!/^\d+$/.test(firstChars)) {
            const type = typeList?.find(t => t.acronym == firstChars);
            if (!type) {
                setSearchedState({ valid: false, number: null, type: null });
                return;
            }

            const number = value.substring(2);
            if (Number.isInteger(+number)) {
                setSearchedState({ valid: true, number: +number, type });
            } else {
                setSearchedState({ valid: false, number: null, type: type });
            }
        } else {
            if (/^\d+$/.test(value)) {
                setSearchedState({ valid: true, number: +value, type: null });
            } else {
                setSearchedState({ valid: false, number: null, type: null });
            }
        }
    }, [searchTerm, typeList]);

    const onSubmit = () => {
        if (searchedState?.valid) {
            search({
                typeId: searchedState.type?.id,
                number: searchedState.number,
            });
        }
    }
    return (
        <Form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="fs-5 text-center fw-bold">{t('uniformList.search.label')}</div>
            {
                (searchedState && !searchedState.valid)
                    ? <div className="fs-7 text-danger" data-testid="err_search_invalidInput">
                        {t('uniformList.search.invalid')}
                    </div>
                    : <div className="fs-7" data-testid="div_search_helptext">
                        {searchedState?.type?.name} {searchedState?.type ? "-" : ""} {searchedState?.number} &nbsp;
                    </div>
            }
            <Row>
                <Col className="pe-0">
                    <Form.Control {...form.register('search')} inputMode="search" placeholder="123 | AA-123 | AA123" />
                </Col>
                <Col xs={"auto"} className="p-0 me-3">
                    <Button type="submit" variant="outline-seccondary" data-testid="btn_search_submit">
                        <FontAwesomeIcon icon={faSearch} />
                    </Button>
                </Col>
            </Row>
        </Form>
    )
}