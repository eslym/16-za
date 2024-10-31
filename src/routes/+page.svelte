<script lang="ts">
	import { json, local } from '@eslym/svelte-utility-stores';
	import NumberInput from '$lib/NumberInput.svelte';
	import { tick } from 'svelte';

	let { data } = $props();

	let allocate: Record<string, number> = $state({});
	let trade: Record<string, number> = $state({});

	const points = json(local('16za-points'), 0);
	const equipments = json<string[]>(local('16za-equipments'), []);

	let skills = $state<string[]>([]);

	let spent = $derived(Object.values(allocate).reduce((a, b) => a + b, 0));
	let canMoreSkill = $derived(skills.length < 3);
	let remain = $derived($points - spent);
	let catStates = $derived(Object.fromEntries(Object.keys(data.actions).map(calculateState)));
	let errors = $derived(
		Object.fromEntries(Object.keys(data.actions).map((cat) => [cat, catStates[cat].remain < 0]))
	);

	let catContainers = $state<Record<string, HTMLElement>>({});

	$effect(() => {
		for (const [cat, category] of Object.entries(data.actions)) {
			if (
				category.requirements?.length &&
				!category.requirements.every((req) => $equipments.includes(req))
			) {
				allocate[cat] = 0;
			}
		}
	});

	function reset() {
		skills = [];
		trade = Object.fromEntries(Object.keys(data.costs).map((key) => [key, 0]));
		allocate = Object.fromEntries(Object.keys(data.actions).map((key) => [key, 0]));
	}

	function subtotal(item: string) {
		return trade[item] * data.costs[item];
	}

	function sum(a: number, b: number) {
		return a + b;
	}

	function calculateState(cat: string) {
		const bonus = Object.entries(data.actions[cat].bonus)
			.filter(([b]) => skills.includes(b))
			.map(([_, v]) => v)
			.reduce(sum, 0);
		const spendable = allocate[cat] * (1 + bonus);
		const spent = Object.keys(trade)
			.filter((i) => data.actions[cat].items[i])
			.map(subtotal)
			.reduce(sum, 0);
		const remain = spendable - spent;
		const eligible = (data.actions[cat].requirements ?? []).every((e) => $equipments.includes(e));
		return [cat, { spendable, remain, eligible }] as const;
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
					const has = skills.includes(skill);
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

<div class="sticky top-0 z-10 mt-4 border-b border-b-content3 bg-backgroundPrimary py-3">
	<div class="form-group grid grid-cols-[1fr_1fr_auto] max-sm:grid-cols-2">
		<div class="form-field">
			<label for="input-points" class="form-label">兌換點數（行動點數）</label>
			<NumberInput id="input-points" class="max-w-xs font-mono" min={0} bind:value={$points} />
		</div>
		<div class="form-field">
			<span class="form-label">剩餘點數</span>
			<code
				class="input input-solid flex max-w-xs items-center font-mono"
				class:input-solid-warning={remain > 0}
				class:input-solid-error={remain < 0}
			>
				{remain}
			</code>
		</div>

		<div class="flex flex-col gap-2 max-sm:col-span-2 max-sm:flex-row">
			<label
				for="modal-summary"
				class="btn btn-primary mr-2 w-40"
				class:disabled={remain < 0 || Object.values(errors).some((v) => v)}
			>
				導出概要
			</label>
			<button class="btn btn-outline-error w-40" onclick={reset}>重置</button>
		</div>
	</div>
	<div class="mt-5 flex flex-row flex-wrap justify-evenly gap-x-2.5 gap-y-1">
		{#each Object.keys(data.actions) as cat}
			<button
				class="btn btn-sm relative"
				onclick={() => catContainers[cat].scrollIntoView({ behavior: 'smooth', block: 'center' })}
			>
				{cat}
				{#if catStates[cat].remain !== 0}
					<div
						class="badge badge-sm absolute -right-2 -top-2 shadow-sm"
						class:badge-flat-error={catStates[cat].remain < 0}
						class:badge-flat-warning={catStates[cat].remain > 0}
					>
						{catStates[cat].remain}
					</div>
				{/if}
			</button>
		{/each}
	</div>
</div>

<fieldset class="mt-4">
	<legend>使用技能</legend>
	<div class="flex flex-wrap gap-x-2 gap-y-1">
		{#each data.skills as skill}
			{@const checked = skills.includes(skill)}
			{@const disabled = !checked && !canMoreSkill}
			<label
				class="btn selection:transition-all"
				class:opacity-60={!checked && canMoreSkill}
				class:btn-solid-success={checked}
				class:opacity-35={disabled}
				class:!scale-100={disabled}
				class:cursor-default={disabled}
			>
				<input
					id="skill-{skill}"
					type="checkbox"
					class="hidden"
					bind:group={skills}
					value={skill}
					disabled={!checked && !canMoreSkill}
				/>
				{skill}
			</label>
		{/each}
	</div>
</fieldset>
<fieldset class="mt-4">
	<legend>擁有設備</legend>
	<div class="flex flex-wrap gap-x-2 gap-y-1">
		{#each data.equipments as equipment}
			{@const checked = $equipments.includes(equipment)}
			<label
				class="btn selection:transition-all"
				class:opacity-60={!checked}
				class:btn-solid-success={checked}
			>
				<input type="checkbox" class="hidden" bind:group={$equipments} value={equipment} />
				{equipment}
			</label>
		{/each}
	</div>
</fieldset>

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
	{@const { spendable, remain, eligible } = catStates[cat]}
	<fieldset class="mt-4">
		<legend bind:this={catContainers[cat]}>{cat}</legend>
		{#if category.requirements?.length}
			<p class="mx-2 mt-2 first:mt-0">
				需要：
				{#each category.requirements as req}
					{@const has = $equipments.includes(req)}
					<label
						class="badge cursor-pointer"
						class:badge-flat-success={has}
						class:badge-flat-warning={!has}
					>
						<input type="checkbox" class="hidden" bind:group={$equipments} value={req} />
						{req}
					</label>
				{/each}
			</p>
		{/if}
		{#if category.description}
			<p class="mx-2 mt-2 text-content3 first:mt-0">{category.description}</p>
		{/if}
		<div class="form-group mt-2 grid grid-cols-3 max-sm:grid-cols-1">
			<div class="form-field">
				<label for="input-points" class="form-label">分配點數</label>
				<NumberInput
					id="input-points"
					class="max-w-xs font-mono"
					min={0}
					bind:value={allocate[cat]}
					disabled={!eligible}
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
					class:input-solid-error={errors[cat]}
				>
					{remain}
				</code>
			</div>
		</div>
		<div class="mt-2 flex flex-row flex-wrap items-center gap-2">
			{#each Object.entries(category.bonus) as [skill, bonus]}
				<label
					for="skill-{skill}"
					class="btn btn-sm"
					class:btn-solid-success={skills.includes(skill)}
					class:disabled={!skills.includes(skill) && !canMoreSkill}
				>
					{skill} +{bonus}
				</label>
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
					<div class="flex items-center">{item}</div>
					<div class="flex items-center justify-center">{cost}</div>
					<div class="flex items-center">
						<NumberInput
							class="w-full font-mono"
							min={0}
							bind:value={trade[item]}
							inline={false}
							disabled={!allocate[cat]}
						/>
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

	.btn.disabled {
		@apply pointer-events-none opacity-50;
	}
</style>
