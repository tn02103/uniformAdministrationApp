export default {
    common: {
        of: "von",
        comment: "Kommentar",
        description: "Beschreibung",
        type: "Typ",
        loading: "Lädt",
        dates: {
            created: "Erstellt am:",
            updated: "zulest Verändert:",
        },
        yes: "Ja",
        no: "Nein",
        active: {
            true: "Aktiv",
            false: "Inaktiv"
        },
        actions: {
            cancel: "abbrechen",
            save: "speichern",
            edit: "bearbeiten",
            create: "Anlegen",
            addNew: "neu hinzufügen",
            open: "Öffnen",
            prevStep: "zurück",
            nextStep: "weiter",
            edit_item: "{item} Bearbeiten",
            issue_item: "{item} Ausgeben",
            issue: "Ausgeben",
            return: "Zurückziehen",
            replace: "Austauschen",
            changeIssued: "Anzahl & Typ verändern",
            delete: "Löschen",
            load: "Laden",
        },
        cadet: {
            cadet: "Person",
            firstname: "Vorname",
            lastname: "Nachname",
            status: "Status",
            lastInspection: "Letzte Kontrolle",
            notInspected: "Bisher noch nicht Kontrolliert",
            uniformComplete: {
                true: "Uniform vollständig",
                false: "Uniform unvollständig",
            },
            activeDeficiencies: "Aktive Mängel",
            issueCertificate: "Ausgabebescheinigung",
        },
        uniform: {
            "item#one": "Uniformteil",
            "item#other": "Uniformteile",
            number: "Nummer",
            generation: "Generation",
            generation_other: "Generationen",
            size: "Größe",
            size_other: "Sizes",
            owner: "Besitzer",
        },
        material: {
            material: "Material",
            type_one: "Typ",
            type_other: "Typen",
            issued: "ausgegeben",
            group_one: "Materialgruppe",
            group_other: "Materialgruppen",
            groupname: "Gruppenname",
            issuedDefault: "Standardmäßig ausgegeben",
            multitypeAllowed: "Mehrfachvergabe erlaubt",
            amountIssued: "Mänge Ausgegeben",
            quantity: {
                actual: "Ist",
                actualQuantity: "Istmänge",
                target: "Soll",
                targetQuantity: "Sollmänge",
                issued: "Ausgegeben"
            }
        },
        deficiency: {
            resolved: {
                true: "Behoben",
                false: "Unbehoben",
            }
        },
        error: {
            pleaseSelect: "Bitte Auswählen",
            number: {
                required: "Bitte eine Zahl angeben",
                pattern: "Bitte eine valide Zahl eingeben",
                max: "Die Zahl darf nicht höher als {value} sein",
                maxLength: "Es sind höchstens {value} Stellige Zahlen erlaubt",
                min: "Die Zahl muss größer {value} sein",
            },
            string: {
                required: "Bitte ausfüllen",
                maxLength: "Es sind höchtens {value} Zeichen erlaubt",
                noSpecialChars: "Es dürfen keine Sonderzeichen genutzt werden",
                commentValidation: "Nicht alle Zeichen die Sie genutzt haben sind erlaubt",
            },
            save: {
                unknown: "Beim Speichern ist ein unbekannter Fehler aufgetreten "
            },
            uniform: {
                number: {
                    required: "Bitte die Uniformnummer angeben",
                    maxLength: "Die Nummer darf höchstens 7 Zeichen lang sein",
                    min: "Die Nummer muss größer 0 sein",
                }
            }
        }
    },
    login: {
        header: "Login",
        label: {
            assosiation: "Verein",
            username: "Nutzername",
            password: "Password",
            login: "Anmelden"
        },
        error: {
            unknown: "Der Loginversuch ist fehlgeschlagen, bitte versuchen Sie es erneut.",
            failed: "Nutzername oder Passwort sind ungültig"
        }
    },
    generalOverview: {
        header: "Personal",
        openCadet: "Personalübersicht öffnen",
        issueCertificate: "Ausgabebescheinigung",
    },
    cadetDetailPage: {
        delete: {
            error: "Die Person konnte nicht gelöscht werden",
            header: "Person löschen",
            message: "Bist du dir sicher, dass du die Person {firstname} {lastname} entgültig löschen willst?",
        },
        header: {
            uniformTable: "Uniformteile",
            cadetTable: "Personaldaten",
            materialTable: "Materialien",
            inspection: "Uniformkontrolle",
            inspecting: "VK kontrollieren",
            deficiencies: "Mängel",
            oldDeficiencies: "alte Mängel",
            newDeficiencies: "neue Mängel",
            "amountUnresolved#other": "- {count} unbehoben",
            "amountUnresolved#zero": "- Alle behoben",
        },
        returnUniform: {
            error: "Beim Zurückziehen des Uniformteils ist ein Fehler aufgetreten. Bitte versuchen sie es noch einmal",
        },
        issueMaterial: {
            header: "{group} ausgeben",
            error: ""
        },
        'defaultIssuedWarning#one': "Es sollte {count} Stück ausgegeben werden",
        'defaultIssuedWarning#other': "Es sollten {count} Stücke ausgegeben werden",
        'multitypeWarning': "Es sollte nur 1 Typ dieses Materials ausgegeben werden",
        tooltips: {
            inspection: {
                inspected: "Kadetten kontrolliert:\nInspektion des Kadetten aktualisieren",
                notInspected: "Kadetten unkontrolliert:\nInspektion des Kadetten starten"
            }
        }
    },
    uniformList: {
        filter: "Filter",
        other: "weitere Filter",
        withOwner: "mit Besitzer",
        withoutOwner: "ohne Besitzer",
        selectAll: "Alle auswählen",
        error: {
            activ: "Von Aktiv und Passiv muss mindestens ein Option ausgewählt sein!",
            owner: "Von mit und ohne Benutzer muss mindestens eine Option ausgewählt sein!",
        },
        search: {
            invalid: "Sucheingabe Invalide",
            label: "Suche",
        },
        'numberOfEntries#one': "{count} Einträge",
        'numberOfEntries#zero': "Keine Einträge",
        'numberOfEntries#other': "{count} Eintrag",
        noData: "Keine Daten geladen",
        header: "Uniformteile",
    },
    sidebar: {
        logout: "Abmelden",
        links: {
            cadetOverview: "Personal",
            uniformOverview: "Uniform",
            create: {
                group: "Anlegen",
                cadet: "Person",
                uniform: "Uniform",
            },
            inspection: {
                group: "Inspektion",
                start: "Starten",
                stop: "Stoppen",
            },
            administration: {
                group: "Administration",
                uniform: "Uniform",
                size: "Größen",
                material: "Materialien",
            },
            userOverview: "Zugänge",
        },
    },
    modals: {
        messageModal: {
            uniform: {
                return: {
                    header: "Withdraw uniform part",
                    message: "Are you sure you want to withdraw the uniform part {type} {number}?"
                },
                issue: {
                    header: "{type} ausgeben",
                },
                replace: {
                    header: "{type} {number} austauschen",
                },
                issueUnknown: "Beim Zuordnen des Uniformteils ist ein unbekanntes Problem aufgetreten.",
                issuedException: {
                    header: "Uniformteil vergeben",
                    message: "Das Uniformteil wurde bereit an den Kadetten {firstname} {lastname} vergeben.",
                    ownerInactive: "Der Kadett ist nicht aktiv",
                    option: {
                        openCadet: "Kadetten öffnen",
                        changeOwner: "Besitzer wecheln"
                    }
                },
                inactiveException: {
                    header: "Uniformteil Passiv",
                    message: "Das Uniformteil mit der Nummer {number} ist passiv gesetzt und sollte aus diesem Grund nicht ausgegeben werden. \nSoll das Uniformteil trotzdem dem Kadetten ausgegeben werden?"
                },
                nullValueException: {
                    header: "Uniformteil nicht gefunden",
                    message: "Das Uniformteil mit der Nummer {number} existiert nicht. Soll das Uniformteil neu Angelegt werden?",
                    createOption: "Uniformteil anlegen"
                },
            },
        },
    },
} as const;
