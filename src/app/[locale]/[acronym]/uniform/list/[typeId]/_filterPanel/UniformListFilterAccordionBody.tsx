"use client"

import { useI18n } from "@/lib/locales/client";
import React from "react";
import { Accordion, Form } from "react-bootstrap";
import { Path, useFormContext } from "react-hook-form";
import { FilterType } from "./UniformListSidePanel";

type Item =  {
    id: string,
    name: string,
    sortOrder?: number,
}
type FilterAccordionBodyProps = {
    itemList: Item[],
    name: "generations" | "sizes"
}
export function UniformListFilterAccordionBody({ itemList, name }: FilterAccordionBodyProps) {
    const { register, getValues, setValue, watch } = useFormContext<FilterType>();
    const t = useI18n();

    const change = (e: React.MouseEvent) => {
        const target = e.target as HTMLInputElement;
        const value = getValues(target.name as Path<FilterType>);
        setValue(target.name as Path<FilterType>, !value);

        const list = watch(name);
        if (!list) {
            return;
        }
        if (Object.values(list).every(x => x === true)) {
            setValue(`all.${name}`, true);
        } else if (Object.values(list).every(x => !x)) {
            setValue(`all.${name}`, false);
        } else {
            setValue(`all.${name}`, null);
        }
    }

    const selectAll = (checked: boolean) => {
        const list = getValues(name);
        if (!list)
            return;
        const newObject: Record<string, boolean> = {};

        Object.keys(list).forEach((key) => { newObject[key] = !!checked });
        setValue(name, newObject);
    }

    return (
        <Accordion.Body>
            <Form.Check
                label={t('uniformList.selectAll')}
                id={`uniformListFilter-selectAll-${name}`}
                onClick={(e) => selectAll((e.target as HTMLInputElement).checked)}
                {...register(`all.${name}`)} />
            <Form.Check
                label={"K.A."}
                id={`uniformListFilter-ka-${name}`}
                onClick={change}
                {...register(`${name}.null`)} />
            <div className="overflow-y-auto text-truncate" style={{ maxHeight: "200px" }}>
                {itemList.map((item) => (
                    <Form.Check
                        key={name + item.id}
                        id={`uniformListFilter-${name}-${item.id}`}
                        label={item.name}
                        onClick={change}
                        className="text-truncate"
                        {...register(`${name}.${item.id}`)} />
                ))}
            </div>
        </Accordion.Body>
    )
}
