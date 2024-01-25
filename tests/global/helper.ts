import { Locator } from "playwright/test";

export function getTextColor(l: Locator) {
    return l.first().evaluate((el) => getComputedStyle(el).color);
}
export const defaultTextColor = 'rgb(33, 37, 41)';
