export default {
    common: {
        of: "from",
        comment: "Comment",
        description: "Description",
        name: "Name",
        type: "Type",
        loading: "Loading",
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
            prevStep: "Back",
            nextStep: "Next",
            edit_item: "Edit {item}",
            issue_item: "Issue {item}",
            issue: "Issue",
            return: "Withdraw",
            replace: "Replace",
            rename: "Rename",
            changeIssued: "Change quantity & type",
            delete: "Delete",
            load: "Load",
            moveUp: "Move up",
            moveDown: "Move down",
            changePosition: "Change position",
            changePassword: "Change password",
            ok: "Understood",
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
                defaultSizeList: "Standard size list"
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
                patternPositive: "Please enter a valid positive number",
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
                noSpecialChars: "No special characters may be used",
                commentValidation: "Not all characters you have used are allowed",
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
        },
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
            oldDeficiencies: "old deficiencies",
            newDeficiencies: "new deficiencies",
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
    createUniform: {
        pagination: {
            known: "Numbers known",
            generate: "Generate numbers",
        },
        header: {
            configurator: "Configuration",
            numberInput: "Enter numbers",
            itemAmounts: "Number of uniform parts",
            revalidteNumbers: "Check numbers",
        },
        label: {
            add: "add",
            amount: "Amount",
            numberStart: "Numbers (from)",
            until: "until",
            continuous: "Continuous numbers",
            continuousTooltip: {
                line1: "For continuous numbers, consecutive numbers are searched for each size.",
                line2: "There can still be jumps between the sizes.",
            },
        },
        create: {
            "label": "Create {count}",
            "success#one": "One uniform part was successfully created",
            "success#other": "{count} uniform parts were successfully created",
            "failed#one": "The uniform part could not be created",
            "failed#other": "The uniform parts could not be created",
        },
        errors: {
            "endBiggerStart": "The start number must be smaller or equal to the end number",
            "maxItems": "No more than 99 uniform parts can be created at the same time",
            "minNumber": "At least one number must be generated",
            "inUse": "The number is already assigned",
        }
    },
    sidebar: {
        logout: "Logout",
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
            },
            administration: {
                group: "Administration",
                uniform: "Uniform",
                size: "Sizes",
                material: "Materials",
            },
            userOverview: "Accesses",
        },
    },
    admin: {
        uniform: {
            header: "Uniform administration",
            changeSizeListWarning: "When changing the selected size list, the size information of uniform parts of this generation may be lost",
            type: {
                deleteModal: {
                    header: "Delete uniform type \"{type}\"",
                    message: {
                        part1: "Should the uniform type \"{type}\" really be deleted.",
                        part2: "All ",
                        'part3#one': "{count} uniform part",
                        'part3#other': "{count} uniform parts",
                        part4: " of this type will be deleted"
                    },
                    confirmationText: "Uniform type-{type}"
                }
            },
            generationList: {
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
                    editHeader: "Edit generation \"{generation}\"",
                    createHeader: "Create new generation",
                    changeSizeHeader: "Change size list",
                    changeSizeMessage: "When changing the selected size list, the size information of uniform parts of this generation may be lost",
                    nameDuplicationError: "A generation with this name already exists",
                }
            },
            size: {
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
            sizeList: {
                nameDuplicationError: "A size list with this name already exists",
                otherSizes: "other sizes",
                selectedSizes: "selected sizes",
                createModal: {
                    header: "Create new size list",
                },
                renameModal: {
                    header: "",
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
    },
} as const;
