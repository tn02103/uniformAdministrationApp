
export const checkDateTolerance = (date: Date) => {
    const now = new Date();
    return Math.abs(now.getTime() - date.getTime());
}
