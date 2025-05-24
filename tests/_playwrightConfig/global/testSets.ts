import { AuthRole } from "../../../src/lib/AuthRoles";

export type ValidationTestType = {
    testValue: string | number | boolean;
    valid: boolean;
}

export const uuidValidationTests: ValidationTestType[] = [
    { testValue: "866dbfe7-5569-11ed-97e8-6045cba16b6e", valid: true },
    { testValue: "toShort", valid: false },
    { testValue: "CharsNoAllowed()Test", valid: false },
    { testValue: "tolong-866dbfe7-5569-11ed-97e8-6045cba16b6e", valid: false },
];
export const booleanStringValidationTests: ValidationTestType[] = [
    { testValue: true, valid: true },
    { testValue: false, valid: true },
    { testValue: "true", valid: true },
    { testValue: "false", valid: true },
    { testValue: 0, valid: false },
    { testValue: 1, valid: false },
    { testValue: "something", valid: false },
];
export const descriptionValidationTests: ValidationTestType[] = [
    { testValue: "simpleString", valid: true },
    { testValue: "string with number23", valid: true },
    { testValue: "nameString withüöä", valid: true },
    { testValue: "String with-_/", valid: true },
    { testValue: "String with !?=`#", valid: false },
];
export const nameValidationTests: ValidationTestType[] = [
    { testValue: "nameString", valid: true },
    { testValue: "nameString withüöä", valid: true },
    { testValue: "name 123", valid: true },
    { testValue: "String with-_", valid: false },
    { testValue: "String with !?=", valid: false }
];
export const booleanValidationTests: ValidationTestType[] = [
    { testValue: true, valid: true },
    { testValue: false, valid: true },
    { testValue: "true", valid: false },
    { testValue: "false", valid: false },
    { testValue: 0, valid: false },
    { testValue: 1, valid: false },
    { testValue: "something", valid: false }
];
export const usernameTests: ValidationTestType[] = [
    { testValue: "ttest", valid: true },
    { testValue: "t3k9k5", valid: true },
    { testValue: "te st", valid: false },
    { testValue: "toLongoh", valid: false },
    { testValue: "d", valid: false },
    { testValue: "sp?!", valid: false },
    { testValue: "umläü", valid: false },
]
export const authRoleTests: ValidationTestType[] = [
    { testValue: AuthRole.notAuthorised, valid: true },
    { testValue: 2, valid: true },
    { testValue: AuthRole.admin, valid: true },
    { testValue: 6, valid: false },
    { testValue: "admin", valid: false },
    { testValue: "someString", valid: false },
]
export const passwordTests: ValidationTestType[] = [
    { testValue: "Password13", valid: true },
    { testValue: "Password13!?", valid: true },
    { testValue: "1Short!", valid: false },
    { testValue: "bigie123?=", valid: false },
    { testValue: "noNumberNovember!!", valid: false },
    { testValue: "TOBIG12!!", valid: false },
]

export const numberValidationTest: ValidationTestType[] = [
    { testValue: 10, valid: true },
    { testValue: 240, valid: true },
    { testValue: 260, valid: true },
    { testValue: -1, valid: true },
    { testValue: "string", valid: false },
    { testValue: false, valid: false },
];

export const uniformOrderByTests: ValidationTestType[] = [
    { testValue: "number", valid: true },
    { testValue: "generation", valid: true },
    { testValue: "size", valid: true },
    { testValue: "comment", valid: true },
    { testValue: "owner", valid: true },
    { testValue: "string", valid: false },
    { testValue: true, valid: false },
    { testValue: 12, valid: false },
]

