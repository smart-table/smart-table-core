import {proxyListener} from 'smart-table-events';
import {TOGGLE_SORT} from '../events';

const sortListeners = proxyListener({[TOGGLE_SORT]: 'onSortToggle'});
const directions = ['asc', 'desc'];

export default function ({pointer, table, cycle = false}) {
	const cycleDirections = cycle === true ? ['none'].concat(directions) : [...directions].reverse();
	let hit = 0;

	const directive = Object.assign({
		toggle() {
			hit++;
			const direction = cycleDirections[hit % cycleDirections.length];
			return table.sort({pointer, direction});
		},
		state() {
			return table.getTableState().sort;
		}
	}, sortListeners({emitter: table}));

	directive.onSortToggle(({pointer: p}) => {
		if (pointer !== p) {
			hit = 0;
		}
	});

	return directive;
}
