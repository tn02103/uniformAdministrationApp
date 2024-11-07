import { Locator, Page } from "playwright/test";

export class LoginPage {
    readonly page: Page;

    readonly sel_assosiation: Locator;
    readonly txt_username: Locator;
    readonly txt_password: Locator;

    readonly btn_login: Locator;

    constructor(page: Page) {
        this.page = page;

        this.sel_assosiation = page.locator('select[name="assosiation"]');
        this.txt_username = page.locator('input[name="username"]');
        this.txt_password = page.locator('input[name="password"]');
        this.btn_login = page.getByTestId('btn_login');
    }
}
