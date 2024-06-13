import { Locator, Page } from "playwright";

class GenerateStep2Component {

    readonly page: Page;
    readonly div_step2: Locator;

    readonly btn_back: Locator;
    readonly btn_create: Locator;

    div_size(sizeId: string) {
        return this.div_step2.getByTestId(`div_size_${sizeId}`);
    }
    chk_size_number(sizeId: string, number: number | string) {
        return this.div_size(sizeId).locator(`input[name="${number}"]`);
    }

    constructor(page: Page) {
        this.page = page;
        this.div_step2 = page.locator(`div[id="step2"]`);

        this.btn_back = this.div_step2.getByTestId('btn_back');
        this.btn_create = this.div_step2.getByTestId('btn_create');
    }
}

export default GenerateStep2Component;