type numberValidationTestType = (props: { max?: number, min?: number, strict?: boolean, testEmpty?: boolean, emptyValid?: boolean }) => ValidationTestType[]
export const numberValidationTests: numberValidationTestType = ({ max, min, strict, testEmpty, emptyValid }) => {
    const tests = [
        { testValue: 1, valid: true },
        { testValue: '2', valid: !strict },
        { testValue: "string", valid: false },
        { testValue: false, valid: false },
    ];

    if (max !== undefined) {
        tests.push({ testValue: max, valid: true });
        tests.push({ testValue: max + 1, valid: false });
    }
    if (min !== undefined) {
        tests.push({ testValue: min, valid: true });
        tests.push({ testValue: min - 1, valid: false });
    } else {
        tests.push({ testValue: -3, valid: true });
    }
    if (testEmpty) {
        tests.push({ testValue: '', valid: !!emptyValid });
    }

    return tests;
}
type acronymValidationTestType = (props: { emptyAllowed: boolean }) => ValidationTestType[];
export const acronymValidationTest: acronymValidationTestType = (props) => {
    const tests = [
        { testValue: 'XX', valid: true },
        { testValue: 'X', valid: false },
        { testValue: 'AAX', valid: false },
        { testValue: 'A1', valid: false },
        { testValue: 'A!', valid: false },
        { testValue: '', valid: props.emptyAllowed },
    ];

    return tests;
}
type newNameValidationTestsType = (props: {
    minLength?: number,
    maxLength?: number,
}) => ValidationTestType[];
export const newNameValidationTests: newNameValidationTestsType = (props) => {
    const longString = "ajhgsdfjkahgsdfjkhawebfkshvbsdvasdgfakjewgfakjgsew";
    const tests = [
        { testValue: "name", valid: true },
        { testValue: "naöä", valid: true },
        { testValue: "na23", valid: true },
        { testValue: "St-_", valid: false },
        { testValue: "St?=", valid: false }
    ];
    if (props.minLength) {
        tests.push({ testValue: longString.substring(0, props.minLength), valid: true });
        tests.push({ testValue: longString.substring(0, props.minLength - 1), valid: false });
    }
    if (props.maxLength) {
        tests.push({ testValue: longString.substring(0, props.maxLength), valid: true });
        tests.push({ testValue: longString.substring(0, props.maxLength + 1), valid: false });
    }

    return tests;
}
type newDescriptionValidationTestsType = (props: {
    minLength?: number,
    maxLength?: number,
}) => ValidationTestType[];
export const newDescriptionValidationTests: newDescriptionValidationTestsType = (props) => {
    if (props.maxLength && props.maxLength < 7) throw new Error("TestSet does not support maxlength smaler 10");
    if (props.minLength && props.minLength > 4) throw new Error("TestSet does not support minLength biger than 7");

    const longString = "ajhgsdfjkahgsdfjkhawebfkshvbsdvasdgfakjewgfakjgsew";
    const tests = [
        { testValue: "name", valid: true },
        { testValue: "naöä", valid: true },
        { testValue: "na23", valid: true },
        { testValue: "St-_", valid: true },
        { testValue: "St!?=`#", valid: false }
    ];
    if (props.minLength) {
        tests.push({ testValue: longString.substring(0, props.minLength), valid: true });
        tests.push({ testValue: longString.substring(0, props.minLength - 1), valid: false });
    }
    if (props.maxLength) {
        let value = longString;
        while (value.length < props.maxLength) {
            value += value;
        }
        tests.push({ testValue: value.substring(0, props.maxLength), valid: true });
        tests.push({ testValue: value.substring(0, props.maxLength + 1), valid: false });
    }

    return tests;
}

export const CommentValidationTests = (props: { maxLength?: number, minLength?: number }): ValidationTestType[] => {
    if (props.maxLength && props.maxLength < 10) throw new Error("TestSet does not support maxlength smaler 10");
    if (props.minLength && props.minLength > 7) throw new Error("TestSet does not support minLength biger than 7");


    const longString = "ajhgsdfjkahgsdfjkhawebfkshvbsdvasdgfakjewgfakjgsew";
    const tests: ValidationTestType[] = [
        { testValue: "string", valid: true },
        { testValue: "öäüöÄÜß", valid: true },
        { testValue: "0123456789", valid: true },
        { testValue: ".:;-+!?$%€", valid: true },
        { testValue: "<>\n m/()\"\'", valid: true },
        { testValue: "stred{}", valid: false },
        { testValue: "sterf[]", valid: false },
    ]
    if (props.minLength) {
        tests.push({ testValue: longString.substring(0, props.minLength), valid: true });
        tests.push({ testValue: longString.substring(0, props.minLength - 1), valid: false });
    }
    if (props.maxLength) {
        let value = longString;
        while (value.length < props.maxLength) {
            value += value;
        }
        tests.push({ testValue: value.substring(0, props.maxLength), valid: true });
        tests.push({ testValue: value.substring(0, props.maxLength + 1), valid: false });
    }
    return tests;
}
