"use client"

import { useGlobalData } from "@/components/globalDataProvider";
import { useI18n } from "@/lib/locales/client";
import { UniformType } from "@/types/globalUniformTypes";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { useFormContext } from "react-hook-form";

export default function SearchFilter({ search }: { search: (data: { number: number | null, typeId?: string }) => void }) {
    const form = useFormContext();
    const t = useI18n();
    const { uniformTypeConfiguration } = useGlobalData();
    const [searchedState, setSearchedState] = useState<{
        valid: boolean,
        type: UniformType | null,
        number: number | null,
    }>();

    useEffect(() => {
        const value = form?.watch('search')?.replaceAll(' ', '')?.replaceAll('-', '');
        if (!value || value === "") {
            console.log("empty search");
            setSearchedState({ valid: true, number: null, type: null });
            return;
        }
        const firstChars = value.substring(0, 2).toLocaleUpperCase();

        if (!/^\d+$/.test(firstChars)) {
            const type = uniformTypeConfiguration?.find(t => t.acronym == firstChars);
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
    }, [form?.watch('search')]);

    const onSubmit = () => {
        console.log("is Submitting");
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
                    <Form.Control {...form.register('search')} />
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