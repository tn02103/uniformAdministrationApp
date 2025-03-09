
"use client";

import { AutocompleteOptionType } from "@/components/AutocompleteFormField/AutocompleteField";
import AutocompleteFormField from "@/components/AutocompleteFormField/AutocompleteFormField";
import { Form } from "react-bootstrap";
import { useForm } from "react-hook-form";


export default function TestAutocompleteImplementation({ options }: { options: AutocompleteOptionType[] }) {
    const form = useForm();

    return (
        <div>
            <button type="button" className="btn btn-secondary" data-bs-container="body" data-bs-toggle="popover" data-bs-placement="left" data-bs-content="Left popover">
                Popover on left
            </button><br />
            <center>
                <form onSubmit={form.handleSubmit((data) => console.log("onSubmit", data))}>
                    <Form.Group>
                        <Form.Label>Test Field</Form.Label>
                        <Form.Control type="text" {...form.register("field1")} />
                    </Form.Group>
                    <AutocompleteFormField options={options} label="label" name={"testField"} control={form.control} />
                    <Form.Group>
                        <Form.Label>Secontd Test Field</Form.Label>
                        <Form.Control type="text" {...form.register("number", { valueAsNumber: true })} />
                    </Form.Group>
                </form>
            </center>
            <br />
            <div>
                {JSON.stringify(form.watch())}
            </div>
        </div>
    );

}