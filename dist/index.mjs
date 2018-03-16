import { curry, tap, compose } from 'smart-table-operators';
import pointer from 'smart-table-json-pointer';
import { emitter, proxyListener } from 'smart-table-events';
import sort from 'smart-table-sort';
import filter from 'smart-table-filter';
import search from 'smart-table-search';

var sliceFactory = ({page = 1, size} = {}) => (array = []) => {
	const actualSize = size || array.length;
	const offset = (page - 1) * actualSize;
	return array.slice(offset, offset + actualSize);
}

const TOGGLE_SORT = 'TOGGLE_SORT';
const DISPLAY_CHANGED = 'DISPLAY_CHANGED';
const PAGE_CHANGED = 'CHANGE_PAGE';
const EXEC_CHANGED = 'EXEC_CHANGED';
const FILTER_CHANGED = 'FILTER_CHANGED';
const SUMMARY_CHANGED = 'SUMMARY_CHANGED';
const SEARCH_CHANGED = 'SEARCH_CHANGED';
const EXEC_ERROR = 'EXEC_ERROR';

function curriedPointer(path) {
	const {get, set} = pointer(path);
	return {get, set: curry(set)};
}

function table ({sortFactory, tableState, data, filterFactory, searchFactory}) {
	const table = emitter();
	const sortPointer = curriedPointer('sort');
	const slicePointer = curriedPointer('slice');
	const filterPointer = curriedPointer('filter');
	const searchPointer = curriedPointer('search');

	const safeAssign = curry((base, extension) => Object.assign({}, base, extension));
	const dispatch = curry(table.dispatch, 2);

	const dispatchSummary = filtered => dispatch(SUMMARY_CHANGED, {
		page: tableState.slice.page,
		size: tableState.slice.size,
		filteredCount: filtered.length
	});

	const exec = ({processingDelay = 20} = {}) => {
		table.dispatch(EXEC_CHANGED, {working: true});
		setTimeout(() => {
			try {
				const filterFunc = filterFactory(filterPointer.get(tableState));
				const searchFunc = searchFactory(searchPointer.get(tableState));
				const sortFunc = sortFactory(sortPointer.get(tableState));
				const sliceFunc = sliceFactory(slicePointer.get(tableState));
				const execFunc = compose(filterFunc, searchFunc, tap(dispatchSummary), sortFunc, sliceFunc);
				const displayed = execFunc(data);
				table.dispatch(DISPLAY_CHANGED, displayed.map(d => {
					return {index: data.indexOf(d), value: d};
				}));
			} catch (err) {
				table.dispatch(EXEC_ERROR, err);
			} finally {
				table.dispatch(EXEC_CHANGED, {working: false});
			}
		}, processingDelay);
	};

	const updateTableState = curry((pter, ev, newPartialState) => compose(
		safeAssign(pter.get(tableState)),
		tap(dispatch(ev)),
		pter.set(tableState)
	)(newPartialState));

	const resetToFirstPage = () => updateTableState(slicePointer, PAGE_CHANGED, {page: 1});

	const tableOperation = (pter, ev) => compose(
		updateTableState(pter, ev),
		resetToFirstPage,
		() => table.exec() // We wrap within a function so table.exec can be overwritten (when using with a server for example)
	);

	const api = {
		sort: tableOperation(sortPointer, TOGGLE_SORT),
		filter: tableOperation(filterPointer, FILTER_CHANGED),
		search: tableOperation(searchPointer, SEARCH_CHANGED),
		slice: compose(updateTableState(slicePointer, PAGE_CHANGED), () => table.exec()),
		exec,
		eval(state = tableState) {
			return Promise
				.resolve()
				.then(() => {
					const sortFunc = sortFactory(sortPointer.get(state));
					const searchFunc = searchFactory(searchPointer.get(state));
					const filterFunc = filterFactory(filterPointer.get(state));
					const sliceFunc = sliceFactory(slicePointer.get(state));
					const execFunc = compose(filterFunc, searchFunc, sortFunc, sliceFunc);
					return execFunc(data).map(d => ({index: data.indexOf(d), value: d}));
				});
		},
		onDisplayChange(fn) {
			table.on(DISPLAY_CHANGED, fn);
		},
		getTableState() {
			const sort$$1 = Object.assign({}, tableState.sort);
			const search$$1 = Object.assign({}, tableState.search);
			const slice = Object.assign({}, tableState.slice);
			const filter$$1 = {};
			for (const prop of Object.getOwnPropertyNames(tableState.filter)) {
				filter$$1[prop] = tableState.filter[prop].map(v => Object.assign({}, v));
			}
			return {sort: sort$$1, search: search$$1, slice, filter: filter$$1};
		}
	};

	const instance = Object.assign(table, api);

	Object.defineProperty(instance, 'length', {
		get() {
			return data.length;
		}
	});

	return instance;
}

