
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const NVM_INC: string;
	export const COREPACK_ROOT: string;
	export const rvm_use_flag: string;
	export const TERM_PROGRAM: string;
	export const rvm_bin_path: string;
	export const NODE: string;
	export const PYENV_ROOT: string;
	export const _P9K_TTY: string;
	export const GEM_HOME: string;
	export const NVM_CD_FLAGS: string;
	export const rvm_quiet_flag: string;
	export const INIT_CWD: string;
	export const SHELL: string;
	export const rvm_gemstone_url: string;
	export const TERM: string;
	export const OBSIDIAN_TEST_VAULT: string;
	export const TMPDIR: string;
	export const IRBRC: string;
	export const HOMEBREW_REPOSITORY: string;
	export const rvm_docs_type: string;
	export const CONDA_SHLVL: string;
	export const TERM_PROGRAM_VERSION: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const MallocNanoZone: string;
	export const rvm_hook: string;
	export const TERM_SESSION_ID: string;
	export const MY_RUBY_HOME: string;
	export const npm_config_git_tag_version: string;
	export const JENV_FORCEJAVAHOME: string;
	export const npm_config_registry: string;
	export const PYENV_VERSION: string;
	export const PNPM_HOME: string;
	export const ZSH: string;
	export const NVM_DIR: string;
	export const USER: string;
	export const rvm_gemstone_package_file: string;
	export const COMMAND_MODE: string;
	export const CONDA_EXE: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const rvm_path: string;
	export const SSH_AUTH_SOCK: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const rvm_proxy: string;
	export const PYENV_VIRTUALENV_INIT: string;
	export const npm_execpath: string;
	export const PAGER: string;
	export const rvm_ruby_file: string;
	export const VIRTUAL_ENV: string;
	export const PYENV_VIRTUAL_ENV: string;
	export const LSCOLORS: string;
	export const _CE_CONDA: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_config_verify_deps_before_run: string;
	export const rvm_silent_flag: string;
	export const rvm_prefix: string;
	export const rvm_ruby_make: string;
	export const PATH: string;
	export const LaunchInstanceID: string;
	export const npm_config_engine_strict: string;
	export const npm_package_json: string;
	export const COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
	export const __CFBundleIdentifier: string;
	export const JENV_LOADED: string;
	export const PWD: string;
	export const npm_command: string;
	export const JAVA_HOME: string;
	export const P9K_SSH: string;
	export const npm_config__jsr_registry: string;
	export const npm_lifecycle_event: string;
	export const P9K_TTY: string;
	export const rvm_sdk: string;
	export const LANG: string;
	export const npm_package_name: string;
	export const NODE_PATH: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const XPC_FLAGS: string;
	export const _OLD_VIRTUAL_PS1: string;
	export const JENV_FORCEJDKHOME: string;
	export const npm_config__mariomui_registry: string;
	export const npm_config_node_gyp: string;
	export const XPC_SERVICE_NAME: string;
	export const _CE_M: string;
	export const npm_package_version: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const rvm_version: string;
	export const JDK_HOME: string;
	export const HOME: string;
	export const SHLVL: string;
	export const PYENV_SHELL: string;
	export const rvm_script_name: string;
	export const rvm_pretty_print_flag: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const rvm_ruby_mode: string;
	export const HOMEBREW_PREFIX: string;
	export const LESS: string;
	export const LOGNAME: string;
	export const CONDA_PYTHON_EXE: string;
	export const rvm_alias_expanded: string;
	export const JENV_SHELL: string;
	export const npm_lifecycle_script: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const GEM_PATH: string;
	export const NVM_BIN: string;
	export const rvm_nightly_flag: string;
	export const npm_config_user_agent: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const GIT_ASKPASS: string;
	export const HOMEBREW_CELLAR: string;
	export const rvm_ruby_make_install: string;
	export const INFOPATH: string;
	export const _P9K_SSH_TTY: string;
	export const rvm_niceness: string;
	export const rvm_ruby_bits: string;
	export const rvm_bin_flag: string;
	export const RUBY_VERSION: string;
	export const SECURITYSESSIONID: string;
	export const PYENV_ACTIVATE_SHELL: string;
	export const rvm_only_path_flag: string;
	export const COLORTERM: string;
	export const npm_node_execpath: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		NVM_INC: string;
		COREPACK_ROOT: string;
		rvm_use_flag: string;
		TERM_PROGRAM: string;
		rvm_bin_path: string;
		NODE: string;
		PYENV_ROOT: string;
		_P9K_TTY: string;
		GEM_HOME: string;
		NVM_CD_FLAGS: string;
		rvm_quiet_flag: string;
		INIT_CWD: string;
		SHELL: string;
		rvm_gemstone_url: string;
		TERM: string;
		OBSIDIAN_TEST_VAULT: string;
		TMPDIR: string;
		IRBRC: string;
		HOMEBREW_REPOSITORY: string;
		rvm_docs_type: string;
		CONDA_SHLVL: string;
		TERM_PROGRAM_VERSION: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		MallocNanoZone: string;
		rvm_hook: string;
		TERM_SESSION_ID: string;
		MY_RUBY_HOME: string;
		npm_config_git_tag_version: string;
		JENV_FORCEJAVAHOME: string;
		npm_config_registry: string;
		PYENV_VERSION: string;
		PNPM_HOME: string;
		ZSH: string;
		NVM_DIR: string;
		USER: string;
		rvm_gemstone_package_file: string;
		COMMAND_MODE: string;
		CONDA_EXE: string;
		PNPM_SCRIPT_SRC_DIR: string;
		rvm_path: string;
		SSH_AUTH_SOCK: string;
		__CF_USER_TEXT_ENCODING: string;
		rvm_proxy: string;
		PYENV_VIRTUALENV_INIT: string;
		npm_execpath: string;
		PAGER: string;
		rvm_ruby_file: string;
		VIRTUAL_ENV: string;
		PYENV_VIRTUAL_ENV: string;
		LSCOLORS: string;
		_CE_CONDA: string;
		npm_config_frozen_lockfile: string;
		npm_config_verify_deps_before_run: string;
		rvm_silent_flag: string;
		rvm_prefix: string;
		rvm_ruby_make: string;
		PATH: string;
		LaunchInstanceID: string;
		npm_config_engine_strict: string;
		npm_package_json: string;
		COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
		__CFBundleIdentifier: string;
		JENV_LOADED: string;
		PWD: string;
		npm_command: string;
		JAVA_HOME: string;
		P9K_SSH: string;
		npm_config__jsr_registry: string;
		npm_lifecycle_event: string;
		P9K_TTY: string;
		rvm_sdk: string;
		LANG: string;
		npm_package_name: string;
		NODE_PATH: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		XPC_FLAGS: string;
		_OLD_VIRTUAL_PS1: string;
		JENV_FORCEJDKHOME: string;
		npm_config__mariomui_registry: string;
		npm_config_node_gyp: string;
		XPC_SERVICE_NAME: string;
		_CE_M: string;
		npm_package_version: string;
		pnpm_config_verify_deps_before_run: string;
		rvm_version: string;
		JDK_HOME: string;
		HOME: string;
		SHLVL: string;
		PYENV_SHELL: string;
		rvm_script_name: string;
		rvm_pretty_print_flag: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		rvm_ruby_mode: string;
		HOMEBREW_PREFIX: string;
		LESS: string;
		LOGNAME: string;
		CONDA_PYTHON_EXE: string;
		rvm_alias_expanded: string;
		JENV_SHELL: string;
		npm_lifecycle_script: string;
		VSCODE_GIT_IPC_HANDLE: string;
		GEM_PATH: string;
		NVM_BIN: string;
		rvm_nightly_flag: string;
		npm_config_user_agent: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		GIT_ASKPASS: string;
		HOMEBREW_CELLAR: string;
		rvm_ruby_make_install: string;
		INFOPATH: string;
		_P9K_SSH_TTY: string;
		rvm_niceness: string;
		rvm_ruby_bits: string;
		rvm_bin_flag: string;
		RUBY_VERSION: string;
		SECURITYSESSIONID: string;
		PYENV_ACTIVATE_SHELL: string;
		rvm_only_path_flag: string;
		COLORTERM: string;
		npm_node_execpath: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
