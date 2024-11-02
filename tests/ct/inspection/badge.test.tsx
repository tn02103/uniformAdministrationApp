import german from "@/../public/locales/de";
import { PlannedInspectionType } from "@/actions/controllers/PlannedInspectionController";
import { InspectionBadge } from "@/app/[locale]/[acronym]/inspection/_planned/badgeCol";
import '@testing-library/jest-dom';
import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";

const defaultValues = { id: "", fk_assosiation: "", active: true, name: '', deregistrations: [] };


it('renders a heading', () => {
    render(
        <InspectionBadge inspection={null} />
    );

    const comp = screen.getByTestId('lbl_badge');
    expect(comp).toBeInTheDocument();
    expect(comp).toHaveTextContent(german.inspection.planned.badge.new);
    expect(comp).toHaveClass(/bg-success/);
});
it('planned', () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().add(2, "day").toDate(), timeStart: null, timeEnd: null }
    render(<InspectionBadge inspection={insp} />);

    const comp = screen.getByTestId('lbl_badge');
    expect(comp).toBeInTheDocument();
    expect(comp).toHaveTextContent(german.inspection.planned.badge.planned);
    expect(comp).toHaveClass(/bg-secondary/);
})

it('planned', () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().add(2, "day").toDate(), timeStart: null, timeEnd: null }
    render(<InspectionBadge inspection={insp} />);

    const comp = screen.getByTestId('lbl_badge');
    expect(comp).toBeInTheDocument();
    expect(comp).toHaveTextContent(german.inspection.planned.badge.planned);
    expect(comp).toHaveClass(/bg-secondary/);
});
it('today', () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().toDate(), timeStart: null, timeEnd: null }
    render(<InspectionBadge inspection={insp} />);

    const comp = screen.getByTestId('lbl_badge');
    expect(comp).toBeInTheDocument();
    expect(comp).toHaveTextContent(german.inspection.planned.badge.planned);
    expect(comp).toHaveClass(/bg-secondary/);
});
it('active', () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().toDate(), timeStart: dayjs().toDate(), timeEnd: null }
    render(<InspectionBadge inspection={insp} />);

    const comp = screen.getByTestId('lbl_badge');
    expect(comp).toBeInTheDocument();
    expect(comp).toHaveTextContent(german.inspection.planned.badge.active);
    expect(comp).toHaveClass(/bg-success/);
});
it('finished', () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().toDate(), timeStart: dayjs().toDate(), timeEnd: dayjs().toDate() }
    render(<InspectionBadge inspection={insp} />);

    const comp = screen.getByTestId('lbl_badge');
    expect(comp).toBeInTheDocument();
    expect(comp).toHaveTextContent(german.inspection.planned.badge.finished);
    expect(comp).toHaveClass(/bg-success/);
});
it('expired', () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().subtract(2, "day").toDate(), timeStart: null, timeEnd: null }
    render(<InspectionBadge inspection={insp} />);

    const comp = screen.getByTestId('lbl_badge');
    expect(comp).toBeInTheDocument();
    expect(comp).toHaveTextContent(german.inspection.planned.badge.expired);
    expect(comp).toHaveClass(/bg-danger/);
});
it('unfinished', () => {
    const insp: PlannedInspectionType = { ...defaultValues, date: dayjs().subtract(2, "day").toDate(), timeStart: dayjs().toDate(), timeEnd: null }
    render(<InspectionBadge inspection={insp} />);

    const comp = screen.getByTestId('lbl_badge');
    expect(comp).toBeInTheDocument();
    expect(comp).toHaveTextContent(german.inspection.planned.badge.unfinished);
    expect(comp).toHaveClass(/bg-warning/);
});