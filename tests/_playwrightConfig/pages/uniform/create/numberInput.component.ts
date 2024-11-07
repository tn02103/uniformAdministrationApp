import { Locator, Page } from "playwright";

export class NubmerInputComponent {

    readonly page: Page;

    readonly div_numberInput: Locator;
    readonly txt_numStart: Locator;
    readonly txt_numEnd: Locator;
    readonly err_numStart: Locator;
    readonly err_numEnd: Locator;
    readonly btn_numAdd: Locator;

    readonly btn_create: Locator;
    readonly btn_back: Locator;

    constructor(page: Page) {
        this.page = page;
        this.div_numberInput = page.locator('div[id="numberInput"]');

        this.txt_numStart = this.div_numberInput.locator('input[name="numberStart"]');
        this.txt_numEnd = this.div_numberInput.locator('input[name="numberEnd"]');
        this.err_numStart = this.div_numberInput.getByTestId('err_numStart');
        this.err_numEnd = this.div_numberInput.getByTestId('err_numEnd');

        this.btn_numAdd = this.div_numberInput.getByTestId('btn_numAdd');
        this.btn_back = this.div_numberInput.getByTestId('btn_back');
        this.btn_create = this.div_numberInput.getByTestId('btn_create');
    }

    /**
     * div_number
     */
    public div_number(number: number) {
        return this.div_numberInput.getByTestId(`div_number_${number}`);
    }

    public btn_number_remove(number: number) {
        return this.div_number(number).getByRole('button');
    }
}
