import { Hono } from "hono";
import type { RESTPostAPIWebhookWithTokenJSONBody, APIEmbed } from "discord-api-types/v10";
import { getProgress, getRepos } from "./lib/octokit";
 
const app = new Hono<{
	Bindings: Cloudflare.Env
}>();

const scheduled: ExportedHandlerScheduledHandler<Cloudflare.Env> = async(_event,env,_ctx) => {
	try {
		const repos = await getRepos()
		const progresses = await Promise.all(repos.map(async (repo) => {
			const progress = await getProgress(repo.name)
			return {
				repo: repo.name,
				progress,
			}
		}))

		const embeds: Array<APIEmbed> = progresses.map(p => ({
			title: p.repo,
			description: `進捗： ${p.progress.progress}`,
			color: 0x00ff00,
			timestamp: new Date().toISOString()
		}))

		const body: RESTPostAPIWebhookWithTokenJSONBody = {
			username: "Idea Development Supporter",
			content: "リポジトリ進捗報告",
			embeds
		}

		const res = await fetch(env.DISCORD_WEBHOOK_URL,{
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		})

		if(!res.ok) {
			const text = await res.text()
			console.error("Discord WebHook Error: ",res.status,text)
		}

	} catch(err) {
		console.error("Scheduled handler error: ",err)
	}

	
}

export default {
	fetch: app.fetch,
	scheduled,
} satisfies ExportedHandler<Cloudflare.Env>
