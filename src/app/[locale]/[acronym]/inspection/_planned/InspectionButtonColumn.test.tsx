import { InspectionButtonColumn } from "@/app/[locale]/[acronym]/inspection/_planned/InspectionButtonColumn";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import '@testing-library/jest-dom';
import { render, screen } from "@testing-library/react";
import dayjs from "@/lib/dayjs";

const defaultValues: PlannedInspectionType = {
    id: "",
    name: '',
    deregistrations: [],
    timeStart: null,
    timeEnd: null,
    date: dayjs().format('YYYY-MM-DD'),
};

const getFunctions = () => ({
    mockCancel: jest.fn(),
    mockDelete: jest.fn(),
    mockEdit: jest.fn(),
    mockFinish: jest.fn(),
    mockStart: jest.fn(),
    mockSubmit: jest.fn(e => e.preventDefault()),
});
const renderButton = (inspection: PlannedInspectionType, editable?: boolean) => {
    const functions = getFunctions();
    render(
        <form onSubmit={functions.mockSubmit}>
            <InspectionButtonColumn
                inspection={inspection}
                editable={!!editable}
                handleCancel={functions.mockCancel}
                handleDelete={functions.mockDelete}
                handleEdit={functions.mockEdit}
                handleFinish={functions.mockFinish}
                handleStart={functions.mockStart} />
        </form>
    );
    return functions;
}

describe('<InspectionButtonColumn/>', () => {

    it('planned', () => {
        const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().add(2, "day").format('YYYY-MM-DD') }
        const {mockEdit, mockSubmit, mockDelete} = renderButton(insp);

        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(2);

        expect(screen.getByRole('button', { name: 'edit' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'delete' })).toBeVisible();

        screen.getByRole('button', { name: 'edit' }).click();
        expect(mockEdit).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
        screen.getByRole('button', { name: 'delete' }).click();
        expect(mockDelete).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
    });
    it('today', async () => {
        const insp: PlannedInspectionType = defaultValues
        const {mockEdit, mockSubmit, mockDelete, mockStart} = renderButton(insp);

        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(3);

        expect(screen.getByRole('button', { name: 'edit' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'delete' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'start inspection' })).toBeVisible();

        screen.getByRole('button', { name: 'edit' }).click();
        expect(mockEdit).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
        screen.getByRole('button', { name: 'delete' }).click();
        expect(mockDelete).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
        screen.getByRole('button', { name: 'start inspection' }).click();
        expect(mockStart).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('active', async () => {
        const insp: PlannedInspectionType = {
            ...defaultValues,
            timeStart: '09:00',
        }
        const {mockFinish, mockSubmit} = renderButton(insp);

        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(1);

        expect(screen.getByRole('button', { name: 'finish inspection' })).toBeVisible();
        screen.getByRole('button', { name: 'finish inspection' }).click();
        expect(mockFinish).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
    });
    it('finished', async () => {
        const insp: PlannedInspectionType = {
            ...defaultValues,
            timeStart: '09:00',
            timeEnd: '12:00'
        };
        const {mockStart, mockSubmit} = renderButton(insp);

        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'restart inspection' })).toBeVisible();

        screen.getByRole('button', { name: 'restart inspection' }).click();
        expect(mockStart).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
    });
    it('unfinised', async () => {
        const insp: PlannedInspectionType = {
            ...defaultValues,
            date: dayjs().subtract(2, "day").format('YYYY-MM-DD'),
            timeStart: '09:00',
        }
        const {mockFinish, mockSubmit} = renderButton(insp);

        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(1);

        expect(screen.getByRole('button', { name: 'finish inspection' })).toBeVisible();

        screen.getByRole('button', { name: 'finish inspection' }).click();
        expect(mockFinish).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
    });
    it('expired', async () => {
        const insp: PlannedInspectionType = {
            ...defaultValues,
            date: dayjs().subtract(2, "day").format('YYYY-MM-DD'),
        };
        const {mockEdit, mockSubmit, mockDelete} = renderButton(insp);

        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(2);

        expect(screen.getByRole('button', { name: 'edit' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'delete' })).toBeVisible();

        screen.getByRole('button', { name: 'edit' }).click();
        expect(mockEdit).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
        screen.getByRole('button', { name: 'delete' }).click();
        expect(mockDelete).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();
    });
    it('editable', async () => {
        const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().add(2, "day").format('YYYY-MM-DD'), }
        const {mockCancel, mockSubmit} = renderButton(insp, true);

        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(2);

        expect(screen.getByRole('button', { name: 'save' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'cancel' })).toBeVisible();

        screen.getByRole('button', { name: 'cancel' }).click();
        expect(mockCancel).toHaveBeenCalled();
        expect(mockSubmit).not.toHaveBeenCalled();

        screen.getByRole('button', { name: 'save' }).click();
        expect(mockSubmit).toHaveBeenCalled();
    });
});
