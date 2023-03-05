import { z } from "zod";

/**
 * Specify your server-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars.
 */
const server = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  KEYAUTH_NAME: z.string(),
  KEYAUTH_OWNERID: z.string(),
  KEYAUTH_SELLERKEY: z.string(),
});

/**
 * Specify your client-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars. To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
const client = z.object({
  NEXT_PUBLIC_DISCORD_SITE_NAME: z.string(),
  NEXT_PUBLIC_DISCORD_DESCRIPTION: z.string(),
  NEXT_PUBLIC_DISCORD_IMAGE: z.string(),
  NEXT_PUBLIC_DISCORD_TITLE: z.string(),

  NEXT_PUBLIC_WEBSITE_TITLE: z.string(),
  NEXT_PUBLIC_WEBSITE_TITLE_APPEND_DASH: z.string(),

  NEXT_PUBLIC_BACKGROUND_COLOR: z.string(),
  NEXT_PUBLIC_TEXT_COLOR: z.string(),
  NEXT_PUBLIC_ACCENT_COLOR: z.string(),
  NEXT_PUBLIC_ACCENT2_COLOR: z.string(),
});

/**
 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
 * middlewares) or client-side so we need to destruct manually.
 *
 * @type {Record<keyof z.infer<typeof server> | keyof z.infer<typeof client>, string | undefined>}
 */
const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  KEYAUTH_NAME: process.env.KEYAUTH_NAME,
  KEYAUTH_OWNERID: process.env.KEYAUTH_OWNERID,
  KEYAUTH_SELLERKEY: process.env.KEYAUTH_SELLERKEY,
  NEXT_PUBLIC_DISCORD_SITE_NAME: process.env.NEXT_PUBLIC_DISCORD_SITE_NAME,
  NEXT_PUBLIC_DISCORD_DESCRIPTION: process.env.NEXT_PUBLIC_DISCORD_DESCRIPTION,
  NEXT_PUBLIC_DISCORD_IMAGE: process.env.NEXT_PUBLIC_DISCORD_IMAGE,
  NEXT_PUBLIC_DISCORD_TITLE: process.env.NEXT_PUBLIC_DISCORD_TITLE,
  NEXT_PUBLIC_WEBSITE_TITLE: process.env.NEXT_PUBLIC_WEBSITE_TITLE,
  NEXT_PUBLIC_WEBSITE_TITLE_APPEND_DASH: process.env.NEXT_PUBLIC_WEBSITE_TITLE_APPEND_DASH,
  NEXT_PUBLIC_BACKGROUND_COLOR: process.env.NEXT_PUBLIC_BACKGROUND_COLOR,
  NEXT_PUBLIC_TEXT_COLOR: process.env.NEXT_PUBLIC_TEXT_COLOR,
  NEXT_PUBLIC_ACCENT_COLOR: process.env.NEXT_PUBLIC_ACCENT_COLOR,
  NEXT_PUBLIC_ACCENT2_COLOR: process.env.NEXT_PUBLIC_ACCENT2_COLOR,
};

// Don't touch the part below
// --------------------------

const merged = server.merge(client);

/** @typedef {z.input<typeof merged>} MergedInput */
/** @typedef {z.infer<typeof merged>} MergedOutput */
/** @typedef {z.SafeParseReturnType<MergedInput, MergedOutput>} MergedSafeParseReturn */

let env = /** @type {MergedOutput} */ (process.env);

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const isServer = typeof window === "undefined";

  const parsed = /** @type {MergedSafeParseReturn} */ (
    isServer
      ? merged.safeParse(processEnv) // on server we can validate all env vars
      : client.safeParse(processEnv) // on client we can only validate the ones that are exposed
  );

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }

  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !prop.startsWith("NEXT_PUBLIC_"))
        throw new Error(
          process.env.NODE_ENV === "production"
            ? "❌ Attempted to access a server-side environment variable on the client"
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`,
        );
      return target[/** @type {keyof typeof target} */ (prop)];
    },
  });
}

export { env };