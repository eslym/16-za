<script lang="ts">
	import { Add01Icon, Remove01Icon } from 'hugeicons-svelte';

	let {
		id = undefined,
		min,
		max,
		value = $bindable(0),
		inline = true,
		class: klass = ''
	}: {
		id?: string;
		min: number;
		max: number;
		value: number;
		inline?: boolean;
		class?: string;
	} = $props();

	$effect(() => {
		if (value < min) value = min;
		if (value > max) value = max;
	});
</script>

<div class="flex-row items-center gap-1 {klass}" class:flex={!inline} class:inline-flex={inline}>
	<button class="btn w-10 items-center px-0" onclick={() => value--} disabled={value <= min}>
		<Remove01Icon size={20} />
	</button>
	<input
		class="input input-solid w-0 min-w-0 max-w-full flex-grow"
		{id}
		type="number"
		{min}
		{max}
		step="1"
		bind:value
	/>
	<button class="btn w-10 items-center px-0" onclick={() => value++} disabled={value >= max}>
		<Add01Icon size={20} />
	</button>
</div>

<style lang="postcss">
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
