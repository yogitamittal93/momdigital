import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
async register(dto: RegisterDto) {
    if(!dto.dueDate && !dto.babyBirthDate) {
        throw new Error("Either due date or baby birth date must be provided.");
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const newUser = {
        ...dto,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
    return {
        message: "Mom registered successfully",
        user: newUser
    }

}

}
