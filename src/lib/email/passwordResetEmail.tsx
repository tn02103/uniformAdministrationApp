import { User } from "@/prisma/client";
import { Html } from "@react-email/html";
import { render } from "@react-email/render";
import { getScopedI18n } from "../locales/config";
import { getMailAgend } from "./mailagend";


export const sendPasswordResetEmail = async (user: User, resetLink: string) => {
    const t = await getScopedI18n("emails.passwordReset");
    try {
        await getMailAgend().sendMail({
            to: user.email,
            subject: t("subject"),
            html: await render(await emailBody(resetLink)),
        });
    } catch (error) {
        console.error(`sendPasswordResetEmail: Failed to send email to ${user.email}`, error);
        throw error;
    }
};

const emailBody = async (resetLink: string) => {
    const t = await getScopedI18n("emails.passwordReset");
    return (
        <Html>
            <h1>{t("heading")}</h1>
            <p>{t("body")}</p>
            <a href={resetLink}>{t("linkText")}</a>
            <br />
            <span>{t("validity")}</span>
        </Html>
    );
};
