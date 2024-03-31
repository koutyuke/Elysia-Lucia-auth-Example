import { genAuthUrl } from "@/src/libs/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { Elysia, t } from "elysia";
import { logger } from "../../plugins/logger";

const provider = new Elysia().use(logger).get(
	"/:provider",
	async ({ params: { provider }, cookie: { oauth_state, oauth_code_verifier, oauth_next }, set, query: { next } }) => {
		const state = generateState();
		const codeVerifier = generateCodeVerifier();

		const redirectUrl = await genAuthUrl(provider, state, codeVerifier);

		oauth_state.set({
			value: state,
			path: "/",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			sameSite: "lax",
			maxAge: 60 * 10,
		});

		oauth_code_verifier.set({
			value: codeVerifier,
			path: "/",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			sameSite: "lax",
			maxAge: 60 * 10,
		});

		oauth_next.set({
			value: next ?? "/",
			path: "/",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			sameSite: "lax",
			maxAge: 60 * 10,
		});

		set.redirect = redirectUrl.toString();
	},
	{
		cookie: t.Cookie({
			oauth_state: t.String(),
			oauth_code_verifier: t.String(),
			oauth_next: t.Optional(t.String()),
		}),
		query: t.Object({
			next: t.Optional(t.String()),
		}),
		params: t.Object({
			provider: t.Union([t.Literal("discord"), t.Literal("google"), t.Literal("line")]),
		}),
	},
);

export { provider };