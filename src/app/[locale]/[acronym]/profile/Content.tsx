"use client";

import { Prisma } from "@prisma/client";
import { useState } from "react";
import { AddTwoFactorAppModal } from "./AddTwoFactorAppModal";

type User = Prisma.UserGetPayload<{
    include: { organisation: true, twoFactorApps: true }
}>;

type ProfileContentProps = {
    user: User;
};

export const ProfileContent = ({ user }: ProfileContentProps) => {

    const [showAddAuthApp, setShowAddAuthApp] = useState(false);

    const handleAddAppOpen = () => {
       setShowAddAuthApp(true);
    }

    return (
        <div>
            <h1>Profile</h1>
            <p>Welcome to your profile page!</p>
            <h2>User Information</h2>
            <strong>Name:</strong> {user.name}<br />
            <strong>Username:</strong> {user.username}<br />
            <strong>Role:</strong> {user.role}<br />
            <strong>Email:</strong> {user.email}<br />
            <strong>Active:</strong> {user.active ? 'Yes' : 'No'}<br />
            <strong>Organisation:</strong> {user.organisation.name}<br />
            <strong>2FA Enabled:</strong> {user.twoFAEnabled ? 'Yes' : 'No'}<br />
            <strong>Default 2FA Method:</strong> {user.default2FAMethod || 'Not Set'}<br />
            <h2>Two-Factor Authentication Apps</h2>
            <button onClick={handleAddAppOpen}>Add 2FA App</button>
            {user.twoFactorApps.map(app => (
                <div key={app.id}>
                    <strong>App Name:</strong> {app.appName} - <strong>Verified:</strong> {app.verified ? 'Yes' : 'No'}
                </div>
            ))}
            {user.twoFactorApps.length === 0 && <p>No 2FA apps configured.</p>}
            {showAddAuthApp && (
                <AddTwoFactorAppModal onClose={() => setShowAddAuthApp(false)} />
            )}
        </div>
    );
}