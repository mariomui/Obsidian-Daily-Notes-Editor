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

* @ *Prerequisites*
	* Regarding Live Development
		* 🥅 Development is best when results are tested immediately on a live vault.
		* Developers should,
			* populate process.env.OBSIDIAN_TEST_VAULT
			* install PJEBY's OBSIDIAN HOTRELOAD PLUGIN via the Community Plugins Market
		* ⚙️🧰 Suggested Toolset
			* *Set The Envs Automatically*
				* Auto env (to set process.env)
					* <https://www.zsh.org/> Shell Framework
					* <https://ohmyz.sh/> Plugins Manager
					* <https://github.com/zpm-zsh/autoenv?tab=readme-ov-file#using-oh-my-zsh> Plugin itself
			* *Standarize your environment*
				* pnpm is a,
					* (npm replacement)
					* 🔗 `package.json` -> packageManager property
				* corepack (manages pnpm)
				* nvm (manages node version)
					* 🔗 `.nvmrc`
	* @ *Dev Workflow (for first timers)*
		* *core steps*
			* `pnpm install`
			* `pnpm dev`
				* runs xlint which fixes any eslint mistakes automatically
				* then builds a `manifest.json, styles.css, and main.js` to the plugin folder of your vault.
				* 💁 If you've set up your OBSIDIAN_TEST_VAULT environment right, it should be in `[ENV]/.obsidian/plugins/dev-daily-notes-editor`
		* *feature* *toggles*
			* `process.env.SCRIBENING_REL_TEST_FOLDER` <-- when this env variable holds a folder path (relative to your vault path), the plugin will automatically open that folder up in a Scribening after hotreload reloads the vault plugin. (when in development mode)
	* @ *Build Workflow*
		* ...TBC
		* `pnpm build` (builds to dist folder)
	* @ Test Workflow
		* ...TBC
		* `pnpm test`
			* ⚠️ Unit Tests are getting effed by eslint currently

## On Production

## On Other

* @ QOL
	* 📉 Searches may be ofuscated by the typedocs website build.
		* 🔑 Set this in the setting of your vscode setting.json so the code docs dont obfuscate your IDE searches.
			```md
				"search.exclude": {
					"**/node_modules": true,
					"**/bower_components": true,
					"**/*.code-search": true,
					"code-docs/**/*": true
				}
			```
	* 📈 Typedocs
		* `pnpm code-docs`
			* Type to generate a little website of the most updated docs. Use live server to view the index html.
			* ⚠️ Never submit the typedoc build and actual contribution in the same pull request.

# ---Transient

* ## Upon Rollphidian
	* 📉 Many of the Rollup event hooks are parallel.
		* 🔗 <https://github.com/rollup/rollup/blob/5dcce11eba2f78d3beb9684abf67e8b0a8e78a3a/src/rollup/types.d.ts#L527>
		* In practice, most of the Build events are parallel, even CloseBundle
	* 📉 It is tempting to roll out your own log.
		* Learning the convention of trace and log levels gives your logs semantical meaning.
		* Unfortunately, vite lacks adequate HMR, and with no way to rebuild on the fly, there's no good way to switch between log levels.
  
	# ---Transient Local REsources
* ## Arch
	* main.ts invokes
		* SCRIBENING_NOTE_VIEW_TYPE is registered along with the factory function that returns a NOTE_VIEW (*uti this.registerview*)
		* the leaf is created by obsidian. it automatically has the registered view populating inside it, under the class member "view"
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
