"use client"
import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { UniformSize, UniformType } from "@/types/globalUniformTypes";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import Filter from "./filter";
import SearchFilter from "./searchFilter";


export type FilterType = {
    generations: { [key in string]: boolean },
    sizes: { [key in string]: boolean },
    active: boolean,
    passive: boolean,
    withOwner: boolean,
    withoutOwner: boolean,
    all?: {
        generations: boolean | null,
        sizes: boolean | null,
    }
}


export default function FilterPanel({
    uniformType,
    sizeList,
}: {
    uniformType?: UniformType;
    sizeList: UniformSize[];
}) {
    const searchForm = useForm();
    const router = useRouter();
    const t = useI18n();

    const { typeList } = useUniformTypeList();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.has('search')) {
            searchForm.reset({
                search: searchParams.get('search')
            });
        }
    }, [searchParams.get('search')]);

    function changeUniformType(typeId: string) {
        router.replace(`/app/uniform/list/${typeId}`);
    }
    function search({ typeId, number }: { number: number | null, typeId?: string }) {
        const params = new URLSearchParams(searchParams.toString());
        if (number) {
            params.set("search", String(number));
        } else {
            params.delete("search");
        }

        router.replace(`/app/uniform/list/${typeId ? typeId : uniformType?.id}?${params.toString()}`);
    }

    return (
        <>
            <Row className="mt-xl-4 border-1 justify-content-around">
                <Col xl={12} className="pb-2 pt-2 justify-content-center d-flex">
                    <Form.Select
                        className="w-auto text-center fw-bold m-0"
                        data-testid={"sel_type"}
                        //placeholder="UniformTyp"
                        onChange={(e) => { changeUniformType(e.target.value); }}
                        value={uniformType ? uniformType.id : "null"}
                    >
                        <option disabled value={"null"}>{t('common.error.pleaseSelect')}</option>
                        {typeList?.map(type => {
                            return (
                                <option key={"typeOption" + type.id} value={type.id}>
                                    ({type.acronym}) {type.name}
                                </option>
                            );
                        })}
                    </Form.Select>
                </Col>
                <Col xs={12} sm={6} md={4} xl={12} className="my-4">
                    <FormProvider {...searchForm}>
                        <SearchFilter search={search} />
                    </FormProvider>
                </Col>
                {uniformType &&
                    <Col xs={12} sm={6} md={4} xl={12}>
                        <Filter uniformType={uniformType} sizeList={sizeList} />
                    </Col>
                }
            </Row>
        </>
    )
}
