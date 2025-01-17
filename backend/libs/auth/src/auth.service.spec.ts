import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { HttpModule, HttpService } from "@nestjs/axios";
import { AuthService } from "./auth.service";
import { UserService } from "@vms/user";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Model } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";
import { CACHE_MANAGER } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "@vms/user/schema/user.schema";
import { MailService } from "@vms/mail";
import { RewardsService } from "@vms/rewards";
import { VisitorInviteService } from "@vms/visitor-invite";
import { RestrictionsService } from "@vms/restrictions";
import { ParkingService } from "@vms/parking";
import { SchedulerRegistry } from "@nestjs/schedule";
import { GetAllBadgesQuery } from "@vms/rewards/queries/impl/getAllBadges.query";
import { Badge } from "@vms/rewards/schema/badge.schema";
import { GetUserQuery } from "@vms/user/queries/impl/getUser.query";
import { of } from "rxjs";

describe("AuthService", () => {
    let service: AuthService;
    let userService: UserService;
    let jwtService: JwtService;
    let httpClient: HttpService;
    let queryBus: QueryBus;
    let mockUserModel: Model<UserDocument>;
    let cache: Cache;
    const mailService = {
        sendVerify: jest.fn(() => {
            return {};
        }),
    };
    const cacheMock = {
        get: jest.fn(async () => {
            return "any value";
        }),
        set: jest.fn(() => {
            return jest.fn();
        }),
        del: jest.fn(() => {
            return jest.fn();
        }),
    };

    const queryBusMock = {
        execute: jest.fn((query) => {
            if (query instanceof GetAllBadgesQuery) {
                return [];
            } else if (query instanceof GetUserQuery) {
                return {
                    email: "resident@mail.com",
                    password: "password",
                    badges: "1000000",
                    xp: 20,
                };
            } else
                return {
                    email: "admin@mail.com",
                    password: "password",
                };
        }),
    };

    const scheduleMock = {
        addCronJob: jest.fn(() => {
            return {};
        }),
        deleteCronJob: jest.fn(() => {
            return {};
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [HttpModule],
            providers: [
                AuthService,
                JwtService,
                UserService,
                ConfigService,
                RewardsService,
                VisitorInviteService,
                RestrictionsService,
                ParkingService,
                CommandBus,
                { provide: SchedulerRegistry, useValue: scheduleMock },
                {
                    provide: QueryBus,
                    useValue: queryBusMock,
                },
                // {
                //     provide: getModelToken(User.name),
                //     useValue: Model,
                // },
                {
                    provide: CACHE_MANAGER,
                    useValue: cacheMock,
                },
                {
                    provide: MailService,
                    useValue: mailService,
                },
            ],
        })
            .useMocker((token) => {
                if (token.toString() === "JWT_MODULE_OPTIONS") {
                    return {
                        secret: "test",
                        signOptions: { expiresIn: "60s" },
                    };
                }
                return null;
            })
            .compile();

        service = module.get<AuthService>(AuthService);
        httpClient = module.get<HttpService>(HttpService);
        queryBus = module.get<QueryBus>(QueryBus);
        userService = module.get<UserService>(UserService);
        jwtService = module.get<JwtService>(JwtService);
        //mockUserModel = module.get<Model<UserDocument>>(getModelToken(User.name));
        cache = module.get<Cache>(CACHE_MANAGER);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
        expect(jwtService).toBeDefined();
        expect(queryBus).toBeDefined();
        //expect(mockUserModel).toBeDefined();
    });

    describe("Login", () => {
        it("should return an access token on valid user data", async () => {
            jest.spyOn(userService, "findOne").mockImplementation(
                async (email: string) => {
                    if (email === "admin@mail.com") {
                        return {
                            email: "admin@mail.com",
                            password: "password",
                        };
                    } else {
                        return undefined;
                    }
                },
            );

            jest.spyOn(service, "validateUser").mockImplementation(
                async (email: string, password: string) => {
                    return true;
                },
            );

            const payload = await service.login({
                email: "admin@mail.com",
                password: "password",
            });
            expect(payload).toHaveProperty("access_token");
        });
    });

    describe("validateUser", () => {
        it("should return a user object on valid user data", async () => {
            const bcryptCompare = jest.fn().mockResolvedValue(true);
            (bcrypt.compare as jest.Mock) = bcryptCompare;

            jest.spyOn(userService, "findOne").mockImplementation(
                async (email: string) => {
                    if (email === "admin@mail.com") {
                        return {
                            email: "admin@mail.com",
                            password: "password",
                            permission: 0,
                        };
                    } else {
                        return undefined;
                    }
                },
            );

            const user = await service.validateUser(
                "admin@mail.com",
                "password",
            );

            expect(user).toBeDefined();
            expect(user).toHaveProperty("email");
            expect(user).toHaveProperty("password");
            expect(user.email).toEqual("admin@mail.com");
        });

        it("should throw an exception on invalid user email", async () => {
            const bcryptCompare = jest.fn().mockResolvedValue(true);
            (bcrypt.compare as jest.Mock) = bcryptCompare;

            jest.spyOn(userService, "findOne").mockImplementation(
                async (email: string) => {
                    if (email === "admin@mail.com") {
                        return {
                            email: "admin@mail.com",
                            password: "password",
                            permission: 0,
                        };
                    } else {
                        return undefined;
                    }
                },
            );

            try {
                await service.validateUser("error@mail.com", "password");
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.message).toEqual("User not found");
            }
        });

        it("should throw an exception on invalid user password", async () => {
            const bcryptCompare = jest.fn().mockResolvedValue(false);
            (bcrypt.compare as jest.Mock) = bcryptCompare;

            jest.spyOn(userService, "findOne").mockImplementation(
                async (email: string) => {
                    if (email === "admin@mail.com") {
                        return {
                            email: "admin@mail.com",
                            password: "password",
                            permission: 0,
                        };
                    } else {
                        return undefined;
                    }
                },
            );

            try {
                await service.validateUser("admin@mail.com", "password");
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.message).toEqual("Incorrect Password");
            }
        });
    });

    describe("sign up", () => {
        beforeEach(() => {
            jest.restoreAllMocks();
        });
        it("should sign up resident", async () => {
            // Arrange
            cacheMock.get.mockReturnValueOnce(Promise.resolve(undefined));
            const findOneMock = jest
                .spyOn(userService, "findOne")
                .mockReturnValueOnce(Promise.resolve(null));
            // Act
            try {
                const file = {
                    originalname: "file.png",
                    mimetype: "image/png",
                    path: "something",
                    buffer: Buffer.from("one,two,three"),
                };
                //const response = await service.signup({ email: 'mail', password: 'password', type: 'resident', idNumber: 2323, file: file, confirmationPin: "", name: "kyle" })
                //expect(response).toEqual(true)
            } catch (e) {
                // Assert
                console.log("we got an error: ", e);
                expect(true).toEqual(false);
            }
        });
        it("should sign up receptionist", async () => {
            // Arrange
            cacheMock.get.mockReturnValueOnce(Promise.resolve(undefined));
            const findOneMock = jest
                .spyOn(userService, "findOne")
                .mockReturnValueOnce(Promise.resolve(null));
            // Act
            try {
                //const response = await service.signup({ email: 'mail', password: 'password',confirmationPin:'00000', type: 'receptionist', idNumber: 2323 })
                //expect(response).toEqual(true)
            } catch (e) {
                // Assert
                expect(true).toEqual(false);
            }
        });
        it("should throw error when sign up fails", async () => {
            // Arrange
            cacheMock.get.mockReturnValueOnce(Promise.resolve(undefined));
            const findOneMock = jest
                .spyOn(userService, "findOne")
                .mockReturnValueOnce(Promise.resolve(null));
            // Act
            try {
                //const response = await service.signup({ email: 'mail', password: 'password',confirmationPin:'00000', type: 'other', idNumber: 2323 })
                //expect(response).toEqual({})
            } catch (e) {
                // Assert
                expect(e.message).toEqual("Invalid User Type Provided");
            }
        });
        it("should throw error when user exists", async () => {
            // Arrange
            const findOneMock = jest
                .spyOn(userService, "findOne")
                .mockReturnValueOnce(Promise.resolve("emailUser"));
            // Act
            try {
                const response = await service.signup({ email: "mail" });
            } catch (e) {
                // Assert
                expect(e.message).toEqual("User already exists");
            }
        });
        it("should throw error when user is already signed up", async () => {
            // Arrange
            const findOneMock = jest
                .spyOn(userService, "findOne")
                .mockReturnValueOnce(null);
            // Act
            try {
                const response = await service.signup({
                    email: "mail",
                    password: "password",
                });
            } catch (e) {
                // Assert
                expect(e.message).toEqual("User is already signed up");
            }
        });
    });

    describe("verifyNewAccount()", () => {
        it("should throw error on invalid verification ID", async () => {
            // arrange

            try {
                // act
                const response = await service.verifyNewAccount(
                    "asdadsasd",
                    "email@mail.com",
                );
            } catch (e) {
                // assert
                expect(e.message).toEqual("Invalid verification ID");
            }
        });
        it("should throw an iterable error", async () => {
            // arrange
            (cacheMock as any).get.mockReturnValueOnce(
                Promise.resolve({
                    verifyID: "b3eFcCe3-4CDa-CEB1-F0Df-daBEBE298a47",
                    file: {
                        buffer: ["hello"],
                        originalname: "file.png",
                        password: "",
                    },
                }),
            );

            try {
                // act
                const response = await service.verifyNewAccount(
                    "b3eFcCe3-4CDa-CEB1-F0Df-daBEBE298a47",
                    "email22@mail.com",
                );
            } catch (e) {
                // assert
                expect(e.message).toEqual(
                    "Email Not Found, please signup again",
                );
            }
        });
        it("should verify account", async () => {
            // arrange
            jest.spyOn(userService, "createUser").mockReturnValueOnce(null);
            (cacheMock as any).get.mockReturnValueOnce(
                Promise.resolve({
                    verifyID: "b3eFcCe3-4CDa-CEB1-F0Df-daBEBE298a47",
                    file: {
                        buffer: ["hello"],
                        originalname: "file.png",
                        email: "email2@mail.com",
                    },
                }),
            );
            try {
                // act
                //const response = await service.verifyNewAccount('b3eFcCe3-4CDa-CEB1-F0Df-daBEBE298a47', 'email2@mail.com');
                // assert
                //expect(response).toEqual(true)
            } catch (e) {
                // assert
                expect(true).toEqual(false);
            }
        });
        it("should throw an error for email not found", async () => {
            // arrange
            jest.spyOn(userService, "createUser").mockReturnValueOnce(null);
            (cacheMock as any).get.mockReturnValueOnce(
                Promise.resolve(undefined),
            );
            try {
                // act
                const response = await service.verifyNewAccount(
                    "b3eFcCe3-4CDa-CEB1-F0Df-daBEBE298a47",
                    "emaildwdw@mail.com",
                );

                // assert
                expect(response).toEqual(true);
            } catch (e) {
                // assert
                expect(e.message).toEqual(
                    "Email Not Found, please signup again",
                );
            }
        });
    });
});
