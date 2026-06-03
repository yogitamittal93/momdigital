import { IsDate, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { IsMomDate } from "src/common/decorators/is-valid-pregnancy-date";

export class RegisterDto {
    @IsEmail({}, {message: 'Please provide a valid email address'})
    email!: string;

    @IsString()
    @MinLength(8, {message: "Password must be at least 8 characters long"})
    password!: string;

    @IsNotEmpty({message: "Name is required"})
    name!: string;

    @IsOptional()
    @IsMomDate('future')
    dueDate?: Date;

    @IsOptional()
    @IsMomDate('past')
    babyBirthDate?: Date;
}
