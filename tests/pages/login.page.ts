import { Locator, Page } from "playwright/test";
import { testAssosiationList } from "../testData/newStaticData";

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

    public async adminLogin(url?: string) {
        await this.login("test4", process.env.TEST_USER_PASSWORD as string, url);
    }

    public async materialLogin(url?: string) {
        await this.login("test3", process.env.TEST_USER_PASSWORD as string, url);
    }

    public async inspectorLogin(url?: string) {
        await this.login("test2", process.env.TEST_USER_PASSWORD as string, url);
    }

    public async userLogin(url?: string) {
        await this.login("test1", process.env.TEST_USER_PASSWORD as string, url);
    }

    async login(user: string, password: string, url?: string) {
        const i = Number(process.env.TEST_PARALLEL_INDEX ?? 0);
        const assosiation = testAssosiationList[i];
        await this.page.goto(url ?? '/de/login');
        await this.page.waitForTimeout(2000);
        await this.sel_assosiation.selectOption(assosiation.id);
        await this.txt_username.fill(user);
        await this.txt_password.fill(password);
        await this.btn_login.click();
        await this.page.waitForSelector('div[data-testid="div_sidebar"]');
    }
}
