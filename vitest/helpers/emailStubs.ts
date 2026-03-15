/**
 * Stub module replacing JSX email files in DAL integration/unit tests.
 * All email-sending functions are no-ops to avoid JSX parsing issues
 * and prevent actual email delivery during tests.
 */

// emailToken.tsx stubs
export const sendTokenViaEmail = async () => {};

// tokenReuseDetected.tsx stubs
export const sendTokenReuseDetectedEmail = async () => {};

// userBlockedEmail.tsx stubs
export const sendUserBlockedEmail = async () => {};

// inspectionReview.tsx stubs
export const sendInspectionReviewEmail = async () => {};
