"use client"

import { useI18n } from "@/lib/locales/client";
import React, { useEffect } from "react";
import { Accordion, Form } from "react-bootstrap";
import { Controller, Path, useFormContext, useWatch } from "react-hook-form";
import { FilterType } from "./UniformListSidePanel";

type Item = {
    id: string,
    name: string,
    sortOrder?: number,
}
type FilterAccordionBodyProps = {
    itemList: Item[],
    name: "generations" | "sizes"
}
export function UniformListFilterAccordionBody({ itemList, name }: FilterAccordionBodyProps) {
    const { control, getValues, setValue } = useFormContext<FilterType>();
    const t = useI18n();
    const allPath = `all.${name}` as Path<FilterType>;
    const list = useWatch({ control, name }) as Record<string, boolean> | undefined;
    const allValue = useWatch({ control, name: allPath }) as boolean | null | undefined;

    useEffect(() => {
        if (!list) {
            return;
        }
        const values = Object.values(list);
        if (values.length === 0) {
            return;
        }

        const nextAllValue = values.every((value) => value)
            ? true
            : values.every((value) => !value)
                ? false
                : null;

        if (allValue !== nextAllValue) {
            setValue(allPath, nextAllValue, { shouldDirty: true });
        }
    }, [allPath, allValue, list, setValue]);

    const selectAll = (checked: boolean) => {
        const currentList = getValues(name);
        if (!currentList) {
            return;
        }

        Object.keys(currentList).forEach((key) => {
            const fieldPath = `${name}.${key}` as Path<FilterType>;
            setValue(fieldPath, checked, { shouldDirty: true });
        });
        setValue(allPath, checked, { shouldDirty: true });
    };

    const onSelectAllRef = (element: HTMLInputElement | null) => {
        if (!element) {
            return;
        }
        element.indeterminate = allValue === null;
    };

    const renderItemCheck = (path: Path<FilterType>, id: string, label: string, className?: string) => (
        <Controller
            key={id}
            control={control}
            name={path}
            render={({ field }) => (
                <Form.Check
                    id={id}
                    label={label}
                    className={className}
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    name={field.name}
                    ref={field.ref}
                />
            )}
        />
    );

    return (
        <Accordion.Body className="overflow-y-auto text-truncate" style={{ maxHeight: "300px" }}>
            <Controller
                control={control}
                name={allPath}
                render={({ field }) => (
                    <Form.Check
                        label={t('uniformList.selectAll')}
                        id={`uniformListFilter-selectAll-${name}`}
                        checked={field.value === true}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            field.onChange(checked);
                            selectAll(checked);
                        }}
                        name={field.name}
                        ref={(element) => {
                            field.ref(element);
                            onSelectAllRef(element);
                        }}
                    />
                )}
            />
            {renderItemCheck(`${name}.null` as Path<FilterType>, `uniformListFilter-ka-${name}`, "K.A.")}
            {itemList.map((item) => (
                renderItemCheck(
                    `${name}.${item.id}` as Path<FilterType>,
                    `uniformListFilter-${name}-${item.id}`,
                    item.name,
                )
            ))}
        </Accordion.Body>
    )
}
