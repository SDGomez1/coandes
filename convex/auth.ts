import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { DataModel } from "./_generated/dataModel";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import authSchema from "./betterAuth/schema";
import { components } from "./_generated/api";
import { Resend } from "resend";
import authConfig from "./auth.config";
import { internalAction, query } from "./_generated/server";

const siteUrl = process.env.SITE_URL!;
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
    verbose: false,
  },
);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({ authConfig }),
      emailOTP({
        disableSignUp: true,
        async sendVerificationOTP({ email, otp, type }, ctx) {
          if (type === "sign-in") {
            const subject = "Your sign-in code";
            const html = `<p>Your code is <b>${otp}</b>. It expires in 10 minutes.</p>`;

            const resend = new Resend(process.env.RESEND_API_KEY);
            const fromEmail = "auth@sdgomez.com";
            const res = await resend.emails.send({
              from: fromEmail,
              to: email,
              subject,
              html,
            });

            if (res.error) {
              throw new Error(`Resend error: ${res.error.message}`);
            }
          } else if (type === "email-verification") {
          } else {
          }
        },
      }),
    ],
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};
export const { getAuthUser } = authComponent.clientApi();

export const rotateKeys = internalAction({
  args: {},
  handler: async (ctx) => {
    const auth = createAuth(ctx);
    return auth.api.getLatestJwks();
  },
});

// Example functions, feel free to edit, omit, etc.

// Get the current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.safeGetAuthUser(ctx);
  },
});
