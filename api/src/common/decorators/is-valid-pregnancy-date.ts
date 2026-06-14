import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isMomDate', async: false })
export class IsMomDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (!value) return false;
    const date = new Date(value as string | number | Date);
    const today = new Date();
    const type = args.constraints[0] as string | undefined; // Get the type of date (dueDate or babyBirthDate)
    if (type === 'future') {
      const nineMonthsFromNow = new Date(
        today.getFullYear(),
        today.getMonth() + 9,
        today.getDate(),
      ); // 9 months from today
      return date >= today && date <= nineMonthsFromNow; // Valid if the date is between today and 9 months from now
    }
    if (type === 'past') {
      return date <= today; // Valid if the date is in the past
    }
    return false;
  }
  defaultMessage(args: ValidationArguments): string {
    const type = args.constraints[0] as string | undefined;
    return type === 'future'
      ? 'Due date must be in the future and within the next 9 months.'
      : 'Baby birth date must be in the past.';
  }
}

export function IsMomDate(
  type: 'future' | 'past',
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [type],
      validator: IsMomDateConstraint,
    });
  };
}