function tableDirective ({
													 sortFactory = sort,
													 filterFactory = filter,
													 searchFactory = search,
													 tableState = {sort: {}, slice: {page: 1}, filter: {}, search: {}},
													 data = []
												 }, ...tableDirectives) {

	const coreTable = table({sortFactory, filterFactory, tableState, data, searchFactory});

	return tableDirectives.reduce((accumulator, newdir) => Object.assign(accumulator, newdir({
			sortFactory,
			filterFactory,
			searchFactory,
			tableState,
			data,
			table: coreTable
		}))
		, coreTable);
}

const filterListener = proxyListener({[FILTER_CHANGED]: 'onFilterChange'});

var filterDirective = ({table, pointer: pointer$$1, operator = 'includes', type = 'string'}) => Object.assign({
	filter(input) {
		const filterConf = {
			[pointer$$1]: [
				{
					value: input,
					operator,
					type
				}
			]

		};
		return table.filter(filterConf);
	},
	state() {
		return table.getTableState().filter;
	}
}, filterListener({emitter: table}));

const searchListener = proxyListener({[SEARCH_CHANGED]: 'onSearchChange'});

var searchDirective = ({table, scope = []}) => Object.assign(searchListener({emitter: table}), {
	search(input) {
		return table.search({value: input, scope});
	},
	state() {
		return table.getTableState().search;
	}
});

const sliceListener = proxyListener({[PAGE_CHANGED]: 'onPageChange', [SUMMARY_CHANGED]: 'onSummaryChange'});

function sliceDirective ({table}) {
	let {slice: {page: currentPage, size: currentSize}} = table.getTableState();
	let itemListLength = table.length;

	const api = {
		selectPage(p) {
			return table.slice({page: p, size: currentSize});
		},
		selectNextPage() {
			return api.selectPage(currentPage + 1);
		},
		selectPreviousPage() {
			return api.selectPage(currentPage - 1);
		},
		changePageSize(size) {
			return table.slice({page: 1, size});
		},
		isPreviousPageEnabled() {
			return currentPage > 1;
		},
		isNextPageEnabled() {
			return Math.ceil(itemListLength / currentSize) > currentPage;
		},
		state() {
			return Object.assign(table.getTableState().slice, {filteredCount: itemListLength});
		}
	};
	const directive = Object.assign(api, sliceListener({emitter: table}));

	directive.onSummaryChange(({page: p, size: s, filteredCount}) => {
		currentPage = p;
		currentSize = s;
		itemListLength = filteredCount;
	});

	return directive;
}

const sortListeners = proxyListener({[TOGGLE_SORT]: 'onSortToggle'});
const directions = ['asc', 'desc'];

function sortDirective ({pointer: pointer$$1, table, cycle = false}) {
	const cycleDirections = cycle === true ? ['none'].concat(directions) : [...directions].reverse();
	let hit = 0;

	const directive = Object.assign({
		toggle() {
			hit++;
			const direction = cycleDirections[hit % cycleDirections.length];
			return table.sort({pointer: pointer$$1, direction});
		},
		state() {
			return table.getTableState().sort;
		}
	}, sortListeners({emitter: table}));

	directive.onSortToggle(({pointer: p}) => {
		if (pointer$$1 !== p) {
			hit = 0;
		}
	});

	return directive;
}

const summaryListener = proxyListener({[SUMMARY_CHANGED]: 'onSummaryChange'});

var summaryDirective = ({table}) => summaryListener({emitter: table});

const executionListener = proxyListener({[EXEC_CHANGED]: 'onExecutionChange'});

var workingIndicatorDirective = ({table}) => executionListener({emitter: table});

const search$1 = searchDirective;
const slice = sliceDirective;
const summary = summaryDirective;
const sort$1 = sortDirective;
const filter$1 = filterDirective;
const workingIndicator = workingIndicatorDirective;
const table$1 = tableDirective;

export { search$1 as search, slice, summary, sort$1 as sort, filter$1 as filter, workingIndicator, table$1 as table };
