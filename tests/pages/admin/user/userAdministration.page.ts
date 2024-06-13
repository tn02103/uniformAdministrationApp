import { Locator, Page } from "playwright/test";
import { PasswordPopupComponent } from "../../popups/PasswordPopup.component";

export class UserAdministrationPage {

    readonly page: Page;
    readonly btn_create: Locator;
    readonly passwordPopup: PasswordPopupComponent;

    div_user(userId: string) {
        return this.page.getByTestId(`div_user_${userId}`);
    }

    txt_user_username(userId: string) {
        return this.div_user(userId).locator('input[name="username"]:visible');
    }
    err_user_username(userId: string, mobile: boolean) {
        if (mobile) {
            return this.div_user(userId).getByTestId('err_username_mobile');
        } else {
            return this.div_user(userId).getByTestId('err_username');
        }
    }
    
    txt_user_name(userId: string) {
        return this.div_user(userId).locator('input[name="name"]:visible');
    }
    err_user_name(userId: string, mobile: boolean) {
        if (mobile) {
            return this.div_user(userId).getByTestId('err_name_mobile');
        } else {
            return this.div_user(userId).getByTestId('err_name');
        }
    }
    
    div_user_role(userId: string) {
        return this.div_user(userId).getByTestId('div_role');
    }
    sel_user_role(userId: string) {
        return this.div_user(userId).locator('select[name="role"]:visible');
    }
    
    div_user_active(userId: string) {
        return this.div_user(userId).getByTestId('div_active');
    }
    sel_user_active(userId: string) {
        return this.div_user(userId).locator('select[name="active"]:visible');
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
    btn_user_save(userId: string) {
        return this.div_user(userId).locator(':visible').getByTestId('btn_save');
    }
    btn_user_cancel(userId: string) {
        return this.div_user(userId).locator(':visible').getByTestId('btn_cancel');
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
