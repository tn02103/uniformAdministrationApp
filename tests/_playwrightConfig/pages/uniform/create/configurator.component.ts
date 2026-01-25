import { Locator, Page } from "playwright";

export class CreateUniformConfiguratorComponent {
    readonly page: Page;

    readonly div_configurator: Locator;
    readonly btn_continue: Locator;

    readonly sel_type: Locator;
    readonly sel_generation: Locator;
    readonly sel_size: Locator;
    readonly chk_isReserve: Locator;
    readonly txt_comment: Locator

    sel_type_option(id: string) {
        return this.sel_type.locator(`option[value="${id}"]`);
    }
    sel_generation_option(id: string) {
        return this.sel_generation.locator(`option[value="${id}"]`);
    }
    sel_size_option(id: string) {
        return this.sel_size.locator(`option[value="${id}"]`);
    }

    constructor(page: Page) {
        this.page = page;

        this.div_configurator = page.getByTestId('div_configurator');
        this.btn_continue = this.div_configurator.getByTestId('btn_continue');

        this.sel_type = this.div_configurator.locator('select[name="typeId"]');
        this.sel_generation = this.div_configurator.locator('select[name="generationId"]');
        this.sel_size = this.div_configurator.locator('select[name="sizeId"]');
        this.chk_isReserve = this.div_configurator.locator('input[name="isReserve"]');
        this.txt_comment = this.div_configurator.locator('textarea[name="comment"]');
    }
}
