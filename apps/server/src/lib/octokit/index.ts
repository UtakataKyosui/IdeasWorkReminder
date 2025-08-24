import { Octokit } from "@octokit/rest";
import { env } from "cloudflare:workers";

const octokit = new Octokit({
	auth: env.GITHUB_TOKEN
})

/**
 * ユーザーのリポジトリを取得
 * @returns リポジトリのデータ
 */
async function getRepos() {
	const {data} = await octokit.rest.repos.listForAuthenticatedUser({
		per_page: 100,
		sort: "updated",
		direction: "desc",
		affiliation: "owner"
	})
	return data
}

/**
 * リポジトリのIssueを取得
 * @param repo リポジトリ名
 * @returns Issueのデータ
 */
async function getIssues(repo: string) {
	const {data} = await octokit.rest.issues.listForRepo({
		owner: env.GITHUB_OWNER,
		repo,
		state: "open",
	})
	return data
}

/**
 * 開いているIssueの数と総Issue数から進捗率を計算し、まだ終わってないIssueのデータと一緒に返す
 * @param repo リポジトリ名
 * @returns 進捗率とまだ終わってないIssueのリポジトリ名とIssue名とIssue番号、本文の冒頭100文字
 */
async function getProgress(repo: string) {
	const issues = await getIssues(repo)

	if (issues.length === 0) {
		return null; // Issueがないので除外
	  }

	const openIssues = issues.filter((issue) => issue.state === "open")
	const progress = openIssues.length / issues.length
	return {
		progress,
		openIssues: openIssues.map((issue) => ({
			repo,
			issue: issue.title,
			issue_number: issue.number,
			body: issue.body?.slice(0, 100) ?? "",
		})),
	}
}

export { getRepos,getProgress }