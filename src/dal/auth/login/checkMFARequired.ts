import { Device } from "@prisma/client";
import dayjs from "dayjs";
import { RiskLevel, getUserMFAConfig } from "../helper";

type Get2FARequiredForLoginProps = {
    userId: string;
    riskLevel: RiskLevel;
    device: Device | null;
}

export const checkMFARequired = async (props: Get2FARequiredForLoginProps): Promise<{ mfaMethod: string | null }> => {
    const { userId, riskLevel, device } = props;
    const { enabled, method } = await getUserMFAConfig(userId);
    const mfaMethod = method ?? "email";

    if (riskLevel === RiskLevel.SEVERE) {
        // Always require 2FA on severe risk even if disabled
        return { mfaMethod }
    }

    if (!enabled) {
        return { mfaMethod: null };
    }

    if (!device) {
        return { mfaMethod };
    }
    if (!device.lastMFAAt) {
        return { mfaMethod };
    }

    // HIGH --> 2FA within a week
    if ((riskLevel === RiskLevel.HIGH)
        && dayjs(device.lastMFAAt).isBefore(dayjs().subtract(7, 'days'))) {
        return { mfaMethod };
    }
    // MEDIUM --> 2FA within a month
    if ((riskLevel === RiskLevel.MEDIUM)
        && dayjs(device.lastMFAAt).isBefore(dayjs().subtract(30, 'days'))) {
        return { mfaMethod };
    }
    return { mfaMethod: null };
}
