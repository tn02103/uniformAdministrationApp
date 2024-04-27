export default {
    common: {
        of: "von",
        comment: "Kommentar",
        description: "Beschreibung",
        name: "Name",
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
            rename: "Umbenennen",
            changeIssued: "Anzahl & Typ verändern",
            delete: "Löschen",
            load: "Laden",
            moveUp: "nach oben verschieben",
            moveDown: "nach unten verschieben",
            changePosition: "Position wechseln",
            ok: "Verstanden",
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
            generation: {
                "label#one": "Generation",
                "label#other": "Generationen",
                outdated: "veraltet",
            },
            size: "Größe",
            size_other: "Sizes",
            sizelist: {
                "label": "Größenliste",
                "multiLabel": "Größenlisten",
            },
            owner: "Besitzer",
            active: {
                true: "Aktiv",
                false: "Reserve"
            },
            type: {
                "type#one": "Uniformtyp",
                "type#other": "Uniformtypen",
                name: "Name",
                acronym: "Kürzel",
                issuedDefault: "Anz. auszugeben",
                usingGenerations: "Nutzt Generationen",
                usingSizes: "Nutzt Größen",
                defaultSizeList: "Standard GrößenListe"
            }
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
        'numberOfEntries#one': "{count} Eintrag",
        'numberOfEntries#zero': "Keine Einträge",
        'numberOfEntries#other': "{count} Einträge",
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
    admin: {
        uniform: {
            header: "Uniformadministration",
            changeSizeListWarning: "Beim Ändern der ausgewählten Größenliste, kann bei Uniformteilen dieser Generation die Information der Größe verlohren gehen",
            type: {
                deleteModal: {
                    header: "Uniformtyp \"{type}\" löschen",
                    message: {
                        part1: "Soll der Uniformtyp \"{type}\" wirklich gelöscht werden.",
                        part2: "Hierbei werden alle ",
                        'part3#one': "{count} Uniformteil",
                        'part3#other': "{count} Uniformteile",
                        part4: " dieses Types mit gelöscht"
                    },
                    confirmationText: "Uniformtyp-{type}"
                }
            },
            generationList: {
                deleteModal: {
                    header: "Generation \"{generation}\" Löschen",
                    message: {
                        part1: "Bist du dir sicher dass du diese Generation löschen willst?",
                        part2: "Diese Aktion ist permanent und nicht wieder umkehrbar. ",
                        part3: "Alle Uniformteile die dieser Generation zugeordnet sind, bleiben bestehen.",
                    },
                    confirmationText: "Generation-{generation}",
                },
                updateModal: {
                    editHeader: "Generation \"{generation}\" bearbeiten",
                    createHeader: "Neue Generation anlegen",
                    changeSizeHeader: "Ändern der Größenliste",
                    changeSizeMessage: "Beim Ändern der ausgewählten Größenliste, kann bei Uniformteilen dieser Generation die Information der Größe verlohren gehen",
                    nameDuplicationError: "Es existiert bereits eine Generation mit diesem Namen",
                }
            },
            size: {
                changePositionModal: {
                    header: "Position für \"{size}\" ändern",
                    label: "Position",
                },
                createModal: {
                    header: "Neue Größe anlegen",
                    label: "Größe",
                    nameDuplicationError: "Diese Größe existiert bereits",
                },
                deleteModal: {
                    header: "Größe \"{size}\" löschen",
                    message: "Soll die Größe wirklich gelöscht werden. Diese Aktion ist nicht wieder umkehrbar."
                },
            },
            sizeList: {
                nameDuplicationError: "Es existiert bereits eine Größenliste mit diesem Namen",
                otherSizes: "weiter Größen",
                selectedSizes: "ausgewählte Größen",
                createModal: {
                    header: "Neue Größenliste anlegen",
                },
                renameModal: {
                    header: "",
                },
                deleteWarning: {
                    header: "Größenliste \"{name}\" löschen",
                    message: {
                        line1: "Bist du sicher, dass die GrößenListe gelöscht werden soll?",
                        line2: "Diese Aktion ist nicht wieder umkehrbar",
                    },
                },
                deleteFailure: {
                    header: "Die Größenliste kann nicht gelöscht werden",
                    message: "Die Größenliste kann nicht gelöscht werden, da sie von dem {entity} {name} noch genutzt wird."
                }
            },
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
        dangerConfirmation: {
            confirmation: {
                label: "Zum Bestätigen der Aktion, bitte den folgenden Text eingeben:",
                error: {
                    required: "Bitte den Text zur Bestätigung eingeben",
                    pattern: "Der Text stimmt nicht überein"
                },
            },
        },
    },
} as const;
