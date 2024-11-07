import { InspectionButtonColumn } from "@/app/[locale]/[acronym]/inspection/_planned/InspectionButtonColumn";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import '@testing-library/jest-dom';
import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";

const defaultValues: PlannedInspectionType = {
    id: "",
    name: '',
    deregistrations: [],
    timeStart: null,
    timeEnd: null,
    date: new Date(),
};

const getFunctions = () => ({
    cancel: jest.fn(),
    delete: jest.fn(),
    edit: jest.fn(),
    finish: jest.fn(),
    start: jest.fn(),
    submit: jest.fn(e => e.preventDefault()),
});
const renderButton = (inspection: PlannedInspectionType, editable?: boolean, nameDuplicationError?: boolean) => {
    const functions = getFunctions();
    render(
        <form onSubmit={functions.submit}>
            <InspectionButtonColumn
                inspection={inspection}
                editable={!!editable}
                nameDuplicationError={!!nameDuplicationError}
                handleCancel={functions.cancel}
                handleDelete={functions.delete}
                handleEdit={functions.edit}
                handleFinish={functions.finish}
                handleStart={functions.start} />
        </form>
    );
    return functions;
}

it('planned', () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().add(2, "day").toDate() }
    const functions = renderButton(insp);

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(2);

    expect(screen.getByRole('button', { name: 'edit' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'delete' })).toBeVisible();

    screen.getByRole('button', { name: 'edit' }).click();
    expect(functions.edit).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'delete' }).click();
    expect(functions.delete).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
});
it('today', async () => {
    const insp: PlannedInspectionType = defaultValues
    const functions = renderButton(insp);

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(3);

    expect(screen.getByRole('button', { name: 'edit' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'delete' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'start inspection' })).toBeVisible();

    screen.getByRole('button', { name: 'edit' }).click();
    expect(functions.edit).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'delete' }).click();
    expect(functions.delete).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'start inspection' }).click();
    expect(functions.start).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
});

it('active', async () => {
    const insp: PlannedInspectionType = {
        ...defaultValues,
        timeStart: dayjs('09:00', "HH:mm").toDate(),
    }
    const functions = renderButton(insp);

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(1);

    expect(screen.getByRole('button', { name: 'finish inspection' })).toBeVisible();
    screen.getByRole('button', { name: 'finish inspection' }).click();
    expect(functions.finish).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
});
it('finished', async () => {
    const insp: PlannedInspectionType = {
        ...defaultValues,
        timeStart: dayjs('09:00', 'HH:mm').toDate(),
        timeEnd: dayjs('12:00', 'HH:mm').toDate()
    };
    const functions = renderButton(insp);

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'restart inspection' })).toBeVisible();

    screen.getByRole('button', { name: 'restart inspection' }).click();
    expect(functions.start).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
});
it('unfinised', async () => {
    const insp: PlannedInspectionType = {
        ...defaultValues,
        date: dayjs().subtract(2, "day").toDate(),
        timeStart: dayjs('09:00', 'HH:mm').toDate(),
    }
    const functions = renderButton(insp);

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(1);

    expect(screen.getByRole('button', { name: 'finish inspection' })).toBeVisible();

    screen.getByRole('button', { name: 'finish inspection' }).click();
    expect(functions.finish).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
});
it('expired', async () => {
    const insp: PlannedInspectionType = {
        ...defaultValues,
        date: dayjs().subtract(2, "day").toDate(),
    };
    const functions = renderButton(insp);

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(2);

    expect(screen.getByRole('button', { name: 'edit' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'delete' })).toBeVisible();

    screen.getByRole('button', { name: 'edit' }).click();
    expect(functions.edit).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'delete' }).click();
    expect(functions.delete).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
});
it('editable', async () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().add(2, "day").toDate() }
    const functions = renderButton(insp, true);

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(2);

    expect(screen.getByRole('button', { name: 'save' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeVisible();

    screen.getByRole('button', { name: 'cancel' }).click();
    expect(functions.cancel).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();

    screen.getByRole('button', { name: 'save' }).click();
    expect(functions.submit).toHaveBeenCalled();
});
it('editable nameDuplicationError', async () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().add(2, "day").toDate() }
    const functions = renderButton(insp, true, true);

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(2);

    expect(screen.getByRole('button', { name: 'save' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();

    screen.getByRole('button', { name: 'cancel' }).click();
    expect(functions.cancel).toHaveBeenCalled();
    expect(functions.submit).not.toHaveBeenCalled();
});
