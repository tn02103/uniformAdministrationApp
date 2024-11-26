"use server";

import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uuidValidationPattern } from "@/lib/validations";
import { UniformNumbersSizeMap } from "@/types/globalUniformTypes";
import { genericSAValidatorV2 } from "../validations";

/**
 * Used to automaticly generate numbers for new UniformItems. Does not reserve the number, neither does it create the uniformitems.
 * @requires AuthRole.inspector
 * @param uniformTypeId 
 * @param numberCount {sizeId: stirng, value: number}[].
 *  Gives the amount of numbers to be created per size. 
 *  If the Uniformtype does not use sizes, the Array has only one element with sizeId="amount"
 * @param continuous if continuous all numbers for one size are continuous. Numbers of different sizes are not continuous
 * @returns object of UniformNumberSizeMap
 */
export const generateUniformNumbers = (uniformTypeId: string, numberCount: { sizeId: string, value: number }[], continuous: boolean) => genericSAValidatorV2(
    AuthRole.inspector,
    (uuidValidationPattern.test(uniformTypeId)),
    { uniformTypeId }
).then(async ({ }) => {
    // getting Data
    const year = (+(new Date().getFullYear()) % 100);
    let usedNumbers: number[] = await prisma.$queryRaw<{ partialNumber: string }[]>` 
        SELECT SUBSTRING(CAST(number AS TEXT), 3) AS "partialNumber"
          FROM base.uniform
         WHERE number > 999
           AND LEFT(CAST(number AS TEXT), 2) = CAST(${year} AS TEXT)
           AND fk_uniform_type = ${uniformTypeId}
           AND recdelete IS NULL
           `.then((data) => data.map(x => +x.partialNumber));

    const numbersArray: UniformNumbersSizeMap = [];
    for (const count of numberCount) {
        const n = continuous ?
            getContinuousIds(0, usedNumbers, +count.value, year)
            : getNotContinuousIds(usedNumbers, +count.value, year);
        numbersArray.push({
            sizeId: count.sizeId,
            numbers: n,
        });
        usedNumbers = [...usedNumbers, ...n.map(v => Number(String(v).substring(2)))];
    }
    return numbersArray;
});

/**
 * Used to validate if uniformNumbers are allready in use. Does not reserve the number, neither does it create the uniformItems.
 * @requires AuthRole.inspector
 * @param uniformTypeId 
 * @param uniformNumbers array of numbers to be checked.
 * @returns for each number provided an object of type {value: number, used: boolean} is returned. 
 */
export const validateUniformNumberAvaiability = (uniformTypeId: string, uniformNumbers: number[]) => genericSAValidatorV2(
    AuthRole.inspector,
    (uuidValidationPattern.test(uniformTypeId)
        && uniformNumbers.every(n => Number.isInteger(n))),
    { uniformTypeId }
).then(async () => {
    const numberInUse = await prisma.uniform.findMany({
        select: {
            number: true,
        },
        where: {
            fk_uniformType: uniformTypeId,
            recdelete: null,
            number: {
                in: uniformNumbers,
            }
        },
        orderBy: { number: "asc" }
    }).then(result => result.map(n => n.number));

    return uniformNumbers.map(n => ({
        value: n,
        used: numberInUse.includes(n),
    }));
});

/**
 * Helper Function for generateUniformNumbers
 * @private
 * @param startId 
 * @param usedNumbers 
 * @param amount 
 * @param yearDigits 
 * @returns Array of Uniformnumbers continuous
 */
function getContinuousIds(startId: number, usedNumbers: number[], amount: number, yearDigits: number): number[] {
    let firstUnused = null;
    let currentNumber = startId;
    // find first unused Numbers
    while (firstUnused == null) {
        if (usedNumbers.find(n => n === currentNumber) !== undefined) {
            currentNumber++;
        } else {
            firstUnused = currentNumber;
        }
    }

    // check <amount> of numbers after firstUnused Number to be unused
    const ids = []
    for (; currentNumber < (+firstUnused + +amount); currentNumber++) {
        // when number is used retry from that number and abbort current try
        if (usedNumbers.find(n => n === currentNumber) !== undefined) {
            return getContinuousIds(currentNumber + 1, usedNumbers, amount, yearDigits);
        } else {
            ids.push(+`${yearDigits}${(currentNumber < 10) ? "0" : ""}${currentNumber}`);
        }
    }

    // when not abbortet all required numbers are unused
    return ids;
}
/**
 * Helper Function for generateUniformNumbers
 * @param usedNumbers 
 * @param amount 
 * @param yearDigits 
 * @returns Array of Uniformnumbers not continuous
 */
function getNotContinuousIds(usedNumbers: number[], amount: number, yearDigits: number): number[] {
    const ids = [];
    let currentNumber = 0;
    while (ids.length < amount) {
        if (usedNumbers.find(n => n === currentNumber) === undefined) {
            ids.push(+`${yearDigits}${(currentNumber < 10) ? "0" : ""}${currentNumber}`)
        }
        currentNumber++;
    }
    return ids;
}
