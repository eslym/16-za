<script lang="ts">
	import { json, local } from '@eslym/svelte-utility-stores';
	import Numbers from '$lib/Numbers.svelte';

	let { data } = $props();

	let allocate: Record<string, number> = $state({});
	let trade: Record<string, number> = $state({});

	const points = json(local('16za-points'), 0);
	const skills = json<string[]>(local('16za-skills'), []);

	let spent = $derived(Object.values(allocate).reduce((a, b) => a + b, 0));
	let remain = $derived($points - spent);

	$effect(() => $skills && reset());

	function reset() {
		trade = Object.fromEntries(Object.keys(data.costs).map((key) => [key, 0]));
		allocate = Object.fromEntries(Object.keys(data.actions).map((key) => [key, 0]));
	}

	function subtotal(item: string) {
		return trade[item] * data.costs[item];
	}

	function sum(a: number, b: number) {
		return a + b;
	}

	function calculateSummary(trades: Record<string, number>) {
		const deferring: [string, number][] = [];
		const items = Object.fromEntries(
			Object.entries(trades).filter(([i, v]) => {
				if (v === 0) return false;
				if (data.deferred[i]) {
					deferring.push([i, v]);
					return false;
				}
				return true;
			})
		);
		const deferred: Record<string, number> = {};

		for (const [i, v] of deferring) {
			for (const match of data.deferred[i]) {
				const hit = Object.entries(match.checks).every(([skill, condition]) => {
					const has = $skills.includes(skill);
					return has === condition;
				});
				if (!hit) continue;
				for (const [item, count] of Object.entries(match.result)) {
					deferred[item] = (deferred[item] || 0) + count * v;
				}
			}
		}

		const lines = [];

		if (Object.keys(items).length) {
			const temp = [];
			temp.push('當前回合：');
			for (const [item, count] of Object.entries(items)) {
				temp.push(`- ${item} +${count}`);
			}
			lines.push(temp.join('\n'));
		}

		if (Object.keys(deferred).length) {
			const temp = [];
			temp.push('下回合：');
			for (const [item, count] of Object.entries(deferred)) {
				temp.push(`- ${item} +${count}`);
			}
			lines.push(temp.join('\n'));
		}

		if (!lines.length) {
			lines.push('無任何兌換');
		}

		return lines.join('\n\n');
	}

	reset();
</script>

