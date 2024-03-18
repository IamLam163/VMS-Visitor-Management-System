import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type InviteDocument = Invite & Document;

export enum InviteState {
    signedIn,
    inActive,
    signedOut,
    cancelled,
}

/**
 * Represents an invite for a visitor in the Visitor Management System.
 */
@Schema()
export class Invite {
    /**
     * The email of the user who sent the invite.
     */
    @Prop()
    userEmail: string;

    /**
     * The email of the visitor who received the invite.
     */
    @Prop()
    visitorEmail: string;

    /**
     * The date of the visit.
     */
    @Prop()
    visitDate: Date;

    /**
     * The type of identification document used by the visitor.
     */
    @Prop()
    idDocType: string;

    /**
     * The identification number of the visitor.
     */
    @Prop()
    idNumber: string;

    /**
     * The date when the invite was created.
     */
    @Prop()
    inviteDate: string;

    /**
     * The unique ID of the invite.
     */
    @Prop()
    inviteID: string;

    /**
     * Additional notes or comments about the invite.
     */
    @Prop()
    notes?: string;

    /**
     * The state of the invite (e.g., pending, accepted, declined).
     */
    @Prop()
    inviteState: string;

    /**
     * The name of the visitor.
     */
    @Prop()
    visitorName: string;

    /**
     * The time when the visitor signed out.
     */
    @Prop()
    signOutTime?: string;

    /**
     * The time when the visitor signed in.
     */
    @Prop()
    signInTime?: string;

    /**
     * The time when the invite was created.
     */
    @Prop()
    creationTime: string;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
