import { Locator, Page } from "playwright";


export class ToastTestComponent {
    
    readonly page: Page;

    readonly toast: Locator;
    readonly toast_success: Locator;
    readonly toast_error: Locator;

    constructor(page: Page) {
        this.page = page;
        this.toast = page.locator('.Toastify__toast--success');
        this.toast_success = page.locator('.Toastify__toast--success');
        this.toast_error = page.locator('.Toastify__toast--error');
    }
}