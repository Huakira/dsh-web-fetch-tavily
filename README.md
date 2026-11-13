# dsh-web-fetch-tavily

> 个人自用插件，代码和文档由 AI 参与编写，不承诺维护。使用前请先备份 DSH 配置。

安装：`dsh plugin --profile web add @huakira/web-fetch-tavily`

Tavily Extract as the `web_fetch` provider for the DeepSeek Harness web seam (`ctx.web`), with a custom endpoint (e.g. a self-hosted TavilyProxyManager).

- Settings: Plugins > Tavily web fetch. Endpoint (`baseURL`) and API key (stored in the credential store under `TAVILY_API_KEY`).
- Pins `web.fetchProvider: tavily` and enables `tool-web` fetch via the bundle patch.
- Other options: `extractDepth`, `format`, `timeoutSeconds`, `maxBodyChars`. All apply at runtime.

MIT
