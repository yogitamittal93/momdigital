import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}
async register(dto: RegisterDto) {
    if(!dto.dueDate && !dto.babyBirthDate) {
        throw new BadRequestException("Either due date or baby birth date must be provided.");
    }
    const existingUser = await this.prisma.user.findUnique({
        where: {
            email: dto.email,
        },
    });
    if (existingUser) {
        throw new ConflictException("User with this email already exists.");
    }
   // const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
        data: {
            ...dto,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    })
    delete user.password;
    return {
        message: "Mom registered successfully",
        user,
    };

}

async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
        where: {
            email: dto.email,
        },
    });
    if (!user) {
        throw new UnauthorizedException("Invalid email or password.");
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
        throw new UnauthorizedException("Invalid email or password.");
    }
    delete user.password;
    return {
        message: "Login successful",
        user,
        token: this.jwtService.sign({ userId: user.id , email: user.email }),
    };

}

async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
        where: {id: userId},
    });
    if (!user) {
        throw new UnauthorizedException("User not found.");
    }
    delete user.password;
    return user;
}
}