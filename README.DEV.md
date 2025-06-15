# Developer Readme

# -

## About

* This document will,
	* show developers how to,
		* build
		* contribute
* Additionally, there will be transient section detailing a devlog
* ! This note heavily uses my own domain syntax language (in hopes it may aid conciseness/transcription-velocity); to some, the content may resemble a post-massacre of murdered Emojis.

# =

* ! This Repo is developed on a Mac, there are no concerns or plans to accommodate other Operating Systems.

## On Developing

* @ Prerequisites
	* Live Development
		* 🥅 Development is best when results are tested immediately on a live vault.
		* Developers should find a way to populate process.env.OBSIDIAN_TEST_VAULT
		* ⚙️🧰 Suggested Toolset
			* Auto env (to set process.env)
				* <https://www.zsh.org/> Shell Framework
				* <https://ohmyz.sh/> Plugins Manager
				* <https://github.com/zpm-zsh/autoenv?tab=readme-ov-file#using-oh-my-zsh> Plugin itself
			* pnpm (npm replacement)
				* 🔗 `package.json` -> packageManager property
			* corepack (manages pnpm)
			* nvm (manages node version)
				* 🔗 `.nvmrc`
	* @ New Dev Workflow
		* `pnpm install`
		* `pnpm dev`
			* runs xlint which fixes any eslint mistakes automatically
			* then builds a `manifest.json, styles.css, and main.js` to the plugin folder of your vault.
		* 💁 If you've set up your OBSIDIAN_TEST_VAULT environment right, it should be in `[ENV]/.obsidian/plugins/dev-daily-notes-editor`
	* @ Build Workflow
		* ...TBC
		* `pnpm build` (builds to dist folder)
	* @ Test Workflow
		* ...TBC
		* `pnpm test`
			* ⚠️ Unit Tests are getting effed by eslint currently

# ---Transient

* ## Upon Rollphidian
	* 📉 Many of the Rollup event hooks are parallel.
		* 🔗 <https://github.com/rollup/rollup/blob/5dcce11eba2f78d3beb9684abf67e8b0a8e78a3a/src/rollup/types.d.ts#L527>
		* In practice, most of the Build events are parallel, even CloseBundle
  
	# ---Transient Local REsources

## LR--typedef--of Rollup Plugin Hooks,nb.-Rollup

```ts
	export type SequentialPluginHooks =
	| 'augmentChunkHash'
	| 'generateBundle'
	| 'onLog'
	| 'options'
	| 'outputOptions'
	| 'renderChunk'
	| 'transform';
```
