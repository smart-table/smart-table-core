import {proxyListener} from 'smart-table-events';
import {TOGGLE_SORT} from '../events';

const debounce = (fn, time) => {
	let timer = null;
	return (...args) => {
		if (timer !== null) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => fn(...args), time);
	};
};

const sortListeners = proxyListener({[TOGGLE_SORT]: 'onSortToggle'});
const directions = ['asc', 'desc'];

export default function ({pointer, table, cycle = false, debounceTime = 0}) {
	const cycleDirections = cycle === true ? ['none'].concat(directions) : [...directions].reverse();
	const commit = debounce(table.sort, debounceTime);
	let hit = 0;

	const directive = Object.assign({
		toggle() {
			hit++;
			const direction = cycleDirections[hit % cycleDirections.length];
			return commit({pointer, direction});
		},
		state() {
			return table.getTableState().sort;
		}
	}, sortListeners({emitter: table}));

	directive.onSortToggle(({pointer: p}) => {
		hit = pointer !== p ? 0 : hit;
	});

	const {pointer: statePointer, direction = 'asc'} = directive.state();
	hit = statePointer === pointer ? (direction === 'asc' ? 1 : 2) : 0;
	return directive;
}
