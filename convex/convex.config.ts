import { defineApp } from "convex/server";
import betterAuth from "./betterAuth/convex.config";
// @ts-expect-error Convex plugin package has no local types in this setup.
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(resend);

export default app;
