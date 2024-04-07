import { Locator, ViewportSize } from "playwright/test";

export function getTextColor(l: Locator) {
    return l.first().evaluate((el) => getComputedStyle(el).color);
}
export const defaultTextColor = 'rgb(33, 37, 41)';

export const viewports: { [key in string]: ViewportSize } = {
    xs: { width: 500, height: 1000 },
    sm: { width: 600, height: 1000 },
    md: { width: 800, height: 1000 },
    lg: { width: 1000, height: 1000 },
    xl: { width: 1300, height: 1000 },
    xxl: { width: 1500, height: 1000 }
}
