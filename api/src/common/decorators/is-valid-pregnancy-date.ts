import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { register } from "module";

@ValidatorConstraint({ name: "isValidPregnancyDate", async: false }) 
export class IsValidPregnancyDateConstraint implements ValidatorConstraintInterface {
    validate(value:any, args: ValidationArguments) {
        const date = new Date(value);
        const today = new Date();
        const nineMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 9, today.getDate()); // 9 months from today
        return date >= today && date <= nineMonthsFromNow; // Valid if the date is between today and 9 months from now
    }

    defaultMessage(args: ValidationArguments) {
        return "Pregnancy date must be in the future and within the next 9 months.";
    }
}

export function IsValidPregnancyDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidPregnancyDateConstraint,
        });
    };
}