<h1 class="text-2xl font-bold">一六的喪尸末日資源兌換計算器</h1>
<fieldset class="mt-12">
	<legend>技能</legend>
	<div class="flex flex-wrap gap-x-2 gap-y-1">
		{#each data.skills as skill}
			{@const checked = $skills.includes(skill)}
			<label
				class="btn selection:transition-all"
				class:opacity-60={!checked}
				class:btn-solid-success={checked}
			>
				<input type="checkbox" class="hidden" bind:group={$skills} value={skill} />
				{skill}
			</label>
		{/each}
	</div>
</fieldset>
<div class="form-group mt-4 grid grid-cols-2">
	<div class="form-field">
		<label for="input-points" class="form-label">兌換點數（行動點數）</label>
		<Numbers id="input-points" class="max-w-xs font-mono" min={0} max={100} bind:value={$points} />
	</div>
	<div class="form-field">
		<span class="form-label">剩餘點數</span>
		<code
			class="input input-solid flex max-w-xs items-center font-mono"
			class:input-solid-warning={remain > 0}
		>
			{remain}
		</code>
	</div>
</div>
<div class="mt-6">
	<label for="modal-summary" class="btn btn-primary mr-2 w-40">導出概要</label>
	<button class="btn btn-outline-error w-40" onclick={reset}>重置點數分配</button>
</div>

<input class="modal-state" id="modal-summary" type="checkbox" />
<div class="modal">
	<label class="modal-overlay" for="modal-summary"></label>
	<div class="modal-content flex min-w-[300px] flex-col gap-5">
		<label for="modal-summary" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
			>✕</label
		>
		<h2 class="text-xl">兌換概要</h2>
		<pre class="whitespace-pre-wrap text-wrap">{calculateSummary(trade)}</pre>
	</div>
</div>

{#each Object.keys(data.actions) as cat}
	{@const category = data.actions[cat]}
	{@const bonus = Object.entries(category.bonus)
		.filter(([b]) => $skills.includes(b))
		.map(([_, v]) => v)
		.reduce(sum, 0)}
	{@const spendable = allocate[cat] * (1 + bonus)}
	{@const spent = Object.keys(trade)
		.filter((i) => category.items[i])
		.map(subtotal)
		.reduce(sum, 0)}
	{@const remain = spendable - spent}
	{@const rest = Object.keys(allocate)
		.filter((c) => c !== cat)
		.map((c) => allocate[c])
		.reduce(sum, 0)}
	{@const max = $points - rest}
	{@const min = Math.ceil(spent / (1 + bonus))}
	<fieldset class="mt-4">
		<legend>{cat}</legend>
		{#if category.description}
			<p class="mx-2 text-content3">{category.description}</p>
		{/if}
		<div class="form-group mt-2 grid grid-cols-3 max-sm:grid-cols-1">
			<div class="form-field">
				<label for="input-points" class="form-label">分配點數</label>
				<Numbers
					id="input-points"
					class="max-w-xs font-mono"
					{min}
					{max}
					bind:value={allocate[cat]}
				/>
			</div>
			<div class="form-field" class:opacity-35={!allocate[cat]}>
				<span class="form-label">可用點數</span>
				<code class="input input-solid flex max-w-xs items-center font-mono">
					{spendable}
				</code>
			</div>
			<div class="form-field" class:opacity-35={!allocate[cat]}>
				<span class="form-label">剩餘點數</span>
				<code
					class="input input-solid flex max-w-xs items-center font-mono"
					class:input-solid-warning={remain > 0}
				>
					{remain}
				</code>
			</div>
		</div>
		<div class="mt-2 flex flex-row flex-wrap items-center gap-2">
			{#each Object.entries(category.bonus) as [skill, bonus]}
				<span
					class="badge transition-all"
					class:badge-flat-success={$skills.includes(skill)}
					style:opacity={$skills.includes(skill) ? '1' : '0.5'}
				>
					{skill} +{bonus}
				</span>
			{/each}
		</div>
		<div class="transition-opacity" class:opacity-35={!allocate[cat]}>
			<div class="divider text-content3">兌換資源</div>
			<div
				class="grid grid-cols-[2fr_1fr_3fr_1fr] gap-x-2 gap-y-1 px-2 max-sm:grid-cols-[1fr_1fr_3fr_1fr]"
			>
				<div class="mb-1 text-sm font-bold text-content1">資源</div>
				<div class="mb-1 text-center text-sm font-bold text-content1">單位成本</div>
				<div class="mb-1 text-center text-sm font-bold text-content1">數量</div>
				<div class="mb-1 text-right text-sm font-bold text-content1">消耗點數</div>
				{#each Object.entries(category.items) as [item, cost]}
					{@const rest = Object.keys(category.items)
						.filter((i) => i !== item)
						.map(subtotal)
						.reduce(sum, 0)}
					{@const max = Math.floor((spendable - rest) / cost)}
					<div class="flex items-center">{item}</div>
					<div class="flex items-center justify-center">{cost}</div>
					<div>
						<Numbers class="font-mono" min={0} {max} bind:value={trade[item]} inline={false} />
					</div>
					<div class="flex items-center justify-end">
						{trade[item] * cost}
					</div>
				{/each}
			</div>
		</div>
	</fieldset>
{/each}

<style lang="postcss">
	fieldset {
		@apply rounded border border-content3 p-2.5;
	}
	legend {
		@apply px-0.5 text-sm font-semibold text-content2;
	}
</style>
