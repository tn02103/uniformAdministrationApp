/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import germ from "@/../public/locales/de";
import engl from "@/../public/locales/en";
import { useCurrentLocale } from "@/lib/locales/client";
import { useCallback, useEffect, useState } from "react";

export default function ErrorMessage({ error, testId, ariaLabel, id }: { error?: string; testId: string; id?: string; ariaLabel?: string }) {
    const locale = useCurrentLocale();

    const [message, setMessage] = useState('');

    const getTranslation = useCallback(() => {
        switch (locale) {
            case "de":
                return germ.common.error;
            case "en":
                return engl.common.error;
        }
    }, [locale]);

    // Funktion, um den verschachtelten Wert aus dem Objekt zu holen
    const getNestedValue = useCallback((obj: Record<string, any>, key: string): any => {
        const keys = key.split('.');
        let value = obj;
        for (const k of keys) {
            value = value[k];
            if (value === undefined) break;
        }
        return value;
    }, []);

    const getTranslationText = useCallback((error: string, translationObj: Record<string, any>): string => {
        // Den error-String in Teile aufteilen
        const parts = error.split(';');

        // Den Translation-Key extrahieren
        const translationKey = parts[0];

        // Den Text mit dem Translation-Wert initialisieren
        let text = getNestedValue(translationObj, translationKey) || '';
        if (!text) return (error);

        // Key-Wert-Paare verarbeiten
        for (const pair of parts.slice(1)) {
            const [key, value] = pair.split(':');
            text = text.replace(`{${key}}`, value);
        }
        return text;
    }, [getNestedValue])

    useEffect(() => {
        if (!error) {
            setMessage('');
            return;
        }
        const translation = getTranslation();
        const text = getTranslationText(error, translation)
        setMessage(text);
    }, [error, locale, setMessage, getTranslationText, getTranslation]);

    if (!message)
        return null;

    return (
        <div className="text-danger fs-7" role="alert" data-testid={testId} id={id} aria-label={ariaLabel}>
            {message}
        </div>
    );
}