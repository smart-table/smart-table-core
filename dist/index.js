'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var smartTableOperators = require('smart-table-operators');
var pointer = _interopDefault(require('smart-table-json-pointer'));
var smartTableEvents = require('smart-table-events');
var smartTableSort = require('smart-table-sort');
var smartTableFilter = require('smart-table-filter');
var smartTableSearch = require('smart-table-search');

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

const curriedPointer = path => {
	const {get, set} = pointer(path);
	return {get, set: smartTableOperators.curry(set)};
};

var table = ({sortFactory, tableState, data, filterFactory, searchFactory}) => {
	let filteredCount = data.length;
	let matchingItems = data;
	const table = smartTableEvents.emitter();
	const sortPointer = curriedPointer('sort');
	const slicePointer = curriedPointer('slice');
	const filterPointer = curriedPointer('filter');
	const searchPointer = curriedPointer('search');

	// We need to register in case the summary comes from outside (like server data)
	table.on(SUMMARY_CHANGED, ({filteredCount: count}) => {
		filteredCount = count;
	});

	const safeAssign = smartTableOperators.curry((base, extension) => Object.assign({}, base, extension));
	const dispatch = smartTableOperators.curry(table.dispatch, 2);

	const dispatchSummary = filtered => {
		matchingItems = filtered;
		return dispatch(SUMMARY_CHANGED, {
			page: tableState.slice.page,
			size: tableState.slice.size,
			filteredCount: filtered.length
		});
	};

	const exec = ({processingDelay = 20} = {}) => {
		table.dispatch(EXEC_CHANGED, {working: true});
		setTimeout(() => {
			try {
				const filterFunc = filterFactory(filterPointer.get(tableState));
				const searchFunc = searchFactory(searchPointer.get(tableState));
				const sortFunc = sortFactory(sortPointer.get(tableState));
				const sliceFunc = sliceFactory(slicePointer.get(tableState));
				const execFunc = smartTableOperators.compose(filterFunc, searchFunc, smartTableOperators.tap(dispatchSummary), sortFunc, sliceFunc);
				const displayed = execFunc(data);
				table.dispatch(DISPLAY_CHANGED, displayed.map(d => ({index: data.indexOf(d), value: d})));
			} catch (err) {
				table.dispatch(EXEC_ERROR, err);
			} finally {
				table.dispatch(EXEC_CHANGED, {working: false});
			}
		}, processingDelay);
	};

	const updateTableState = smartTableOperators.curry((pter, ev, newPartialState) => smartTableOperators.compose(
		safeAssign(pter.get(tableState)),
		smartTableOperators.tap(dispatch(ev)),
		pter.set(tableState)
	)(newPartialState));

	const resetToFirstPage = () => updateTableState(slicePointer, PAGE_CHANGED, {page: 1});

	const tableOperation = (pter, ev) => smartTableOperators.compose(
		updateTableState(pter, ev),
		resetToFirstPage,
		() => table.exec() // We wrap within a function so table.exec can be overwritten (when using with a server for example)
	);

	const api = {
		sort: tableOperation(sortPointer, TOGGLE_SORT),
		filter: tableOperation(filterPointer, FILTER_CHANGED),
		search: tableOperation(searchPointer, SEARCH_CHANGED),
		slice: smartTableOperators.compose(updateTableState(slicePointer, PAGE_CHANGED), () => table.exec()),
		exec,
		async eval(state = tableState) {
			const sortFunc = sortFactory(sortPointer.get(state));
			const searchFunc = searchFactory(searchPointer.get(state));
			const filterFunc = filterFactory(filterPointer.get(state));
			const sliceFunc = sliceFactory(slicePointer.get(state));
			const execFunc = smartTableOperators.compose(filterFunc, searchFunc, sortFunc, sliceFunc);
			return execFunc(data).map(d => ({index: data.indexOf(d), value: d}));
		},
		onDisplayChange(fn) {
			table.on(DISPLAY_CHANGED, fn);
		},
		getTableState() {
			const sort = Object.assign({}, tableState.sort);
			const search = Object.assign({}, tableState.search);
			const slice = Object.assign({}, tableState.slice);
			const filter = {};
			for (const prop of Object.getOwnPropertyNames(tableState.filter)) {
				filter[prop] = tableState.filter[prop].map(v => Object.assign({}, v));
			}
			return {sort, search, slice, filter};
		},
		getMatchingItems() {
			return [...matchingItems];
		}
	};

	const instance = Object.assign(table, api);

	Object.defineProperties(instance, {
		filteredCount: {
			get() {
				return filteredCount;
			}
		},
		length: {
			get() {
				return data.length;
			}
		}
	});

	return instance;
};

function tableDirective ({
													 sortFactory = smartTableSort.defaultSortFactory,
													 filterFactory = smartTableFilter.filter,
													 searchFactory = smartTableSearch.regexp,
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

const filterListener = smartTableEvents.proxyListener({[FILTER_CHANGED]: 'onFilterChange'});

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

const searchListener = smartTableEvents.proxyListener({[SEARCH_CHANGED]: 'onSearchChange'});

var searchDirective = ({table, scope = []}) => Object.assign(searchListener({emitter: table}), {
	search(input, opts = {}) {
		return table.search(Object.assign({}, {value: input, scope}, opts));
	},
	state() {
		return table.getTableState().search;
	}
});

const sliceListener = smartTableEvents.proxyListener({[PAGE_CHANGED]: 'onPageChange', [SUMMARY_CHANGED]: 'onSummaryChange'});

function sliceDirective ({table}) {
	let {slice: {page: currentPage, size: currentSize}} = table.getTableState();
	let itemListLength = table.filteredCount;

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

const debounce = (fn, time) => {
	let timer = null;
	return (...args) => {
		if (timer !== null) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => fn(...args), time);
	};
};

const sortListeners = smartTableEvents.proxyListener({[TOGGLE_SORT]: 'onSortToggle'});
const directions = ['asc', 'desc'];

function sortDirective ({pointer: pointer$$1, table, cycle = false, debounceTime = 0}) {
	const cycleDirections = cycle === true ? ['none'].concat(directions) : [...directions].reverse();
	const commit = debounce(table.sort, debounceTime);
	let hit = 0;

	const directive = Object.assign({
		toggle() {
			hit++;
			const direction = cycleDirections[hit % cycleDirections.length];
			return commit({pointer: pointer$$1, direction});
		},
		state() {
			return table.getTableState().sort;
		}
	}, sortListeners({emitter: table}));

	directive.onSortToggle(({pointer: p}) => {
		hit = pointer$$1 !== p ? 0 : hit;
	});

	const {pointer: statePointer, direction = 'asc'} = directive.state();
	hit = statePointer === pointer$$1 ? (direction === 'asc' ? 1 : 2) : 0;
	return directive;
}

const summaryListener = smartTableEvents.proxyListener({[SUMMARY_CHANGED]: 'onSummaryChange'});

var summaryDirective = ({table}) => summaryListener({emitter: table});

const executionListener = smartTableEvents.proxyListener({[EXEC_CHANGED]: 'onExecutionChange'});

var workingIndicatorDirective = ({table}) => executionListener({emitter: table});

const search = searchDirective;
const slice = sliceDirective;
const summary = summaryDirective;
const sort = sortDirective;
const filter = filterDirective;
const workingIndicator = workingIndicatorDirective;
const table$1 = tableDirective;

exports.search = search;
exports.slice = slice;
exports.summary = summary;
exports.sort = sort;
exports.filter = filter;
exports.workingIndicator = workingIndicator;
exports.table = table$1;
