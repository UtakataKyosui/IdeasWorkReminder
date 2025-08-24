import { Octokit } from "@octokit/rest";
import { env } from "cloudflare:workers";

const octokit = new Octokit({
	auth: env.GITHUB_TOKEN
})