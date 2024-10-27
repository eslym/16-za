<script lang="ts">
	import '../app.css';
	import '@fontsource/noto-sans-tc/100.css';
	import '@fontsource/noto-sans-tc/200.css';
	import '@fontsource/noto-sans-tc/300.css';
	import '@fontsource/noto-sans-tc/400.css';
	import '@fontsource/noto-sans-tc/500.css';
	import '@fontsource/noto-sans-tc/600.css';
	import '@fontsource/noto-sans-tc/700.css';
	import '@fontsource/noto-sans-tc/800.css';
	import '@fontsource/noto-sans-tc/900.css';

	import '@fontsource/noto-sans-mono/100.css';
	import '@fontsource/noto-sans-mono/200.css';
	import '@fontsource/noto-sans-mono/300.css';
	import '@fontsource/noto-sans-mono/400.css';
	import '@fontsource/noto-sans-mono/500.css';
	import '@fontsource/noto-sans-mono/600.css';
	import '@fontsource/noto-sans-mono/700.css';
	import '@fontsource/noto-sans-mono/800.css';
	import '@fontsource/noto-sans-mono/900.css';

	let { children } = $props();
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
	{@render children()}
</div>
