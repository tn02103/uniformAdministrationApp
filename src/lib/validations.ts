import { Cadet } from "@/types/globalCadetTypes";
import { UniformGeneration, UniformType } from "@/types/globalUniformTypes";

export const NameValidation = {
    required: {
        value: true,
        message: "Bitte einen Namen angeben",
    },
    pattern: {
        value: /^[\w \xC0-\xFF]+$/,
        message: "Es dürfen keine Sonderzeichen genutzt werden",
    },
    maxLength: {
        value: 20,
        message: "Der Name darf nicht länger als 20 Zeichen sein. Bitte kürzen sie zur Not den Namen"
    }
}
export const uuidValidationPattern = /^[\w\d-]{12,36}$/;
export const booleanValidationPattern = /^(true)|(false)$/;
export const commentValidationPattern = /^[\w<> ,.:;/()&%?!€$+"'\-\n\xC0-\xFF]*$/;
export const passwordValidationPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

export const descriptionValidationPattern = /^[\w \/\-_\xC0-\xFF]+$/
export const userNameValidationPattern = /^[\w\d]{2,6}$/;
export const nameWithSpaceValidationPattern = /^[\w \xC0-\xFF]+$/;
export const nameValidationPattern = /^[\w \xC0-\xFF]+$/;
export const acronymValidationPattern = /^[A-Z]{1,2}$/

export const uniformNumberValidation = {
    test: (value: number) => (
        Number.isInteger(value)
        && value < 16000000
        && value > 0
    )
}
export const booleanValidation = {
    test: (value: boolean) => (
        (typeof value === "boolean")
    )
}

export const cadetValidation = {
    test: (cadet: Cadet) => (
        uuidValidationPattern.test(cadet.id)
        && nameValidationPattern.test(cadet.lastname)
        && nameValidationPattern.test(cadet.firstname)
        && (typeof cadet.active === "boolean")
        && (typeof cadet.comment === "string")
    ),
    testWithoutId: (cadet: Cadet) => (
        nameValidationPattern.test(cadet.lastname)
        && nameValidationPattern.test(cadet.firstname)
        && (typeof cadet.active === "boolean")
        && (typeof cadet.comment === "string")
    )
}

export const uniformTypeValidator = {
    test: (type: UniformType) => (
        uuidValidationPattern.test(type.id)
        && nameValidationPattern.test(type.name)
        && acronymValidationPattern.test(type.acronym)
        && Number.isInteger(type.issuedDefault)
        && (typeof type.usingGenerations === "boolean")
        && (typeof type.usingSizes === "boolean")
        && (!type.fk_defaultSizelist || uuidValidationPattern.test(type.fk_defaultSizelist))
    )
}

export const uniformGenerationValidator = {
    test: (gen: UniformGeneration) => (
        uuidValidationPattern.test(gen.id)
        && descriptionValidationPattern.test(gen.name)
        && (!gen.fk_sizelist || uuidValidationPattern.test(gen.fk_sizelist))
        && (typeof gen.outdated === "boolean")
        && Number.isInteger(gen.sortOrder)
    )
}
