import { Test, TestingModule } from "@nestjs/testing";
import { QueryBus, IQuery, CommandBus } from "@nestjs/cqrs";
import { Model } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";

import { UserService } from "./user.service";
import { User, UserDocument } from "./schema/user.schema";
import { GetUserQuery } from "./queries/impl/getUser.query";
import { GetUnAuthUsersQuery } from "./queries/impl/getUnAuthUsers.query";
import { RewardsService } from "@vms/rewards";
import { RestrictionsService } from "@vms/restrictions";
import { VisitorInviteService } from "@vms/visitor-invite";
import { ConfigService } from "@nestjs/config";
import { MailService } from "@vms/mail";
import { CACHE_MANAGER } from "@nestjs/common";
import { ParkingService } from "@vms/parking";
import { SchedulerRegistry } from "@nestjs/schedule";
import { GetRewardTypesCountQuery } from "@vms/rewards/queries/impl/getRewardTypesCount.query";
import { GetAllBadgesQuery } from "@vms/rewards/queries/impl/getAllBadges.query";

describe("UserService", () => {
    let service: UserService;
    let mockUserModel: Model<UserDocument>;
    const queryBusMock = {
        execute: jest.fn((query: IQuery) => {
            if ( query instanceof GetRewardTypesCountQuery){
                return [
                    {
                    "_id": "invite",
                    "count": 2
                    },
                    {
                    "_id": "sleepover",
                    "count": 2
                    },
                    {
                    "_id": "theme",
                    "count": 1
                    },
                    {
                    "_id": "curfew",
                    "count": 1
                    },
                ]
            } else if (query instanceof GetAllBadgesQuery){
                return [];
            } else if (query instanceof GetUserQuery) {
                return { data: "email" };
            } else if (query instanceof GetUnAuthUsersQuery) {
                if (query.permission === -1) {
                    return [
                        {
                            email: "unauthreceptionist@mail.com",
                            password: "hashed",
                            permission: -1,
                        },
                        {
                            email: "unauthreceptionist@mail.com",
                            password: "hashed",
                            permission: -2,
                        },
                    ];
                } else if (query.permission === -2) {
                    return [
                        {
                            email: "unauthreceptionist@mail.com",
                            password: "hashed",
                            permission: -1,
                        },
                    ];
                }
            }
        })
    }
    const commandBusMock = {
        execute: jest.fn(() => {return {}})
    }

    const scheduleMock = {
        addCronJob: jest.fn(()=>{return {}}),
        deleteCronJob: jest.fn(()=>{return {}}),
      };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [HttpModule],
            providers: [
                {
                    provide: getModelToken(User.name),
                    useValue: Model,
                },
                UserService,
                RewardsService,
                RestrictionsService,
                VisitorInviteService,
                ConfigService,
                ParkingService,
                {
                    provide: CACHE_MANAGER,
                    useValue: {
                        get: () => {return 'any value'},
                        set: () => {return jest.fn()},
                    },
                },
                { provide: SchedulerRegistry, useValue: scheduleMock},
                MailService,
                { provide: QueryBus, useValue: queryBusMock },
                { provide: CommandBus, useValue: commandBusMock }
            ],
        }).compile();

        mockUserModel = module.get<Model<UserDocument>>(
            getModelToken(User.name),
        );

        service = module.get<UserService>(UserService);
    });

    it("should be defined", () => {
        expect(mockUserModel).toBeDefined();
        expect(service).toBeDefined();
    });

    describe("findOne", () => {
        it("should find one", async () => {
            // Act
            const resp = await service.findOne("tab@mail.com");
            // Assert
            expect(resp).toEqual({ data: 'email' });
            expect(queryBusMock.execute).toHaveBeenCalledTimes(1);
        })
    });

    describe("getUnAuthorizedUsers", () => {
        it("should get unauthorized resident and receptionist when user is admin", async () => {
            const userData = await service.getUnAuthorizedUsers(0);

            expect(userData.length).toEqual(2);
        });

        it("should get unauthorized resident when user is receptionist", async () => {
            const userData = await service.getUnAuthorizedUsers(1);
            expect(userData.length).toEqual(1);
        });

    });

    describe('createUser', () => {
        it('should create a user', async () => {
            // Act
            const response = await service.createUser('email', 'password', 0, 'id', 'id', 'name', "", "")

            // Assert
            expect(response).toEqual({})
        })
    })

    describe('searchUser', () => {
        it('should search a user', async () => {
            // Arrange
            queryBusMock.execute.mockReturnValueOnce({ data: 'd' })

            // Act
            const response = await service.searchUser('searchquery')

            // Assert
            expect(response).toEqual({ data: 'd' })
        })
    })

    describe('deleteUserAccount', () => {
        it('should delete a user', async () => {
            // Arrange
            commandBusMock.execute.mockReturnValueOnce({ modifiedCount: 2 })

            // Act
            const response = await service.deleteUserAccount('email')

            // Assert
            expect(response).toBeFalsy()
        })
    })

    describe('authorizeUserAccount', () => {
        it('should authorize a user', async () => {
            // Arrange
            commandBusMock.execute.mockReturnValueOnce({ modifiedCount: 2 })

            // Act
            const response = await service.authorizeUserAccount('email')

            // Assert
            expect(response).toBeTruthy()
        })
    })

    describe('deauthorizeUserAccount', () => {
        it('should deauthorize a user', async () => {
            // Arrange
            commandBusMock.execute.mockReturnValueOnce({ modifiedCount: 2 })

            // Act
            const response = await service.deauthorizeUserAccount('email')

            // Assert
            expect(response).toBeTruthy()
        })
    })

    describe('getUsersByType', () => {
        it('should getUsersByType', async () => {
            // Arrange
            queryBusMock.execute.mockReturnValueOnce({ data: '' })

            // Act
            const response = await service.getUsersByType(1)

            // Assert
            expect(response).toEqual({ data: '' })
        })
    })


});
