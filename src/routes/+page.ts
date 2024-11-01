import { parse } from 'yaml';

const dataSrc =
	'https://gist.githubusercontent.com/eslym/de87a4c5eb665d3b26c4776b9211276b/raw/resources.yaml';

type TextNumRecord = Record<string, number>;

type Action = {
	description?: string;
	items: TextNumRecord;
	bonus: TextNumRecord;
	requirements?: string[];
};

type Deffered = { checks: Record<string, boolean>; result: TextNumRecord }[];

type Resources = {
	actions: Record<string, Action>;
	deferred: Record<string, Deffered>;
};

export async function load({ fetch }) {
	const res = await fetch(dataSrc);
	const data = await res.text();
	const resources = parse(data) as Resources;

	const skills = [
		...new Set(
			Object.values(resources.actions)
				.map((a) => Object.keys(a.bonus))
				.flat()
		)
	];

	const costs = Object.fromEntries(
		Object.values(resources.actions)
			.map((a) => Object.entries(a.items))
			.flat()
	);

	const equipments = new Set(
		Object.values(resources.actions)
			.map((a) => a.requirements ?? [])
			.flat()
	);

	return {
		...resources,
		skills,
		costs,
		equipments
	};
}
