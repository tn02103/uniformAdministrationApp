import { genericSAValidator } from "@/actions/validations";
import { SAErrorResponse } from "@/errors/ServerActionExceptions";
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { User, userArgs } from "@/types/userTypes";
import { UserFormSchema, UserFormType } from "@/zod/auth";
import { SAReturnType } from "../_helper/testHelper";
import crypto from "crypto";
import z from "zod";
import { getDeviceAccountFromCookies } from "../auth/helper";
import { cookies } from "next/headers";
import dayjs from "dayjs";

const savePropSchema = UserFormSchema.pick({
    email: true,
    name: true,
    role: true,
}).extend({
    id: z.string().uuid(),
});

export type SaveProps = z.infer<typeof savePropSchema>;

export const save = async (props: SaveProps): SAReturnType<any> => genericSAValidator(
    AuthRole.admin,
    props,
    savePropSchema,
    { userId: props.id },
).then(async ([{ organisationId }, data]) => prisma.$transaction(async (client) => {
    // validate unique email
    const existingEmailUser = await client.user.findUnique({
        where: {
            id: data.id,
            email: data.email,
            organisationId: organisationId,
        },
    });
    if (existingEmailUser) {
        return {
            error: {
                message: "user.email.duplicate",
                formElement: "email",
            }
        }
    }

    // validate unique username
    const existingNameUser = await client.user.findUnique({
        where: {
            id: data.id,
            name: data.name,
            organisationId: organisationId,
        },
    });
    if (existingNameUser) {
        return {
            error: {
                message: "user.name.duplicate",
                formElement: "name",
            }
        }
    }

    // update existing user
    const existingUser = await client.user.findUnique({
        where: { id: data.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            active: true,
        }
    });
    if (!existingUser) {
        throw new Error("User not found");
    }
    const updatedUser: User = await client.user.update({
        ...userArgs,
        where: { id: data.id },
        data: {
            email: data.email,
            name: data.name,
            role: data.role as AuthRole,
        },
    });
    return updatedUser;
}));


/*
ACTIONS:
- HIGH RISK
    -> Change Password
    -> CREATE User
    -> ACTIVATE User
    -> UPDATE to HIGHER Role
- MEDIUM RISK
    -> DELETE User
    -> UPDATE if not to higher role
    -> Deactive User
- LOW RISK
    -> LOAD Users

REQUIREMENTS:
- HIGH RISK
    1) 2FA within the last 10 minutes
    2) IP Address may not have changed since last login or 2FA-Verification
    3) UserAgent may not have any changes since last login or 2FA-Verification
- MEDIUM RISK
    1) 2FA within the last hour
        OR Login within last 10 minutes

    2) IP Address may not have changed since last login or 2FA-Verification
    3) UserAgent may not have any changes since last login or 2FA-Verification
- LOW RISK
    1) 2FA within the last 4 hours
        OR Login within last hour
    2) IP Address may not have changed since last login or 2FA-Verification
    3) UserAgent may not have any changes since last login or 2FA-Verification
IF Conditions not met PASSWORD OR 2FA verification (prefferred 2fa)
*/

type DetermineRiskFactorReturnValue = {
    risk: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "SEVERE"
}
const determineRiskFactor = async (userId: string): Promise<DetermineRiskFactorReturnValue> => {
    const cookieList = await cookies();
    const { accountCookie } = getDeviceAccountFromCookies({ cookieList });

    if (!accountCookie?.lastUsed) {
        return { risk: "SEVERE" };
    }

    const device = await prisma.device.findUnique({
        where: { id: accountCookie.lastUsed.deviceId },
        include: {
            user: true,
        }
    });

    if (!device) {
        return { risk: "SEVERE" };
    }

    if (device.userId !== userId) {
        return { risk: "SEVERE" };
    }

    let riskFactor: DetermineRiskFactorReturnValue["risk"] = "LOW";
    if (dayjs(device.last2FAAt).add(10, "minutes").isAfter()) {
        // 2FA within last 10 minutes
        riskFactor = "VERY_LOW";
    } else if (dayjs(device.last2FAAt).add(1, "hour").isBefore()) {
        // 2FA within last 1 hour
        riskFactor = "LOW";
    } else {
        // NO valid 2FA (1 hour)
        if (dayjs(device.lastLoginAt).add(1, "hour").isBefore()) {
            // LOGIN NOT within last hour
            riskFactor = "HIGH";
        } else {
            riskFactor = "MEDIUM";
        }
    }



    const lastLoginLog = await prisma.auditLog.findFirst({
        where: {
            userId: userId,
            deviceId: device.id,
            action: "LOGIN_ATTEMPT",
            state: "SUCCESS",
        }
    })



    // Last login within the hour
    // last 2fa 
    // ipAddress changed
    // userAgend changed
    return {
        risk: riskFactor
    }
}
