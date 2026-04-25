import { Page } from "playwright/test";
import { AnonymizationConfigComponent } from "./AnonymizationConfig.component";
import { ReturnProcessComponent } from "./ReturnProcess.component";

export class SettingsPage {

    readonly page: Page;

    readonly anonymizationConfig: AnonymizationConfigComponent;
    readonly returnProcess: ReturnProcessComponent;

    static readonly url = '/de/app/admin/settings';

    constructor(page: Page) {
        this.page = page;
        this.anonymizationConfig = new AnonymizationConfigComponent(page);
        this.returnProcess = new ReturnProcessComponent(page);
    }

    async goto() {
        await this.page.goto(SettingsPage.url);
    }
}
