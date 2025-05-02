export default {
    common: {
        of: "from",
        comment: "Comment",
        description: "Description",
        details: "Details",
        name: "Name",
        type: "Type",
        loading: "Loading",
        status: "State",
        dates: {
            "created": "Created on:",
            "updated": "Last modified:",
        },
        yes: "Yes",
        no: "No",
        active: {
            true: "Active",
            false: "Inactive"
        },
        actions: {
            cancel: "Cancel",
            save: "Save",
            edit: "Edit",
            create: "Create",
            addNew: "Add new",
            open: "Open",
            reactivate: "Reactivate",
            deactivate: "Deactivate",
            prevStep: "Back",
            nextStep: "Next",
            edit_item: "Edit {item}",
            issue_item: "Issue {item}",
            issue: "Issue",
            resolve: "Resolve",
            return: "Withdraw",
            replace: "Replace",
            rename: "Rename",
            restart: "Restart",
            finish: "Finish",
            changeIssued: "Change quantity & type",
            delete: "Delete",
            load: "Load",
            moveUp: "Move up",
            moveDown: "Move down",
            changePosition: "Change position",
            changePassword: "Change password",
            ok: "Understood",
            startInspection: "Start inspection",
        },
        cadet: {
            cadet: "Person",
            firstname: "First name",
            lastname: "Last name",
            status: "Status",
            lastInspection: "Last inspection",
            notInspected: "Not yet inspected",
            uniformComplete: {
                true: "Uniform complete",
                false: "Uniform incomplete",
            },
            activeDeficiencies: "Active deficiencies",
            issueCertificate: "Issue certificate",
        },
        uniform: {
            "item#one": "Uniform part",
            "item#other": "Uniform parts",
            number: "Number",
            generation: {
                "label#one": "Generation",
                "label#other": "Generations",
                outdated: "outdated",
            },
            size: "Size",
            size_other: "Sizes",
            sizelist: {
                label: "Size list",
                multiLabel: "Size lists",
            },
            owner: "Owner",
            active: {
                true: "Active",
                false: "Reserve"
            },
            type: {
                "type#one": "Uniform type",
                "type#other": "Uniform types",
                name: "Name",
                acronym: "Acronym",
                issuedDefault: "Qty. to be issued",
                usingGenerations: "Uses generations",
                usingSizes: "Uses sizes",
                defaultSizelist: "Standard size list"
            }
        },
        material: {
            material: "Material",
            type_one: "Type",
            type_other: "Types",
            issued: "issued",
            group_one: "Material group",
            group_other: "Material groups",
            groupname: "Group name",
            issuedDefault: "Issued by default",
            multitypeAllowed: "Multiple assignment allowed",
            amountIssued: "Amount issued",
            quantity: {
                actual: "Actual",
                actualQuantity: "Actual quantity",
                target: "Target",
                targetQuantity: "Target quantity",
                issued: "Issued"
            }
        },
        deficiency: {
            resolved: {
                true: "Resolved",
                false: "Unresolved",
            }
        },
        user: {
            active: {
                true: "Active",
                false: "Blocked",
            },
            authRole: {
                1: "User",
                2: "Inspector",
                3: "Material management",
                4: "Administrator",
            },
        },
        error: {
            pleaseSelect: "Please select",
            unknown: "There has been an unexpected Error",
            number: {
                required: "Please enter a number",
                pattern: "Please enter a valid number",
                patternPositiv: "Please enter a valid positive number",
                positiv: "The number needs to be positiv",
                max: "The number must not be higher than {value}",
                maxLength: "Only {value} digit numbers are allowed",
                min: "The number must be greater than {value}",
            },
            amount: {
                required: "Please enter a quantity",
                max: "The quantity must not exceed {value}",
                notNegative: "The quantity must be a positiv value"
            },
            string: {
                required: "Please fill in",
                maxLength: "A maximum of {value} characters are allowed",
                lengthRequired: "A length of {value} is required",
                noSpecialChars: "No special characters may be used",
                commentValidation: "Not all characters you have used are allowed",
                descriptionPattern: "Only the special Chars -_ are allowed",
            },
            actions: {
                changeSortorder: "An unknown error occurred while changing the order.",
                create: "An unknown error occurred while creating",
                delete: "An unknown error occurred while deleting",
                save: "An unknown error occurred while saving",
            },
            uniform: {
                number: {
                    required: "Please enter the uniform number",
                    maxLength: "The number can be a maximum of 7 characters long",
                    min: "The number must be greater than 0",
                },
                acronym: {
                    pattern: "The acronym may not contain special characters or numbers",
                    length: "The acronym must be 2 characters long",
                },
            },
            user: {
                username: {
                    pattern: "The username may not contain special or blank characters",
                    duplicate: "The username is allready used by different user",
                },
            },
            custom: {
                material: {
                    typename: {
                        duplication: "The Name is already used by another Material in this Group",
                    },
                    groupname: {
                        duplication: "Another Group with this name already exists",
                    },
                },
                uniform: {
                    type: {
                        nameDuplication: "A type with this name already exists",
                        acronymDuplication: "The acronym is already used by the type {name}",
                    },
                    generation: {
                        nameDuplication: "For this type of Uniform a generation with the name already exists",
                    }
                },
            },
            redirects: {
                code: {
                    duplication: "The code is already used by another redirect of this or another association",
                },
            }
        },
        success: {
            changeSortorder: "The order was changed successfully",
        },
    },
    expandableArea: {
        showMore: "Show more",
        showLess: "Show less",
    },
    login: {
        header: "Login",
        label: {
            assosiation: "Association",
            username: "Username",
            password: "Password",
            login: "Login"
        },
        error: {
            unknown: "The login attempt failed, please try again.",
            failed: "Username or password are invalid"
        },
    },
    notFound: {
        pageHeader: "Page not found",
        header: "Page not found",
        message: "This route does not exists",
    },
    generalOverview: {
        header: "Staff",
        openCadet: "Open staff overview",
        issueCertificate: "Issue certificate",
    },
    cadetDetailPage: {
        delete: {
            error: "The person could not be deleted",
            header: "Delete person",
            message: "Are you sure you want to permanently delete the person {firstname} {lastname}?",
        },
        header: {
            uniformTable: "Uniform parts",
            cadetTable: "Staff data",
            materialTable: "Materials",
            inspection: "Uniform inspection",
            inspecting: "Inspecting VK",
            deficiencies: "Deficiencies",
            oldDeficiencies: "Old deficiencies",
            newDeficiencies: "New deficiencies",
            "amountUnresolved#other": "- {count} unresolved",
            "amountUnresolved#zero": "- All resolved",
        },
        inspection: {
            noDeficiencies: "No deficiencies present",
            saved: "Inspection successfully saved",
            otherMaterials: "Other materials",
        },
        returnUniform: {
            error: "An error occurred while withdrawing the uniform part. Please try again",
        },
        issueMaterial: {
            header: "Issue {group}",
            error: ""
        },
        "defaultIssuedWarning#one": "{count} piece should be issued",
        'defaultIssuedWarning#other': "There should be {count} pieces issued",
        multitypeWarning: "Only 1 type of this material should be issued",
        tooltips: {
            inspection: {
                inspected: "Cadets inspected:\nUpdate cadet inspection",
                notInspected: "Cadets uninspected:\nStart cadet inspection"
            },
        },
    },
    uniformList: {
        filter: "Filter",
        other: "other filters",
        withOwner: "with owner",
        withoutOwner: "without owner",
        selectAll: "Select all",
        error: {
            activ: "At least one option must be selected from Active and Passive!",
            owner: "At least one option must be selected from with and without user!",
        },
        search: {
            invalid: "Search input invalid",
            label: "Search",
        },
        'numberOfEntries#one': "{count} entry",
        'numberOfEntries#zero': "No entries",
        'numberOfEntries#other': "{count} entries",
        noData: "No data loaded",
        header: "Uniform parts",
    },
    uniformOffcanvas: {
        deleteAction: {
            header: "Delete {type} {number}",
            "message.one": "Should the uniform part {type} {number} really be deleted?",
            "message.two": "This action cannot be undone.",
            "success": "The uniform part was successfully deleted.",
            "failed": "The uniform part could not be deleted.",
        },
        deficiency: {
            header: "Deficiencies",
            includeResolved: "Show resolved deficiencies",
            cardLabel: "Deficiency {index}",
            createCardLabel: "Create new deficiency",
            "label.actions": "Actions for deficiency {index}",
            "label.comment": "Comment",
            "label.deficiencyType": "Type of deficiency",
            "label.date.created": "Created on:",
            "label.date.resolved": "Resolved on:",
            "label.date.updated": "Last updated on:",
            "label.user.created": "Created by:",
            "label.user.resolved": "Resolved by:",
            "label.user.updated": "Last updated by:",
            "noDeficiencies": "No deficiencies present",
        },
        history: {
            "header": "History",
            "label.dateIssued": "Issued on",
            "label.dateReturned": "Returned on",
            "label.cadet": "Person",
            "title.deleted": "Person deleted",
            "noEntries": "No entries",
        }
    },
    createUniform: {
        pagination: {
            known: "Known numbers",
            generate: "Generate numbers",
        },
        header: {
            page: "Create new uniform items",
            configurator: "Configuration",
            numberInput: "Enter numbers",
            itemAmounts: "Number of uniform parts",
            revalidateNumbers: "Check numbers",
        },
        label: {
            add: "Add",
            amount: "Amount",
            numberStart: "Numbers (from)",
            until: "Until",
            continuous: "Continuous numbers",
            continuousTooltip: {
                line1: "For continuous numbers, consecutive numbers are searched for each size.",
                line2: "There can still be gaps between the sizes.",
            },
        },
        create: {
            "label": "Create {count}",
            "success#one": "One uniform part was successfully created.",
            "success#other": "{count} uniform parts were successfully created.",
            "failed#one": "The uniform part could not be created.",
            "failed#other": "The uniform parts could not be created.",
        },
        errors: {
            "endBiggerStart": "The start number must be smaller than or equal to the end number.",
            "maxItems": "No more than 99 uniform parts can be created at the same time.",
            "minNumber": "At least one number must be generated.",
            "inUse": "The number is already assigned.",
        }
    },
    sidebar: {
        logout: "Logout",
        changeLanguage: "Change language",
        links: {
            cadetOverview: "Staff",
            uniformOverview: "Uniform",
            create: {
                group: "Create",
                cadet: "Person",
                uniform: "Uniform",
            },
            inspection: {
                group: "Inspection",
                start: "Start",
                stop: "Stop",
                unfinished: "Finish old inspection",
                inspection: "Administration",
            },
            administration: {
                group: "Administration",
                uniform: "Uniform",
                size: "Sizes",
                material: "Materials",
                deficiency: "Deficiency",
            },
            userOverview: "Accesses",
            redirects: "Redirects",
        },
    },
    redirects: {
        title: "Redirects",
        code: "Code",
        target: "Target",
        targetPlaceholder: "https://www.test.com",
        active: "Status",
        "activeLabel.true": "Active",
        "activeLabel.false": "Inactive",
        sourceUrl: "Source URL",
    },
    admin: {
        uniform: {
            header: "Uniform administration",
            changeSizelistWarning: "When changing the selected size list, the size information of uniform parts of this generation may be lost.",
            type: {
                deleteModal: {
                    header: "Delete uniform type \"{type}\"",
                    message: {
                        part1: "Should the uniform type \"{type}\" really be deleted?",
                        part2: "All ",
                        'part3#one': "{count} uniform part",
                        'part3#other': "{count} uniform parts",
                        part4: " of this type will be deleted.",
                    },
                    confirmationText: "Uniform type-{type}",
                }
            },
            generationList: {
                "header.create": "create new generation",
                deleteModal: {
                    header: "Delete generation \"{generation}\"",
                    message: {
                        part1: "Are you sure you want to delete this generation?",
                        part2: "This action is permanent and cannot be reversed. ",
                        part3: "All uniform parts assigned to this generation will remain.",
                    },
                    confirmationText: "Generation-{generation}",
                },
                updateModal: {
                    changeSizeHeader: "Change size list",
                    changeSizeMessage: "When changing the selected size list, the size information of uniform parts of this generation may be lost",
                    nameDuplicationError: "A generation with this name already exists",
                }
            },
            size: {
                header: "Sizes",
                changePositionModal: {
                    header: "Change position for \"{size}\"",
                    label: "Position",
                },
                createModal: {
                    header: "Create new size",
                    label: "Size",
                    nameDuplicationError: "This size already exists",
                },
                deleteModal: {
                    header: "Delete size \"{size}\"",
                    message: "Should the size really be deleted. This action is not reversible."
                },
            },
            sizelist: {
                nameDuplicationError: "A size list with this name already exists",
                otherSizes: "other sizes",
                selectedSizes: "selected sizes",
                createModal: {
                    header: "create new size list",
                },
                renameModal: {
                    header: "Rename size list",
                },
                deleteWarning: {
                    header: "Delete size list \"{name}\"",
                    message: {
                        line1: "Are you sure you want to delete the size list?",
                        line2: "This action is not reversible",
                    },
                },
                deleteFailure: {
                    header: "The size list cannot be deleted",
                    message: "The size list cannot be deleted as it is still being used by the {entity} {name}."
                }
            },
        },
        material: {
            header: {
                page: "Material Configuration",
                groupList: "Material Groups",
                editMaterial: "Edit Material \"{group}-{type}\"",
                createMaterial: "Create new \"{group}\"",
            },
            delete: {
                group: {
                    header: "Delete Material Group \"{group}\"",
                    message: "Should the Material Group \"{group}\" really be deleted? All information related to this Material Group will be lost!",
                    confirmationText: "MaterialGroup_{group}",
                },
                material: {
                    header: "Delete Material \"{group} - {type}\"",
                    message: "Should the Material Type \"{type}\" of the Group \"{group}\" really be deleted? All data associated with the Material Type will be irretrievably lost",
                    confirmationText: "Material_{group}-{type}",
                },
            },
            error: {
                missingTypes: "No type is available for the Material Group {group}! At least one type is required for each group!",
                createGroup: "Creating the Material Group has failed",
                groupNameDuplicate: "The group name is already taken",
                materialNameDuplicate: "The name is already used by another material of the group",
                maxIssuedDefault: "The amount of default issued materials must not be greater than {value}",
            },
        },
        user: {
            header: {
                page: "User overview",
                username: "Username",
                name: "Name",
                role: "Role",
                status: "State",
            },
            deleteWarning: {
                header: "Delete user {user}",
                message: "Are you sure the user schould be deleted",
            },
            error: {
                changePassword: "Saving of the password failed",
            },
            saved: "User updated successfuly",
            created: "User created successfuly",
        },
        deficiency: {
            disabled: "disabled on: ",
            header: {
                page: "deficiency types",
                name: "name",
                dependent: "depends on",
                relation: "relates to",
                active: "active",
                resolved: "resolved",
            },
            info: {
                dependent: "Indicates what the defect directly depends on. For example, in the case of uniform parts, the defect always remains with the uniform part, even if the owner changes.",
                relation: "Indicates whether a person’s defect indirectly relates to another entity. For example, in the case of the type 'Item too small' the defect would depend on the person but indirectly relate to a uniform part."
            },
            errors: {
                deactivate: "Der Typ konnte nicht deaktiviert werden. Laden Sie die Seite neu und versuchen es erneut",
                delete: "Das Löschen des Typs ist fehlgeschlagen. Versuchen Sie es nach einem relaod erneut",
                reactivate: "Der Typ konnte nicht reaktiviert werden. Laden sie die Seite neu und versuchen es erneut",
            },
            entity: {
                cadet: "person",
                uniform: "uniform",
                material: "material",
            },
            delete: {
                header: "Typ {type} löschen",
                'message#zero': "Soll der Typ wirklich gelöscht werden? Diese Aktion ist nicht wieder umkehrbar.",
                'message#one': "Soll der Typ wirklich gelöscht werden? Hierbei wird der eine vorhandene Mangel ebenfalls gelöscht. Diese Aktion ist nicht wieder umkehrbar.",
                'message#other': "Soll der Typ wirklich gelöscht werden? Hierbei werden alle {count} vorhandenen Mängel ebenfalls gelöscht. Diese Aktion ist nicht wieder umkehrbar.",
            },
        },
    },
    inspection: {
        header: {
            planned: 'planned inspections',
        },
        planned: {
            badge: {
                new: "new",
                planned: "planned",
                active: "active",
                finished: "finished",
                unfinished: "unfinished",
                expired: "expired",
            },
            label: {
                deregistrations: 'Deregistrations',
                onDay: "on the {day}",
                finishInspection: 'finish inspection',
                time: {
                    finished: 'finishing Time:',
                },
                state: 'State',
                date: 'Date',
                name: 'Name',
                noInspections: 'No inspections planned',
            },
            errors: {
                deregistration: "The person could not be deregistered from the inspection",
                register: "The deregistration of the person could not be undone",
                start: "The inspection could not be started",
                nameDuplication: "The name is already used by another inspection",
                endBeforStart: "The end time must be after the start time by {startTime}",
                unfinished: {
                    header: "Old inspection active",
                    message: "There is still an old uniform inspection active. Please finish the old inspection before starting a new one!"
                },
            },
        },
    },
    pageTitles: {
        "login": "Login - Uniformadmin",
        "home": "Home - Uniformadmin",
        "personnel": "Personnel - Uniformadmin",
        "cadet.new": "Create person - Uniformadmin",
        "cadet.person": "{firstname} {lastname} - personnel - Uniformadmin",
        "uniform.new": "Create uniform parts - Uniformadmin",
        "uniform.list": "{type} - uniform parts - Uniformadmin",
        "uniform.list.notProvided": "Uniform parts - Uniformadmin",
        "inspection": "Inspections - Uniformadmin",
        "admin.user": "User administration - Uniformadmin",
        "admin.uniform": "Uniform configuration - Uniformadmin",
        "admin.uniform.size": "Uniform size configuration - Uniformadmin",
        "admin.material": "material configuration - Uniformadmin",
        "admin.deficiency": "deficiency configuration - Uniformadmin"
    },
    modals: {
        messageModal: {
            uniform: {
                return: {
                    header: "Withdraw uniform part",
                    message: "Are you sure you want to withdraw the uniform part {type} {number}?"
                },
                issue: {
                    header: "Issue {type}",
                },
                replace: {
                    header: "Replace {type} {number}",
                },
                issueUnknown: "An unknown problem occurred when assigning the uniform part.",
                issuedException: {
                    header: "Uniform part assigned",
                    message: "The uniform part {type} {number} has already been assigned to the cadet {firstname} {lastname}.",
                    ownerInactive: "The cadet is not active",
                    option: {
                        openCadet: "Open cadets",
                        changeOwner: "Change owner"
                    }
                },
                inactiveException: {
                    header: "Uniform part passive",
                    message: "The uniform part {type} {number} is set to passive and should therefore not be issued. \nShould the uniform part still be issued to the cadet?"
                },
                nullValueException: {
                    header: "Uniform part not found",
                    message: "The uniform part {type} {number} does not exist. Should the uniform part be created new?",
                    createOption: "Create uniform part"
                },
            },
        },
        dangerConfirmation: {
            confirmation: {
                label: "To confirm the action, please enter the following text:",
                error: {
                    required: "Please enter the text for confirmation",
                    pattern: "The text does not match"
                },
            },
        },
        changePassword: {
            header: {
                change: "Change password of {user}",
                create: "Input password for new user",
            },
            requirement: {
                message: "The password must meet the following requirements:",
                1: "at least 8 characters",
                2: "upper and lower case characters",
                3: "at least one number",
            },
            label: {
                password: "Password",
                confirmation: "Repeat password",
            },
            error: {
                password: {
                    required: "Please enter a password",
                    minLength: "The password must be at least 8 characters long",
                    pattern: "The password does not meet all requirements",
                },
                confirmation: {
                    required: "Please confirm the password",
                    invalid: "The passwords do not match",
                },
            },
            save: "Save",
        },
        changeLanguage: {
            header: "Switch language",
            label: "language",
            options: {
                de: "German",
                en: "English",
            },
            cancel: "cancel",
            change: "change",
        },
    },
} as const;
