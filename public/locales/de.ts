export default {
    common: {
        of: "von",
        comment: "Kommentar",
        description: "Beschreibung",
        details: "Details",
        storageUnit: "Lagereinheit",
        name: "Name",
        type: "Typ",
        loading: "Lädt",
        status: "Status",
        dates: {
            created: "Erstellt am",
            updated: "zuletzt Verändert",
        },
        yes: "Ja",
        no: "Nein",
        active: {
            true: "Aktiv",
            false: "Inaktiv"
        },
        actions: {
            cancel: "Abbrechen",
            save: "Speichern",
            edit: "Bearbeiten",
            create: "Anlegen",
            addNew: "neu hinzufügen",
            open: "Öffnen",
            reactivate: "Reaktivieren",
            deactivate: "Deaktivieren",
            discard: "Verwerfen",
            prevStep: "Zurück",
            nextStep: "Weiter",
            edit_item: "{item} Bearbeiten",
            issue_item: "{item} Ausgeben",
            issue: "Ausgeben",
            resolve: "Beheben",
            return: "Zurückziehen",
            replace: "Austauschen",
            rename: "Umbenennen",
            restart: "Wieder starten",
            remove: "Entfernen",
            finish: "Beenden",
            changeIssued: "Anzahl & Typ verändern",
            delete: "Löschen",
            load: "Laden",
            moveUp: "nach oben verschieben",
            moveDown: "nach unten verschieben",
            changePosition: "Position wechseln",
            changePassword: "Passwort ändern",
            ok: "Verstanden",
            close: "Schließen",
            reset: "Zurücksetzen",
            startInspection: "Inspektion Starten",
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
                isReserve: "Reserve",
            },
            size: "Größe",
            size_other: "Sizes",
            sizelist: {
                "label": "Größenliste",
                "multiLabel": "Größenlisten",
            },
            owner: "Besitzer",
            state: {
                active: "Aktiv",
                isReserve: "Reserve"
            },
            type: {
                "type#one": "Uniformtyp",
                "type#other": "Uniformtypen",
                name: "Name",
                acronym: "Kürzel",
                issuedDefault: "Anz. auszugeben",
                usingGenerations: "Nutzt Generationen",
                usingSizes: "Nutzt Größen",
                defaultSizelist: "Standard GrößenListe"
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
        user: {
            active: {
                true: "Aktiv",
                false: "Gespert",
            },
            authRole: {
                1: "Nutzer",
                2: "Kontrolleur",
                3: "Materialverwaltung",
                4: "Administrator",
            },
        },
        error: {
            pleaseSelect: "Bitte Auswählen",
            unknown: "Es ist ein unerwarteter Fehler aufgetreten",
            date: {
                invalid: "Bitte ein gültiges Datum angeben",
                minExcluded: "Das Datum muss nach dem {date} liegen",
                "minExcluded#today": "Das Datum muss nach heute liegen",
                minIncluded: "Das Datum muss nach dem oder am {date} liegen",
                "minIncluded#today": "Das Datum muss am oder nach dem heutigen Tag liegen",
            },
            number: {
                required: "Bitte eine Zahl angeben",
                pattern: "Bitte eine valide Zahl eingeben",
                patternPositiv: "Bitte eine gültige positive Zahl eingeben",
                positiv: "Die Zahl muss positiv sein",
                max: "Die Zahl darf nicht höher als {value} sein",
                maxLength: "Es sind höchstens {value} Stellige Zahlen erlaubt",
                min: "Die Zahl muss größer {value} sein",
            },
            amount: {
                required: "Bitte eine Anzahl eingeben",
                max: "Die Anzahl darf nicht {value} überschreiten",
                notNegative: "Die Anzahl darf nicht negativ sein",
            },
            string: {
                required: "Bitte ausfüllen",
                emailValidation: "Bitte eine gültige E-Mail Adresse eingeben",
                maxLength: "Es sind höchtens {value} Zeichen erlaubt",
                lengthRequired: "Es wird eine Länge von {value} benötigt",
                noSpecialChars: "Es dürfen keine Sonderzeichen genutzt werden",
                commentValidation: "Nicht alle Zeichen die Sie genutzt haben sind erlaubt",
                descriptionPattern: "Nur die Sonderzeichen -_ sind erlaubt",
                numeric: "Es sind nur Zahlen erlaubt",
            },
            actions: {
                changeSortorder: "Beim ändern der Reihnfolge ist ein unbekannter Fehler aufgetreten.",
                create: "Beim Anlegen  ist ein unbekannter Fehler aufgetreten",
                delete: "Beim Löschen ist ein unbekannter Fehler aufgetreten",
                save: "Beim Speichern ist ein unbekannter Fehler aufgetreten",
            },
            uniform: {
                number: {
                    required: "Bitte die Uniformnummer angeben",
                    maxLength: "Die Nummer darf höchstens 7 Zeichen lang sein",
                    min: "Die Nummer muss größer 0 sein",
                },
                acronym: {
                    pattern: "Das Kürzel darf keine Sonderzeichen oder Zahlen Beinhalten",
                    length: "Das Kürzel muss 2 Zeichen lang sein",
                },
            },
            user: {
                username: {
                    pattern: "Der Nutzername darf keine Sonder oder Leerzeichen beinhalten",
                    duplicate: "Der Nutzername wird bereits von einem anderen Nutzer benutzt",
                },
                email: {
                    duplicate: "Die E-Mail Adresse wird bereits von einem anderen Nutzer benutzt",
                },
                name: {
                    pattern: "Der Name darf keine Sonderzeichen oder Zahlen beinhalten",
                }
            },
            custom: {
                nameDuplication: {
                    storageUnit: "Der Name wird bereits von einer anderen Lagereinheit benutzt",
                },
                material: {
                    typename: {
                        duplication: "Der Name wird bereits von einem anderen Material der Gruppe verwendet",
                    },
                    groupname: {
                        duplication: "Der Name wird bereits von einer anderen Gruppe verwendet",
                    },
                },
                uniform: {
                    type: {
                        nameDuplication: "Es existiert bereits ein Uniformtyp mit diesem Namen",
                        acronymDuplication: "Das Acronym wird bereits vom Uniformtyp {name} benutzt",
                    },
                    generation: {
                        nameDuplication: "Für diesen Uniformtyp existiert bereits eine Generation mit diesem Namen",
                    }
                },
                inspection: {
                    nameDuplication: "Es existiert bereits eine Inspektion mit diesem Namen",
                    dateDuplication: "Es existiert bereits eine Inspektion an diesem Tag",
                },
                redirects: {
                    code: {
                        duplication: "Der Code wird bereits von einem anderen Redirect ihrer/ oder einer anderen Organisation benutzt.",
                    },
                },
                auth: {
                    "2fa.appNameNotUnique": "Der Name wird bereits von einer ihrer anderen 2FA Apps benutzt",
                    invalidCurrentPassword: "Das aktuelle Passwort ist falsch.",
                    password: {
                        mismatch: "Die Passwörter stimmen nicht überein",
                    },

                },
            },
        },
        success: {
            changeSortorder: "Reihenfolge erfolgreich geändert",
        },
    },
    autocomplete: {
        noOptions: "Keine Optionen gefunden",
        loading: "Lädt...",
        optionLimit: "Es werden nur die ersten {count} Ergebnisse angezeigt",
    },
    expandableArea: {
        showMore: "Mehr anzeigen",
        showLess: "Weniger anzeigen",
    },
    login: {
        header: "Login",
        label: {
            organisation: "Verein",
            identifier: "E-Mail oder Nutzername",
            username: "Nutzername",
            password: "Password",
            twoFactorCode: "2FA Code",
            login: "Anmelden",
            forgotPassword: "Passwort vergessen?",
        },
        error: {
            unknown: "Der Loginversuch ist fehlgeschlagen, bitte versuchen Sie es erneut.",
            failed: "Nutzername oder Passwort sind ungültig",
            userBlocked: "Ihr Zugang wurde gesperrt. Bitte kontaktieren Sie den Administrator.",
            tooManyRequests: "Zu viele fehlgeschlagene Loginversuche. Bitte versuchen Sie es später erneut.",
        },
    },
    forgotPassword: {
        header: "Passwort zurücksetzen",
        label: {
            organisation: "Verein",
            email: "E-Mail-Adresse",
            submit: "Link senden",
        },
        success: "Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Reset-Link gesendet.",
        error: {
            unknown: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
            tooManyRequests: "Zu viele Versuche. Bitte versuche es später erneut.",
        },
    },
    resetPassword: {
        header: "Neues Passwort festlegen",
        label: {
            newPassword: "Neues Passwort",
            confirmPassword: "Passwort bestätigen",
            submit: "Passwort zurücksetzen",
            login: "Zum Login",
            requestNewLink: "Neuen Reset-Link anfordern",
        },
        success: "Passwort erfolgreich zurückgesetzt. Du kannst dich jetzt anmelden.",
        error: {
            tokenInvalid: "Dieser Reset-Link ist ungültig, abgelaufen oder wurde bereits verwendet.",
            passwordMismatch: "Die Passwörter stimmen nicht überein.",
            unknown: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
            tooManyRequests: "Zu viele Versuche. Bitte versuche es später erneut.",
        },
    },
    notFound: {
        pageHeader: "Nicht gefunden",
        header2: "Seite nicht gefunden",
        message: "Ihre Route konnte nicht gefunden werden",
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
        },
        inspection: {
            "header.noInspection": "Mängel",
            "header.inspection": "Uniformkontrolle",
            "header.inspecting": "VK kontrollieren",
            "label.oldDeficiencies": "alte Mängel",
            "label.newDeficiencies": "neue Mängel",
            "label.otherMaterials": "Andere Materialien",
            "label.amountUnresolved#other": "- {count} unbehoben",
            "label.amountUnresolved#zero": "- Alle behoben",
            "label.noDeficiencies": "Keine Mängel vorhanden",
            "tooltip.inspected": "Kadetten kontrolliert:\nInspektion des Kadetten aktualisieren",
            "tooltip.notInspected": "Kadetten unkontrolliert:\nInspektion des Kadetten starten",
            "message.saved": "Inspektion erfolgreich gespeichert",
            "error.startInspection": "Beim starten der Kontrolle für diese Person ist ein Fehler aufgetreten. Bitte laden Sie die Seite neu und versuchen es nocheinmal",
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
        "issueModal": {
            "input.label": "Uniformteil auswählen",
            "alert.owner.1": "Bereits an den Kadetten ",
            "alert.owner.2": " ausgegeben. Möchten Sie den Besitzer ändern?",
            "alert.noItemFound": "Es existiert kein Uniformteil mit der Nummer {number}. Möchten Sie es anlegen?",
            "alert.itemAlreadyOwned": "Das ausgewählte Uniformteil ist bereits an diese Person ausgegeben.",
            "alert.storageUnit": "Das ausgewählte Uniformteil ist der Lagereinheit \"{unit}\" zugeordnet.",
            "alert.isReserve": "Das ausgewählte Uniformteil ist als Reserve markiert.",
            "button.changeOwner": "Besitzer ändern",
            "button.replace": "Ersetzen",
            "button.issue": "Ausgeben",
            "button.create": "Uniformteil anlegen",
            "error.invalidNumber": "Die eingegebene Nummer ist ungültig",
            "error.issueFailed": "Das Uniformteil konnte nicht ausgegeben werden. Bitte versuchen Sie es später erneut.",
            "header.add": "{type} ausgeben",
            "header.replace": "{type}-{number} ersetzen",
            "option.isReserve": "Reserve",
            "option.owner": "Besitzer: ",
            "option.storageUnit": "Lagereinheit: ",
        },
    },
    storageUnit: {
        error: {
            "addUT": "Das Uniformteil konnte nicht hinzugefügt werden. Bitte versuchen Sie es später erneut.",
            "removeUT": "Das Uniformteil konnte nicht entfernt werden. Bitte versuchen Sie es später erneut.",
            "nameDuplication": "Der Name wird bereits von einer anderen Lagereinheit benutzt",
        },
        label: {
            "addUT": "Uniformteil(e) hinzufügen",
            "details.name": "Name",
            "details.capacity": "Kapazität",
            "details.description": "Beschreibung",
            "details.forReserves": "Für Reserven",
            "details.forReservesText": "Uniformteile werden als Reserve markiert",
            "details.uniformCount": "# Uniformteile",
            "editName": "Lagereinheit umbenennen",
            "header.uniformlist": "Uniformteil(e)",
            "header.create": "Lagereinheit anlegen",
            "header.page": "Uniform Lagerverwaltung",
        },
        warning: {
            "capacity.header": "Lagereinheit voll",
            "capacity.message": "Die Einheit ist bereits voll. Sind Sie sicher, dass sie ein weiteres Uniformteil hinzufügen wollen?",
            "close.header": 'Änderungen verwerfen?',
            "close.message": 'Möchten Sie die Änderungen verwerfen?',
            "delete.header": "Lagereinheit löschen",
            "delete.message": "Soll die Lagereinheit \"{name}\" wirklich gelöscht werden? Diese Aktion ist nicht wieder umkehrbar.",
        },
        tooltips: {
            "utOptions.owner": "Besitzer: ",
            "utOptions.storageUnit": "Lagereinheit: ",
            "utOptions.isReserve": "Reserve",
        }
    },
    uniformList: {
        filter: "Filter",
        other: "weitere Filter",
        issued: "ausgegeben",
        notIssued: "nicht ausgegeben",
        inStorageUnit: "in Lagereinheit",
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
    uniformOffcanvas: {
        deleteAction: {
            header: "{type} {number} löschen",
            "message.one": "Soll das Uniformteil {type} {number} wirklich gelöscht werden?",
            "message.two": "Diese Aktion kann nicht wieder umgekehrt werden",
            "success": "Das Uniformteil wurde erfolgreich gelöscht",
            "failed": "Das Uniformteil konnte nicht gelöscht werden",
        },
        deficiency: {
            header: "Mängel",
            includeResolved: "Behobene Mängel anzeigen",
            cardLabel: "Mangel {index}",
            createCardLabel: "Neuen Mangel anlegen",
            "label.actions": "Aktionen für Mangel {index}",
            "label.comment": "Kommentar",
            "label.deficiencyType": "Art des Mangels",
            "label.date.created": "Erstellt am:",
            "label.date.resolved": "Behoben am:",
            "label.date.updated": "Zuletzt aktualisiert am:",
            "label.user.created": "Erstellt von:",
            "label.user.resolved": "Behoben von:",
            "label.user.updated": "Zuletzt aktualisiert von:",
            "noDeficiencies": "Keine Mängel vorhanden",
        },
        history: {
            "header": "Historie",
            "label.dateIssued": "Ausgabe",
            "label.dateReturned": "Rückgabe",
            "label.cadet": "Person",
            "title.deleted": "Person gelöscht",
            "noEntries": "Keine Einträge vorhanden",
        },
        storageUnit: {
            "label.button.remove": "Aus Lagereinheit entfernen",
            "label.button.add": "In Lagereinheit verschieben",
            "label.button.switch": "Lagereinheit wechseln",
            "label.notAssigned": "Nicht zugeteilt",
            "label.add": "Zu Lagereinheit zuweisen",
            "placeholder.add": "Lagereinheit auswählen",
            "error.add": "Das Uniformteil konnte nicht in die Lagereinheit verschoben werden. Bitte versuchen Sie es später erneut.",
            "error.remove": "Das Uniformteil konnte nicht aus der Lagereinheit entfernt werden. Bitte versuchen Sie es später erneut.",
        },
        owner: {
            label: "Besitzer",
            issuedTo: "Ausgegeben an",
            issuedDate: "Ausgegeben seid",
        }
    },
    createUniform: {
        pagination: {
            known: "Nummern bekannt",
            generate: "Nummern generieren",
        },
        header: {
            page: "Neue Uniformteile anlegen",
            configurator: "Konfiguration",
            numberInput: "Nummern eingeben",
            itemAmounts: "Anzahl Uniformteile",
            revalidteNumbers: "Nummern überprüfen",
        },
        label: {
            add: "hinzufügen",
            amount: "Anzahl",
            numberStart: "Nummern (von)",
            until: "bis",
            continuous: "Fortlaufende Nummern",
            continuousTooltip: {
                line1: "Bei Fortlaufenden Nummern, werden für jede Größe zusammenhängende Nummern gesucht.",
                line2: "Zwischen den Größen kann es immer noch Sprünge geben.",
            },
        },
        create: {
            "label": "{count} Anlegen",
            "success#one": "Ein Uniformteil wurden erfolgreich angelegt",
            "success#other": "{count} Uniformteile wurden erfolgreich angelegt",
            "failed#one": "Das Uniformteil konnte nicht angelgt werden",
            "failed#other": "Die Uniformteile konnten nicht angelegt werden",
        },
        errors: {
            "endBiggerStart": "Die Startnummer muss kleine oder gleich der Endnummer sein",
            "maxItems": "Es dürfen nicht mehr als 99 Uniformteile gleichzeitig erstellt werden",
            "minNumber": "Es muss mindestens eine Nummer generiert werden",
            "inUse": "Die Nummer ist bereits vergeben",
        }
    },
    sidebar: {
        logout: "Abmelden",
        changeLanguage: "Sprache wechseln",
        "message.inspection.start": "Die Kontrolle wurde erfolgreich gestartet",
        "message.inspection.startError": "Die Kontrolle konnte nicht gestartet werden. Bitte versuchen Sie es später erneut.",
        "message.inspection.stop": "Die Kontrolle wurder erfolgreich beendet",
        "message.inspection.stopError": "Die Kontrolle konnte nicht beendet werden. Bitte versuchen Sie es später erneut.",
        labels: {
            "stopInspection.header": "Kontrolle Beenden",
            "stopInspection.elementLabel": "Endzeit:",
            "activeInspection.open": "Kontrolliert: {controlled} / {total}",
            "activeInspection.collapsed": "{controlled} / {total}"
        },
        links: {
            cadetOverview: "Personal",
            uniformOverview: "Uniform",
            storageUnit: "Lagereinheiten",
            create: {
                group: "Anlegen",
                cadet: "Person",
                uniform: "Uniform",
            },
            inspection: {
                group: "Inspektion",
                start: "Starten",
                unfinished: "Alte Kontrolle Beenden",
                stop: "Stoppen",
                inspection: "Verwaltung",
                deficiencyType: "Mangeltypen",
            },
            administration: {
                group: "Administration",
                uniform: "Uniform",
                size: "Größen",
                material: "Materialien",
                dashboard: "Dashboard"
            },
            userOverview: "Zugänge",
            redirects: "Weiterleitungen",
            profile: "Profil"
        },
    },
    redirects: {
        title: "Weiterleitungen",
        code: "Code",
        target: "Ziel",
        targetPlaceholder: "https://www.test.de",
        active: "Status",
        "activeLabel.true": "Aktiv",
        "activeLabel.false": "Inaktiv",
        sourceUrl: "Quell-URL",
    },
    admin: {
        uniform: {
            header: "Uniformadministration",
            changeSizelistWarning: "Beim Ändern der ausgewählten Größenliste, kann bei Uniformteilen dieser Generation die Information der Größe verloren gehen",
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
                "header.create": "Neue Generation anlegen",
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
                    changeSizeHeader: "Ändern der Größenliste",
                    changeSizeMessage: "Beim Ändern der ausgewählten Größenliste, kann bei Uniformteilen dieser Generation die Information der Größe verlohren gehen",
                    nameDuplicationError: "Es existiert bereits eine Generation mit diesem Namen",
                }
            },
            size: {
                header: "Größen",
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
            sizelist: {
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
                    message: "Die Größenliste kann nicht gelöscht werden, da sie von dem {entity} {name} noch genutzt wird.",
                },
            },
        },
        material: {
            header: {
                page: "Material-Konfiguration",
                groupList: "Materialgruppen",
                editMaterial: "Material \"{group}-{type}\" bearbeiten",
                createMaterial: "Neue(s) \"{group}\" anlegen",
            },
            delete: {
                group: {
                    header: "Materialgruppe \"{group}\" Löschen",
                    message: "Soll die MaterialGruppe \"{group}\" wirklich gelöscht werden? Hierbei gehen alle Informationen in Bezug auf diese MaterialGruppe verloren!",
                    confirmationText: "Materialgruppe_{group}",
                },
                material: {
                    header: "Material \"{group} - {type}\" Löschen",
                    message: "Soll der MaterialTyp \"{type}\" der Gruppe \"{group}\" wirklich gelöscht werden? Hierbei gehen alle Daten in Verbindung mit dem MaterialTyp unwiederruflich verloren",
                    confirmationText: "Material_{group}-{type}",
                },
            },
            error: {
                missingTypes: "Für die MaterialGruppe {group} ist kein Typ vorhanden! Für jede Gruppe wird mind. ein Typ benötigt!",
                createGroup: "Das Erstellen der Materialgruppe ist fehlgeschlagen",
                groupNameDuplicate: "Der Gruppename ist bereits vergeben",
                materialNameDuplicate: "Der Name wird bereits von einem anderen Material der Gruppe verwendet",
                maxIssuedDefault: "Die Menge standardmäßiger ausgegebenen Materialien darf nicht größer {value} sein",
            },
        },
        user: {
            header: {
                page: "Nutzerübersicht",
            },
            label: {
                email: "E-Mail",
                username: "Nutzername",
                name: "Name",
                role: "Rolle",
                status: "Status",
                password: "Passwort",
                activeStatus: "Aktiv",
            },
            role: {
                selfChange: {
                    disabled: "Sie können Ihre eigene Rolle nicht ändern. Bitten Sie einen anderen Administrator, dies zu tun.",
                },
            },
            actions: {
                resetPassword: "Passwort zurücksetzen",
                resetPasswordConfirm: "Für {user} ein temporäres Passwort generieren? Alle aktiven Sitzungen werden beendet.",
                reset2FA: "2FA zurücksetzen",
                "reset2FA.notAvailable": "Noch nicht verfügbar",
                delete: "Benutzer {user} löschen",
                deleteWarning: {
                    header: "Nutzer {user} löschen",
                    message: "Soll der Nutzer wirklich gelöscht werden",
                },
            },
            success: {
                deleted: "Nutzer erfolgreich gelöscht",
                passwordReset: "Temporäres Passwort wurde erstellt",
                saved: "Nutzer erfolgreich aktualisiert",
            },
            error: {
                passwordReset: "Das Zurücksetzen des Passworts ist fehlgeschlagen",
                delete: "Das Löschen des Nutzers ist fehlgeschlagen",
                create: "Das Anlegen des Nutzers ist fehlgeschlagen",
                save: "Das Aktualisieren des Nutzers ist fehlgeschlagen",
            },
            tempPassword: {
                label: "Das temporäre Passwort lautet:",
                warning: "Dieses Passwort wird nur einmal angezeigt. Bitte notieren Sie es.",
                copyPassword: "Passwort in Zwischenablage kopieren",
            },
        },
        deficiency: {
            disabled: "deaktiviert am: ",
            header: {
                page: "Mangeltypen",
                name: "Name",
                dependent: "Abhängig von",
                relation: "Bezieht sich auf",
                active: "Aktiv",
                resolved: "Behoben",
            },
            info: {
                dependent: "Gibt an wovon der Mangel direkt abhängt. Z.B. Bei Uniformteilen, bleibt der Mangel immer für das Uniformteil behalten, auch wenn sich der Besitzer ändert",
                relation: "Gibt an ob sich der Mangel einer Person indirekt auf eine anderes Entität bezieht. Z.B beim Typ 'UT zu klein' wäre der Mangel abhängig von der Person, aber bezieht sich indirekt auf ein Uniformteil "
            },
            errors: {
                deactivate: "The type could not be deactivated. Reload the page and try again.",
                delete: "Failed to delete the type. Try again after a reload.",
                reactivate: "The type could not be reactivated. Reload the page and try again.",
            },
            entity: {
                cadet: "Person",
                uniform: "Uniformteil",
                material: "Material",
            },
            delete: {
                header: "Delete type {type}",
                'message#zero': "Do you really want to delete the type? This action cannot be undone.",
                'message#one': "Do you really want to delete the type? This will also delete the one existing defect. This action cannot be undone.",
                'message#other': "Do you really want to delete the type? This will also delete all {count} existing defects. This action cannot be undone.",
            },
        },
        dashboard: {
            "header.page": "Dashboard",
            "header.uniformCounts": "Anzahlen der Uniformteile",
            "header.uniformCountsByType": "Verteilung nach Typ",
            "header.uniformCountsBySize": "Verteilung nach Größe für {type}",
            "label.selectedType": "Ausgewählter Typ:",
            "label.exporting": "Exportiere...",
            "label.export.uniformOverview": "Uniformübersicht Exportieren",
            charts: {
                "total": "Gesamt",
                available: {
                    short: "Verfügbar",
                    long: "Verfügbar (Aktiv, Nicht Ausgegeben)"
                },
                issued: {
                    short: "Ausgegeben",
                    long: "Ausgegeben (Aktiv, Derzeit Ausgegeben)"
                },
                reserves: {
                    short: "Reserven",
                    long: "Reserven (Inaktiv, Nicht Ausgegeben)"
                },
                issuedReserves: {
                    short: "Ausgegebene Reserven",
                    long: "Ausgegebene Reserven (Inaktiv, Derzeit Ausgegeben)"
                },
                missing: {
                    short: "Fehlend",
                    long: "Fehlend (Sollte Ausgegeben Sein)"
                },
                count: "Anzahl"
            }
        }
    },
    inspection: {
        header: {
            planned: 'Geplannte Kontrollen',
        },
        planned: {
            deregistration: {
                header: "Abmeldungen für {name}",
                "label.person": "Person",
                "label.date": "Datum",
                "label.remove": "Abmeldung entfernen",
                "label.add": "Person abmelden",
            },
            delete: {
                header: "Inspektion löschen",
                message: "Soll die Inspektion \"{name}\" wirklich gelöscht werden? Diese Aktion ist nicht wieder umkehrbar",
                primary: "löschen",
            },
            badge: {
                new: "Neu",
                planned: "Geplant",
                active: "Aktiv",
                finished: "Abgeschlossen",
                unfinished: "nicht Abgeschlossen",
                expired: "Abgelaufen",
            },
            label: {
                deregistrations: 'Abmeldungen',
                onDay: "am {day}",
                finishInspection: 'Uniformkontrolle Beenden',
                time: {
                    finished: 'Endzeit:',
                },
                state: 'Status',
                date: 'Datum',
                name: 'Name',
                noInspections: 'Keine Inspektionen geplannt',
            },
            errors: {
                deregistration: 'Die Person {firstname} {lastname} konnte nicht von der Inspektion abgemeldet werden. Bitte laden Sie die Seite neu und versuchen es erneut.',
                register: 'Die Abmeldung der Person {firstname} {lastname} konnte nicht zurückgenommen werden. Bitte laden Sie die Seite neu und versuchen es erneut.',
                start: 'Die Kontrolle konte nicht gestartet werden',
                nameDuplication: 'Der Name wird bereits von einer anderen Kontrolle verwendet',
                endBeforStart: 'Die Endzeit muss nach der Startzeit um {startTime} sein',
                unfinished: {
                    header: 'Alte Kontrolle akiv',
                    message: 'Es ist noch eine alte Uniformkontrolle aktiv. Bitte Beenden Sie zuerst die Alte Kontrolle bevor sie eine neue Starten!',
                },
            },
        },
    },
    pageTitles: {
        "login": "Login - Uniformadmin",
        "home": "Home - Uniformadmin",
        "personnel": "Personal - Uniformadmin",
        "cadet.new": "Person anlegen - Uniformadmin",
        "cadet.person": "{firstname} {lastname} - Personal -Uniformadmin",
        "uniform.new": "Uniformteile anlegen - Uniformadmin",
        "uniform.list": "{type} - Uniformteile - Uniformadmin",
        "uniform.list.notProvided": "Uniformteile - Uniformadmin",
        "inspection": "Uniformkontrollen - Uniformadmin",
        "admin.user": "Nutzerverwaltung  - Uniformadmin",
        "admin.uniform": "Uniform Konfiguration - Uniformadmin",
        "admin.uniform.size": "Unifromgrößen Konfiguration - Uniformadmin",
        "admin.material": "Material Konfiguration - Uniformadmin",
        "admin.deficiency": "Mängel Konfiguration - Uniformadmin"
    },
    modals: {
        ariaLabel: {
            message: "Nachricht",
            danger: "Gefahrenmeldung",
            warning: "Warnungsmeldung",
            error: "Fehlermeldung",
        },
        messageModal: {
            uniform: {
                return: {
                    header: "Withdraw uniform part",
                    message: "Are you sure you want to withdraw the uniform part {type} {number}?"
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
        changeLanguage: {
            header: "Sprache wechseln",
            label: "Sprache",
            options: {
                de: "Deutsch",
                en: "Englisch",
            },
            cancel: "Abbrechen",
            change: "Ändern",
        },
    },
    emails: {
        emailToken: {
            subject: "Ihr Verifizierungscode",
            heading: "Ihr Verifizierungscode",
            body: "Ihr Verifizierungscode lautet: {token}",
            validity: "Der Code ist 1 Stunde gültig.",
        },
        tokenReuseDetected: {
            subject: "Sicherheitsbenachrichtigung: Verdächtige Aktivität erkannt",
            greeting: "Guten Tag {name},",
            line1: "Wir möchten dich darüber informieren, dass wir verdächtige Aktivitäten im Zusammenhang mit deinem Konto festgestellt haben.",
            line2: "Es scheint, dass ein Refresh-Token, welcher deinem Konto zugeordnet ist, möglicherweise kompromittiert wurde.",
            line3: "Aus Sicherheitsgründen haben wir alle aktiven Sitzungen und Refresh-Tokens für dein Konto widerrufen.",
            line4: "Sollte dies widerholt auftreten, kontaktiere bitte umgehend deinen Administrator.",
            closing: "Sicherheits-Team",
            developerSubject: "Sicherheitswarnung: Verdächtige Token-Wiederverwendung erkannt",
            developer: {
                heading: "Benachrichtigung: Verdächtige Token-Wiederverwendung erkannt",
                line1: "Das Benutzerkonto mit der E-Mail {userEmail} hat eine verdächtige Wiederverwendung eines Refresh-Tokens festgestellt.",
                line2: "Alle aktiven Sitzungen und Refresh-Tokens für dieses Konto wurden widerrufen.",
                notificationLabel: "Benutzer benachrichtigt:",
                yes: "Ja",
                no: "Nein (niedrige Sicherheit)",
                line4: "Bitte überprüfen Sie die Sicherheitsprotokolle und kontaktieren Sie den Benutzer bei Bedarf.",
            },
        },
        userBlocked: {
            user: {
                subject: "Ihr UniformAdmin Benutzerkonto wurde gesperrt",
                line1: "Guten Tag {name},",
                line2: "Ihr UniformAdmin Benutzerkonto wurde aufgrund von verdächtigen Aktivitäten gesperrt.",
                line3: "Bitte kontaktieren Sie Ihren Administrator, um weitere Informationen zu erhalten und um den Zugang wiederherzustellen.",
                closing: "Ihr UniformAdmin Team",
            },
            administrator: {
                subject: "Benutzerkonto {name} wurde gesperrt",
                line1: "Guten Tag Admin,",
                line2: "Das Benutzerkonto {name} wurde aufgrund von verdächtigen Aktivitäten gesperrt.",
                line3: "Bitte überprüfen Sie das Konto und kontaktieren Sie den Benutzer für weitere Informationen.",
                closing: "Ihr UniformAdmin Team",
            },
        },
        passwordReset: {
            subject: "Passwort zurücksetzen",
            heading: "Anfrage zum Zurücksetzen des Passworts",
            body: "Klicke auf den folgenden Link, um dein Passwort zurückzusetzen. Der Link läuft in 1 Stunde ab.",
            validity: "Falls du diese Anfrage nicht gestellt hast, informiere uns bitte hierüber.",
            linkText: "Passwort zurücksetzen",
        },
        passwordChanged: {
            subject: "Ihr Passwort wurde geändert",
            heading: {
                reset: "Passwort zurückgesetzt",
                change: "Passwort geändert",
            },
            greeting: "Guten Tag {name},",
            body: {
                reset: "Das Passwort Ihres UniformAdmin-Kontos wurde erfolgreich zurückgesetzt. Falls Sie diese Aktion nicht selbst initiiert haben, wenden Sie sich bitte umgehend an Ihren Administrator.",
                change: "Das Passwort Ihres UniformAdmin-Kontos wurde soeben erfolgreich von Ihnen geändert.",
            },
            securityNotice: "Falls Sie diese Änderung nicht vorgenommen haben, wenden Sie sich umgehend an Ihren Administrator oder sichern Sie Ihr E-Mail-Konto.",
        },
    },
    profile: {
        security: "Sicherheit",
        accountInfo: {
            title: "Kontoinformationen",
            name: "Name",
            username: "Benutzername",
            email: "E-Mail",
            role: "Rolle",
            organisation: "Organisation",
            active: "Aktiv",
            password: {
                title: "Passwort",
                changeButton: "Passwort ändern",
            },
        },
        twoFactor: {
            title: "Zwei-Faktor-Authentifizierung",
            enabled: "2FA aktiviert",
            disabled: "2FA deaktiviert",
            enableToggle: "Aktivieren",
            disableToggle: "Deaktivieren",
            confirmDisable: {
                header: "Zwei-Faktor-Authentifizierung deaktivieren",
                message: "Soll die Zwei-Faktor-Authentifizierung wirklich deaktiviert werden? Dies verringert die Sicherheit Ihres Kontos.",
            },
            confirmRemoveApp: {
                header: "TOTP-App entfernen",
                message: "Soll diese TOTP-App wirklich entfernt werden? Sie kann dann nicht mehr zur Authentifizierung verwendet werden.",
            },
            apps: {
                title: "TOTP-Apps",
                remove: "Entfernen",
                noApps: "Keine TOTP-Apps konfiguriert",
                addNew: "TOTP-App hinzufügen",
            },
            defaultMethod: {
                title: "Standardmethode",
                email: "E-Mail",
                changed: "Standardmethode erfolgreich geändert",
            },
            errors: {
                toggleFailed: "Zwei-Faktor-Authentifizierung konnte nicht aktualisiert werden",
                removeFailed: "TOTP-App konnte nicht entfernt werden",
                defaultMethodFailed: "Standardmethode konnte nicht aktualisiert werden",
            },
        },
        devices: {
            title: "Vertrauenswürdige Geräte",
            noDevices: "Keine vertrauenswürdigen Geräte",
            lastUsed: "Zuletzt verwendet",
            addedOn: "Hinzugefügt am",
            logoutAll: "Von allen Geräten abmelden",
            inactive: "Inaktiv",
        },
        changePassword: {
            title: "Passwort ändern",
            currentPassword: "Aktuelles Passwort",
            newPassword: "Neues Passwort",
            confirmPassword: "Passwort bestätigen",
            submit: "Passwort ändern",
            cancel: "Abbrechen",
            success: "Passwort erfolgreich geändert.",
            error: {
                invalidCurrentPassword: "Das aktuelle Passwort ist falsch.",
                tooManyRequests: "Zu viele Fehlversuche. Bitte versuchen Sie es später erneut.",
                unknown: "Beim Ändern des Passworts ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            },
            newPasswordError: {
                invalid: "Das neue Passwort erfüllt die Anforderungen nicht.",
                rules: {
                    minLength: "Mindestens 8 Zeichen",
                    uppercase: "Mindestens ein Großbuchstabe",
                    lowercase: "Mindestens ein Kleinbuchstabe",
                    number: "Mindestens eine Ziffer",
                },
            },
        },
    },
} as const;
