import { Hono } from "hono";
import type { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";
import { getProgress, getRepos } from "./lib/octokit";
import { error } from "node:console";
 
const app = new Hono<{
	Bindings: Cloudflare.Env
}>();

const scheduled: ExportedHandlerScheduledHandler<Cloudflare.Env> = async(_event,env,_ctx) => {
	const repos = await getRepos()
	const progresses = await Promise.all(repos.map(async (repo) => {
		const progress = await getProgress(repo.name)
		return {
			repo: repo.name,
			progress,
		}
	}))

	const body: RESTPostAPIWebhookWithTokenJSONBody = {
		username: "Idea Development Supporter",
		content: progresses.map(p => `
			${p.repo}: ${p.progress.progress}
			${p.progress.openIssues.map(p => 
				`
				${p.issue}: ${p.body}
				`
			).join("¥n")}
		`).join("¥n")
	}

	await fetch(env.DISCORD_WEBHOOK_URL,{
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body)
	}).catch(error => error(JSON.stringify(error)))
}

export default {
	fetch: app.fetch,
	scheduled,
} satisfies ExportedHandler<Cloudflare.Env>
