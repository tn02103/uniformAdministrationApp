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

// Draft 2: Navy header + orange accent + bordered callout
const emailBody = async (resetLink: string) => {
    const t = await getScopedI18n("emails.passwordReset");
    return (
        <Html lang="de">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style={{ margin: 0, padding: 0, backgroundColor: "#eef1f7", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#eef1f7", padding: "40px 16px" }}>
                    <tbody>
                        <tr>
                            <td align="center">
                                <table width="580" cellPadding={0} cellSpacing={0} style={{ maxWidth: "580px", width: "100%" }}>
                                    <tbody>
                                        {/* Navy header */}
                                        <tr>
                                            <td style={{ backgroundColor: "#01153e", padding: "32px 40px 28px", borderRadius: "8px 8px 0 0" }}>
                                                <table width="100%" cellPadding={0} cellSpacing={0}>
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <p style={{ margin: "0 0 4px", color: "#9dbdff", fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "1.5px" }}>
                                                                    UniformAdmin
                                                                </p>
                                                                <h1 style={{ margin: 0, color: "#ffffff", fontSize: "24px", fontWeight: "bold" }}>
                                                                    {t("heading")}
                                                                </h1>
                                                            </td>
                                                            <td align="right" style={{ verticalAlign: "middle" }}>
                                                                <div style={{ width: "48px", height: "48px", backgroundColor: "#2C4B8A", borderRadius: "50%", fontSize: "22px", lineHeight: "48px", textAlign: "center" as const }}>
                                                                    🔒
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>

                                        {/* Orange accent stripe */}
                                        <tr>
                                            <td style={{ backgroundColor: "#FF5E0E", height: "4px", fontSize: "1px", lineHeight: "4px" }}>&nbsp;</td>
                                        </tr>

                                        {/* White body */}
                                        <tr>
                                            <td style={{ backgroundColor: "#ffffff", padding: "40px 40px 28px" }}>
                                                <p style={{ margin: "0 0 20px", fontSize: "15px", lineHeight: "1.6", color: "#333333" }}>
                                                    {t("body")}
                                                </p>

                                                {/* Bordered callout with CTA */}
                                                <table width="100%" cellPadding={0} cellSpacing={0}>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ backgroundColor: "#f8f9fc", borderLeft: "4px solid #FF5E0E", borderRadius: "0 6px 6px 0", padding: "20px 24px" }}>
                                                                <a
                                                                    href={resetLink}
                                                                    style={{
                                                                        display: "inline-block",
                                                                        backgroundColor: "#FF5E0E",
                                                                        color: "#ffffff",
                                                                        fontWeight: "bold",
                                                                        fontSize: "15px",
                                                                        textDecoration: "none",
                                                                        padding: "12px 28px",
                                                                        borderRadius: "6px",
                                                                    }}
                                                                >
                                                                    {t("linkText")}
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>

                                        {/* Security notice */}
                                        <tr>
                                            <td style={{ backgroundColor: "#f8f9fc", padding: "20px 40px", borderTop: "1px solid #e5e7eb" }}>
                                                <p style={{ margin: 0, fontSize: "13px", color: "#555555", lineHeight: "1.5" }}>
                                                    ⚠️ {t("validity")}
                                                </p>
                                            </td>
                                        </tr>

                                        {/* Navy footer */}
                                        <tr>
                                            <td style={{ backgroundColor: "#01153e", padding: "16px 40px", borderRadius: "0 0 8px 8px" }}>
                                                <table width="100%" cellPadding={0} cellSpacing={0}>
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <p style={{ margin: 0, fontSize: "12px", color: "#9dbdff" }}>UniformAdmin</p>
                                                            </td>
                                                            <td align="right">
                                                                <p style={{ margin: 0, fontSize: "12px", color: "#9dbdff" }}>© 2026</p>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </Html>
    );
};
