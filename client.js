window.__ModuleLoader__.load({
	id: "dsh-web-fetch-tavily",
	factory: (require) => {
		const React = require("react");
		const h = React.createElement;
		const NS = "web-fetch-tavily-settings";
		const ENTRY = "web-fetch-tavily";
		const DEFAULT_BASE = "https://api.tavily.com";
		const DEFAULT_REF = "TAVILY_API_KEY";

		const zh = {
			baseURL: "接口地址", baseURLHint: "Tavily 兼容端点根地址，程序追加 /extract。留空恢复默认。",
			apiKey: "API Key", apiKeyHint: "存入凭据库，不写进设置文件。留空表示保持当前密钥。",
			set: "已配置密钥。", unset: "尚未配置密钥，web_fetch 暂不可用。",
			save: "保存", saving: "保存中…", saved: "已保存", failed: "保存失败，请检查后重试",
			unavailable: "插件未加载或设置不可用。", readOnly: "当前部署的设置为只读。", placeholderKey: "粘贴新的 Key",
		};
		const en = {
			baseURL: "Endpoint", baseURLHint: "Tavily-compatible endpoint root; /extract is appended. Blank restores the default.",
			apiKey: "API key", apiKeyHint: "Stored in the credential store, not the settings file. Blank keeps the current key.",
			set: "A key is configured.", unset: "No key configured; web_fetch is unavailable.",
			save: "Save", saving: "Saving…", saved: "Saved", failed: "Save failed; check the values and retry",
			unavailable: "Plugin not loaded or settings unavailable.", readOnly: "Settings are read-only in this deployment.", placeholderKey: "Paste a new key",
		};

		const CSS = `
		.wft-page{max-width:520px;display:grid;gap:14px;padding:4px 0 16px}
		.wft-field{display:grid;gap:5px}
		.wft-label{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
		.wft-input{font:inherit;font-size:13px;padding:8px 10px;border-radius:8px;border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 18%,transparent);background:transparent;color:var(--dsw-alias-label-primary);outline:none}
		.wft-input:focus{border-color:#3aa3ff}
		.wft-hint{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}
		.wft-state{font-size:12px;color:var(--dsw-alias-label-secondary)}
		.wft-row{display:flex;align-items:center;gap:10px}
		.wft-btn{font:inherit;font-size:13px;padding:7px 16px;border-radius:8px;border:none;background:#3aa3ff;color:#fff;cursor:pointer}
		.wft-btn:disabled{opacity:.5;cursor:default}`;

		function useStore(form) {
			return React.useSyncExternalStore(form.subscribe, form.getSnapshot, form.getSnapshot);
		}

		function Page({ ctx, form, locale }) {
			const [lang, setLang] = React.useState(() => { try { return String(locale.getLocale().id).toLowerCase().startsWith("en") ? "en" : "zh"; } catch { return "zh"; } });
			React.useEffect(() => { try { return locale.subscribe(() => setLang(String(locale.getLocale().id).toLowerCase().startsWith("en") ? "en" : "zh")); } catch { return undefined; } }, [locale]);
			const t = (k) => (lang === "en" ? en : zh)[k];
			const snap = useStore(form);
			const ref = (snap.value && snap.value.apiKeyEnv) || DEFAULT_REF;
			const saved = (snap.value && snap.value.baseURL) || "";
			const [base, setBase] = React.useState(null);
			const [key, setKey] = React.useState("");
			const [configured, setConfigured] = React.useState(false);
			const [status, setStatus] = React.useState("");
			const readKey = React.useCallback(async () => {
				const r = await ctx.remote.credentials.describe([ref]);
				if (r.ok) setConfigured(Boolean(r.value[ref] && r.value[ref].configured));
			}, [ref]);
			React.useEffect(() => { readKey(); }, [readKey]);
			React.useEffect(() => ctx.remote.$on("credentials/reference-updated", (r) => { if (r === ref) readKey(); }), [ref, readKey]);
			if (snap.status === "unavailable") return h("div", { className: "wft-hint" }, t("unavailable"));
			const baseShown = base === null ? (saved === DEFAULT_BASE ? "" : saved) : base;
			const dirty = base !== null || key.trim() !== "";
			const save = async () => {
				setStatus(t("saving"));
				try {
					let ok = true;
					if (base !== null) {
						const v = base.trim();
						ok = v === "" ? await form.unset("baseURL") : await form.set("baseURL", v);
					}
					if (ok && key.trim() !== "") { await ctx.remote.credentials.set(ref, key.trim()); await readKey(); }
					if (ok) { setBase(null); setKey(""); setStatus(t("saved")); } else setStatus(t("failed"));
				} catch { setStatus(t("failed")); }
			};
			const off = !snap.writable;
			return h("div", { className: "wft-page" },
				h("div", { className: "wft-field" },
					h("label", { className: "wft-label" }, t("baseURL")),
					h("input", { className: "wft-input", value: baseShown, placeholder: DEFAULT_BASE, disabled: off, onChange: (e) => setBase(e.target.value) }),
					h("div", { className: "wft-hint" }, t("baseURLHint"))),
				h("div", { className: "wft-field" },
					h("label", { className: "wft-label" }, t("apiKey")),
					h("input", { className: "wft-input", type: "password", autoComplete: "off", value: key, placeholder: t("placeholderKey"), onChange: (e) => setKey(e.target.value) }),
					h("div", { className: "wft-state" }, configured ? t("set") : t("unset")),
					h("div", { className: "wft-hint" }, t("apiKeyHint"))),
				off ? h("div", { className: "wft-hint" }, t("readOnly")) : null,
				h("div", { className: "wft-row" },
					h("button", { className: "wft-btn", type: "button", disabled: !dirty || status === t("saving"), onClick: save }, t("save")),
					h("span", { className: "wft-state" }, status)));
		}

		const INJECT = ["slots", "locale", "remote", "remote.credentials", "configForms"];
		function apply(ctx) { ctx.inject(INJECT, mount); }
		function mount(ctx) {
			ctx.effect(() => {
				const tag = document.createElement("style");
				tag.dataset.pluginCss = NS; tag.textContent = CSS; document.head.appendChild(tag);
				return () => tag.remove();
			}, "web-fetch-tavily: stylesheet");
			ctx.effect(() => ctx.locale.register(NS, { zh: {}, en: {} }), "web-fetch-tavily: dictionaries");
			const form = ctx.configForms.get(ENTRY);
			ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register(
				{ name: "plugins.bundle.config", key: "dsh-web-fetch-tavily", locale: NS },
				() => h(Page, { ctx, form, locale: ctx.locale })));
		}
		return { inject: INJECT, apply };
	}
});
