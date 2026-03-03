'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userNameValidationPattern, uuidValidationPattern } from "@/lib/validations";
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { NextResponse } from "next/server";

/**
 * Custom login endpoint.
 *
 * Better-auth's built-in sign-up is disabled so that accounts can only be
 * created by an organisation admin.  This route handles the organisation-scoped
 * credential check (username is unique *per organisation*, not globally) and
 * then delegates session creation to better-auth.
 *
 * Flow:
 *  1. Validate inputs.
 *  2. Look up the application User by (username, assosiationId).
 *  3. Verify the bcrypt password and active flag.
 *  4. Ensure a matching BaUser + BaAccount exist (create them lazily if not).
 *  5. Call better-auth's email/password sign-in using the synthetic email
 *     `{username}@{assosiationId}` so that sessions are managed by better-auth.
 */
export async function POST(request: Request) {
    try {
        const { username, assosiation, password } = await request.json();

        // ── Input validation ──────────────────────────────────────────────
        if (!userNameValidationPattern.test(username)
            || !uuidValidationPattern.test(assosiation)) {
            return NextResponse.json({ message: "Typevalidation failed" }, { status: 400 });
        }

        // ── Look up the application user ─────────────────────────────────
        const dbUser = await prisma.user.findFirst({
            where: {
                username,
                assosiation: { id: assosiation },
            },
            include: { assosiation: true },
        });

        if (!dbUser) {
            return NextResponse.json({ message: "User Authentification failed" }, { status: 401 });
        }

        // ── Check active flag and bcrypt password ─────────────────────────
        const passwordValid = await bcrypt.compare(password, dbUser.password);

        if (!passwordValid || !dbUser.active) {
            // Increment failed-login counter and lock the account after 5 failures
            if (dbUser.failedLoginCount == 5) {
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { active: false },
                });
            } else {
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { failedLoginCount: { increment: 1 } },
                });
            }
            return NextResponse.json({ message: "User Authentification failed" }, { status: 401 });
        }

        // ── Reset failed-login counter on success ─────────────────────────
        await prisma.user.update({
            where: { id: dbUser.id },
            data: { failedLoginCount: 0 },
        });

        // ── Ensure a BaUser and BaAccount exist for this application user ─
        // The synthetic email `{username}@{assosiationId}` is globally unique.
        const syntheticEmail = `${username}@${assosiation}`;

        let baUser = await prisma.baUser.findUnique({ where: { email: syntheticEmail } });
        if (!baUser) {
            baUser = await prisma.baUser.create({
                data: {
                    id: dbUser.id,
                    name: dbUser.name,
                    email: syntheticEmail,
                    emailVerified: true,
                    assosiationId: assosiation,
                    acronym: dbUser.assosiation.acronym,
                    numericRole: dbUser.role,
                    active: dbUser.active,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        } else {
            // Keep BaUser in sync with the application user
            await prisma.baUser.update({
                where: { id: baUser.id },
                data: {
                    name: dbUser.name,
                    numericRole: dbUser.role,
                    active: dbUser.active,
                    updatedAt: new Date(),
                },
            });
        }

        // Ensure a credential account exists so better-auth can verify passwords.
        // We reuse the same bcrypt hash that is already stored in the User table so
        // no additional hashing round-trip is required and both systems stay in sync.
        const existingAccount = await prisma.baAccount.findFirst({
            where: { userId: baUser.id, providerId: "credential" },
        });
        if (!existingAccount) {
            await prisma.baAccount.create({
                data: {
                    id: randomUUID(),
                    accountId: baUser.id,
                    providerId: "credential",
                    userId: baUser.id,
                    password: dbUser.password, // reuse the existing hash
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        } else if (existingAccount.password !== dbUser.password) {
            // Keep the BaAccount password in sync (e.g. after a password change)
            await prisma.baAccount.update({
                where: { id: existingAccount.id },
                data: { password: dbUser.password, updatedAt: new Date() },
            });
        }

        // ── Delegate session creation to better-auth ──────────────────────
        // `asResponse: true` returns a native Response so we can forward
        // the Set-Cookie headers that better-auth writes onto it.
        const baResponse = await auth.api.signInEmail({
            body: { email: syntheticEmail, password },
            asResponse: true,
        });

        if (!baResponse || baResponse.status !== 200) {
            return NextResponse.json({ message: "Session creation failed" }, { status: 500 });
        }

        // Forward the Set-Cookie header(s) from better-auth to the browser
        const response = NextResponse.json({ loginSuccesfull: true }, { status: 200 });
        baResponse.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") {
                response.headers.append("set-cookie", value);
            }
        });
        return response;
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Login failed" }, { status: 500 });
    }
}

