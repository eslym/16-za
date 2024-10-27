import type { Config } from 'tailwindcss';
import rippleui from 'rippleui';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			fontFamily: {
				mono: ['"Noto Sans Mono"', 'monospace']
			} as any
		}
	},

	plugins: [rippleui]
} as Config;
