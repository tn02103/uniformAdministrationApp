import { Locator, Page } from "playwright/test";
import { PasswordPopupComponent } from "../../popups/PasswordPopup.component";

export class UserAdministrationPage {

    readonly page: Page;
    readonly btn_create: Locator;
    readonly passwordPopup: PasswordPopupComponent;

    div_user(userId: string) {
        return this.page.getByTestId(`div_user_${userId}`);
    }
    div_user_username(userId: string) {
        return this.div_user(userId).getByTestId('div_username');
    }
    div_user_name(userId: string) {
        return this.div_user(userId).getByTestId('div_name');
    }
    div_user_role(userId: string) {
        return this.div_user(userId).getByTestId('div_role');
    }
    div_user_active(userId: string) {
        return this.div_user(userId).getByTestId('div_active');
    }
    btn_user_menu(userId: string) {
        return this.div_user(userId).getByTestId('btn_menu');
    }
    btn_user_menu_edit(userId: string) {
        return this.div_user(userId).getByTestId('btn_menu_edit');
    }
    btn_user_menu_password(userId: string) {
        return this.div_user(userId).getByTestId('btn_menu_password');
    }
    btn_user_menu_delete(userId: string) {
        return this.div_user(userId).getByTestId('btn_menu_delete');
    }
    txt_user_username(userId: string) {
        return this.div_user(userId).locator('input[name="username"]');
    }
    err_user_username(userId: string) {
        return this.div_user(userId).getByTestId('err_username');
    }
    txt_user_name(userId: string) {
        return this.div_user(userId).locator('input[name="name"]');
    }
    err_user_name(userId: string) {
        return this.div_user(userId).getByTestId('err_name');
    }
    sel_user_role(userId: string) {
        return this.div_user(userId).locator('select[name="role"]');
    }
    sel_user_active(userId: string) {
        return this.div_user(userId).locator('select[name="active"]');
    }
    btn_user_save(userId: string) {
        return this.div_user(userId).getByTestId('btn_save');
    }
    btn_user_cancel(userId: string) {
        return this.div_user(userId).getByTestId('btn_cancel');
    }

    constructor(page: Page) {
        this.page = page;
        this.passwordPopup = new PasswordPopupComponent(page);

        this.btn_create = page.getByTestId('btn_create');
    }

    async openUserPasswordModal(userId: string) {
        await this.btn_user_menu(userId).click();
        await this.btn_user_menu_password(userId).click();
    }
}
