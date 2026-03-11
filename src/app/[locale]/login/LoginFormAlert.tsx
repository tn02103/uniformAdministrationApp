import { useScopedI18n } from "@/lib/locales/client";
import { Alert } from "react-bootstrap";


export const LoginFormAlert = ({loginState}: {loginState: string}) => {
    const t = useScopedI18n("login.error");

    switch (loginState) {
        case "userBlocked":
            return (
                <Alert variant="danger" style={{ maxWidth: "400px" }}>
                    {t('userBlocked')}
                </Alert>
            );
        case "tooManyRequests":
            return (
                <Alert variant="danger" style={{ maxWidth: "400px" }}>
                    {t('tooManyRequests')}
                </Alert>
            );
        case "error":
            return (
                <Alert variant="danger" style={{ maxWidth: "400px" }}>
                    {t('failed')}
                </Alert>
            );
        default:
            return null;
    }
}