<script lang="ts">
	import { Add01Icon, Remove01Icon } from 'hugeicons-svelte';

	let {
		id = undefined,
		min = undefined,
		max = undefined,
		value = $bindable(0),
		inline = true,
		disabled = false,
		class: klass = ''
	}: {
		id?: string;
		min?: number;
		max?: number;
		value: number;
		inline?: boolean;
		disabled?: boolean;
		class?: string;
	} = $props();

	let minReached = $derived(min !== undefined && value <= min);
	let maxReached = $derived(max !== undefined && value >= max);

	$effect(() => {
		if (typeof min !== 'undefined' && value < min) value = min;
		if (typeof max !== 'undefined' && value > max) value = max;
	});
</script>

<div class="flex-row items-center gap-1 {klass}" class:flex={!inline} class:inline-flex={inline}>
	<button
		class="btn w-10 items-center px-0"
		onclick={() => value--}
		disabled={disabled || minReached}
	>
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
		{disabled}
	/>
	<button
		class="btn w-10 items-center px-0"
		onclick={() => value++}
		disabled={disabled || maxReached}
	>
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
