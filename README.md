# dsh-web-fetch-tavily

Tavily Extract as the `web_fetch` provider for the DeepSeek Harness web seam (`ctx.web`), with a custom endpoint (e.g. a self-hosted TavilyProxyManager).

- Settings: Plugins > Tavily web fetch. Endpoint (`baseURL`) and API key (stored in the credential store under `TAVILY_API_KEY`).
- Pins `web.fetchProvider: tavily` and enables `tool-web` fetch via the bundle patch.
- Other options: `extractDepth`, `format`, `timeoutSeconds`, `maxBodyChars`. All apply at runtime.

MIT
