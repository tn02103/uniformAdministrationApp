import { Html } from "@react-email/html";
import { render } from "@react-email/render";
import { prisma } from "../db";
import { getScopedI18n } from "../locales/config";
import { getMailAgend } from "./mailagend";

export const sendTokenReuseDetectedEmail = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organisation: true }
    });
    if (!user) {
        console.error(`sendTokenReuseDetectedEmail: User with id ${userId} not found`);
        return;
    }

    try {
        await getMailAgend().sendMail({
            to: user.email,
            subject: "Ihr UniformAdmin Benutzerkonto wurde gesperrt",
            html: await render(UserTokenReuseEmailBody({ name: user.name })),
        });
    } catch (error) {
        console.error(`sendTokenReuseDetectedEmail: Failed to send email to user ${user.email}`, error);
    }
    if (process.env.DEVELOPER_NOTIFICATION_EMAILS) {
        try {
            await getMailAgend().sendMail({
                to: process.env.DEVELOPER_NOTIFICATION_EMAILS?.split(","),
                subject: "Ein Benutzerkonto Ihrer Organisation wurde gesperrt",
                html: await render(DeveloperTokenReuseEmailBody(user.email)),
            });
        } catch (error) {
            console.error(`sendTokenReuseDetectedEmail: Failed to send email to developers`, error);
        }
    }
}

const UserTokenReuseEmailBody = async ({ name }: { name: string }) => {
    const t = await getScopedI18n("emails.tokenReuseDetected");
    return (
        <Html>
            <h1>{t("greeting", { name })}</h1>
            <span>{t("line1")}</span><br />
            <span>{t("line2")}</span><br />
            <span>{t("line3")}</span><br />
            <span>{t("line4")}</span><br />
        </Html>
    )
}

const DeveloperTokenReuseEmailBody = (userEmail: string) => {
    return (
        <Html>
            <h1>Benachrichtigung: Verdächtige Token-Wiederverwendung erkannt</h1>
            <span>Das Benutzerkonto mit der E-Mail {userEmail} hat eine verdächtige Wiederverwendung eines Refresh-Tokens festgestellt.</span><br />
            <span>Alle aktiven Sitzungen und Refresh-Tokens für dieses Konto wurden widerrufen.</span><br />
            <span>Bitte überprüfen Sie die Sicherheitsprotokolle und kontaktieren Sie den Benutzer bei Bedarf.</span><br />
        </Html>
    )
}