import { IsDate, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { IsValidPregnancyDate } from "src/common/decorators/is-valid-pregnancy-date";

export class RegisterDto {
    @IsEmail({}, {message: 'Please provide a valid email address'})
    email!: string;

    @IsString()
    @MinLength(8, {message: "Password must be at least 8 characters long"})
    password!: string;

    @IsNotEmpty({message: "Name is required"})
    name!: string;

    @IsOptional()
    @IsValidPregnancyDate()
    dueDate?: Date;

    @IsOptional()
    @IsDateString() 
    babyBirthDate?: Date;
}
