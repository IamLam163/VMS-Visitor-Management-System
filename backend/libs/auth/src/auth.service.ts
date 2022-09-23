import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';
import { UserService } from "@vms/user";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";
import * as FormData from "form-data";

import { LoginFailed } from "./errors/loginFailed.error";
import { SignUpFailed } from "./errors/signupFailed.error";
import { MailService } from "@vms/mail";
import {VerificationFailed} from "./errors/verificationFailed.error";

@Injectable()
export class AuthService {
    FACE_REC_CONNECTION: string;
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private mailService: MailService,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {
        this.FACE_REC_CONNECTION = this.configService.get<string>("FACE_REC_API_CONNECTION");
    }

    async validateUser(email: string, pass: string) {
        const user = await this.userService.findOne(email);

        if (user) {
            const samePassword = await bcrypt.compare(pass, user.password);
            if (samePassword) {
                return user;
            }

            throw new LoginFailed("Incorrect Password");
        }

        throw new LoginFailed("User not found");
    }

    async login(user: any) {
        const validUser = await this.validateUser(user.email, user.password);

        if (validUser !== null) {
            const payload = {
                email: user.email,
                permission: validUser.permission,
                name: validUser.name
            };
            return {
                access_token: this.jwtService.sign(payload),
            };
        }
    }

    async signup(user: any) {
        const emailUser = await this.userService.findOne(user.email);
        
        if(emailUser === null) {
            if(await this.cacheManager.get(user.email) === undefined) {
                const hashPass = await bcrypt.hash(user.password, 3);            
                let permission = 0;
                    
                if(user.type === "resident") {
                    permission = -2;
                } else if(user.type === "receptionist") {
                    permission = -1;
                } else if(user.type === "admin") {
                    permission = -3;
                } else {
                    return {
                        "error": "Invalid User Type Provided"
                    };
                }
                
                const formData = new FormData();
                formData.append('file', user.file.buffer, { filename: user.file.originalname });

                const response = await firstValueFrom(
                    this.httpService.post(
                        `${this.FACE_REC_CONNECTION}/getNumFaces`,
                        formData,
                        { headers: formData.getHeaders() }
                        )
                );

                console.log(response.data.result);
                if(response.data.result === 0) {
                    return {
                        "error": "No faces detected in uploaded file"
                    };
                }

                const verifyID = randomUUID();

                await this.cacheManager.set(user.email, {
                    email: user.email,
                    password: hashPass,
                    confirmationPin:user.confirmationPin,
                    permission: permission,
                    idNumber: user.idNumber,
                    name: user.name,
                    file: user.file,
                    idDocType: user.idDocType,
                    verifyID: verifyID,
                }, { ttl: 1000 });

                await this.mailService.sendVerify(user.email, verifyID);

                return {
                    "result": true
                };
            }

            return {
                "error": "User is already signed up"
            };
        }    
        
        return {
            "error": "User already exists"
        };
    }

    async verifyNewAccount(verifyID: string, email: string) {
        if(/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/.test(verifyID)) {
            const user: any = (await this.cacheManager.get(email));
            if(user !== undefined) {
                if(user.verifyID === verifyID) {
                    await this.cacheManager.del(email);
                    let encodedData = await user.file.buffer.toString("base64");

                    if(user.file.originalname.indexOf("jpeg") || user.file.originalname.indexOf("jpg")) {
                        encodedData = "data:image/jpeg;base64," + encodedData;
                    } else {
                        encodedData = "data:image/png;base64," + encodedData;
                    }

                    await this.userService.createUser(
                        user.email, 
                        user.password, 
                        user.permission, 
                        user.idNumber, 
                        user.idDocType, 
                        user.name,
                        user.confirmationPin ? user.confirmationPin : "",
                        encodedData,
                    );
                    return true;
                }
                throw new VerificationFailed("Invalid Verification ID given");
            }

            throw new VerificationFailed("Email Not Found, please signup again");
        }

        throw new VerificationFailed("Invalid verification ID");
    }
}
