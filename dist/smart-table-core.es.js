const swap = f => (a, b) => f(b, a);

const compose = (first, ...fns) => (...args) => fns.reduce((previous, current) => current(previous), first(...args));

const curry = (fn, arityLeft) => {
	const arity = arityLeft || fn.length;
	return (...args) => {
		const argLength = args.length || 1;
		if (arity === argLength) {
			return fn(...args);
		}
		const func = (...moreArgs) => fn(...args, ...moreArgs);
		return curry(func, arity - args.length);
	};
};

const tap = fn => arg => {
	fn(arg);
	return arg;
};

function pointer(path) {
	const parts = path.split('.');

	function partial(obj = {}, parts = []) {
		const p = parts.shift();
		const current = obj[p];
		return (current === undefined || parts.length === 0) ?
			current : partial(current, parts);
	}

	function set(target, newTree) {
		let current = target;
		const [leaf, ...intermediate] = parts.reverse();
		for (const key of intermediate.reverse()) {
			if (current[key] === undefined) {
				current[key] = {};
				current = current[key];
			}
		}
		current[leaf] = Object.assign(current[leaf] || {}, newTree);
		return target;
	}

	return {
		get(target) {
			return partial(target, [...parts]);
		},
		set
	};
}

function sortByProperty(prop) {
	const propGetter = pointer(prop).get;
	return (a, b) => {
		const aVal = propGetter(a);
		const bVal = propGetter(b);

		if (aVal === bVal) {
			return 0;
		}

		if (bVal === undefined) {
			return -1;
		}

		if (aVal === undefined) {
			return 1;
		}

		return aVal < bVal ? -1 : 1;
	};
}

function sortFactory({pointer: pointer$$1, direction} = {}) {
	if (!pointer$$1 || direction === 'none') {
		return array => [...array];
	}

	const orderFunc = sortByProperty(pointer$$1);
	const compareFunc = direction === 'desc' ? swap(orderFunc) : orderFunc;

	return array => [...array].sort(compareFunc);
}

function typeExpression(type) {
	switch (type) {
		case 'boolean':
			return Boolean;
		case 'number':
			return Number;
		case 'date':
			return val => new Date(val);
		default:
			return compose(String, val => val.toLowerCase());
	}
}

const not = fn => input => !fn(input);

const is = value => input => Object.is(value, input);
const lt = value => input => input < value;
const gt = value => input => input > value;
const equals = value => input => value === input;
const includes = value => input => input.includes(value);

const operators = {
	includes,
	is,
	isNot: compose(is, not),
	lt,
	gte: compose(lt, not),
	gt,
	lte: compose(gt, not),
	equals,
	notEquals: compose(equals, not)
};

const every = fns => (...args) => fns.every(fn => fn(...args));

function predicate({value = '', operator = 'includes', type = 'string'}) {
	const typeIt = typeExpression(type);
	const operateOnTyped = compose(typeIt, operators[operator]);
	const predicateFunc = operateOnTyped(value);
	return compose(typeIt, predicateFunc);
}

// Avoid useless filter lookup (improve perf)
function normalizeClauses(conf) {
	const output = {};
	const validPath = Object.keys(conf).filter(path => Array.isArray(conf[path]));
	validPath.forEach(path => {
		const validClauses = conf[path].filter(c => c.value !== '');
		if (validClauses.length > 0) {
			output[path] = validClauses;
		}
	});
	return output;
}

function filter(filter) {
	const normalizedClauses = normalizeClauses(filter);
	const funcList = Object.keys(normalizedClauses).map(path => {
		const getter = pointer(path).get;
		const clauses = normalizedClauses[path].map(predicate);
		return compose(getter, every(clauses));
	});
	const filterPredicate = every(funcList);

	return array => array.filter(filterPredicate);
}

function search (searchConf = {}) {
	const {value, scope = []} = searchConf;
	const searchPointers = scope.map(field => pointer(field).get);
	if (scope.length === 0 || !value) {
		return array => array;
	}
	return array => array.filter(item => searchPointers.some(p => String(p(item)).includes(String(value))));
}

function emitter() {
	const listenersLists = {};
	const instance = {
		on(event, ...listeners) {
			listenersLists[event] = (listenersLists[event] || []).concat(listeners);
			return instance;
		},
		dispatch(event, ...args) {
			const listeners = listenersLists[event] || [];
			for (const listener of listeners) {
				listener(...args);
			}
			return instance;
		},
		off(event, ...listeners) {
			if (event === undefined) {
				Object.keys(listenersLists).forEach(ev => instance.off(ev));
			} else {
				const list = listenersLists[event] || [];
				listenersLists[event] = listeners.length ? list.filter(listener => !listeners.includes(listener)) : [];
			}
			return instance;
		}
	};
	return instance;
}

const proxyListener = eventMap => ({emitter}) => {
	const proxy = {};
	const eventListeners = {};

	for (const ev of Object.keys(eventMap)) {
		const method = eventMap[ev];
		eventListeners[ev] = [];
		proxy[method] = function (...listeners) {
			eventListeners[ev] = eventListeners[ev].concat(listeners);
			emitter.on(ev, ...listeners);
			return proxy;
		};
	}

	return Object.assign(proxy, {
		off(ev) {
			if (!ev) {
				Object.keys(eventListeners).forEach(eventName => proxy.off(eventName));
			}
			if (eventListeners[ev]) {
				emitter.off(ev, ...eventListeners[ev]);
			}
			return proxy;
		}
	});
};

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
	return {get, set: curry(set)};
};

var table = ({sortFactory, tableState, data, filterFactory, searchFactory}) => {
	let filteredCount = data.length;
	const table = emitter();
	const sortPointer = curriedPointer('sort');
	const slicePointer = curriedPointer('slice');
	const filterPointer = curriedPointer('filter');
	const searchPointer = curriedPointer('search');

	table.on(SUMMARY_CHANGED, ({filteredCount: count}) => {
		filteredCount = count;
	});

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
				table.dispatch(DISPLAY_CHANGED, displayed.map(d => ({index: data.indexOf(d), value: d})));
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
		async eval(state = tableState) {
			const sortFunc = sortFactory(sortPointer.get(state));
			const searchFunc = searchFactory(searchPointer.get(state));
			const filterFunc = filterFactory(filterPointer.get(state));
			const sliceFunc = sliceFactory(slicePointer.get(state));
			const execFunc = compose(filterFunc, searchFunc, sortFunc, sliceFunc);
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
													 sortFactory: sortFactory$$1 = sortFactory,
													 filterFactory = filter,
													 searchFactory = search,
													 tableState = {sort: {}, slice: {page: 1}, filter: {}, search: {}},
													 data = []
												 }, ...tableDirectives) {

	const coreTable = table({sortFactory: sortFactory$$1, filterFactory, tableState, data, searchFactory});

	return tableDirectives.reduce((accumulator, newdir) => Object.assign(accumulator, newdir({
			sortFactory: sortFactory$$1,
			filterFactory,
			searchFactory,
			tableState,
			data,
			table: coreTable
		}))
		, coreTable);
}

const filterListener = proxyListener({[FILTER_CHANGED]: 'onFilterChange'});

var filterDirective = ({table, pointer, operator = 'includes', type = 'string'}) => Object.assign({
	filter(input) {
		const filterConf = {
			[pointer]: [
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

const sortListeners = proxyListener({[TOGGLE_SORT]: 'onSortToggle'});
const directions = ['asc', 'desc'];

function sortDirective ({pointer, table, cycle = false}) {
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

const summaryListener = proxyListener({[SUMMARY_CHANGED]: 'onSummaryChange'});

var summaryDirective = ({table}) => summaryListener({emitter: table});

const executionListener = proxyListener({[EXEC_CHANGED]: 'onExecutionChange'});

var workingIndicatorDirective = ({table}) => executionListener({emitter: table});

const search$1 = searchDirective;
const slice = sliceDirective;
const summary = summaryDirective;
const sort = sortDirective;
const filter$1 = filterDirective;
const workingIndicator = workingIndicatorDirective;
const table$1 = tableDirective;

export { search$1 as search, slice, summary, sort, filter$1 as filter, workingIndicator, table$1 as table };
//# sourceMappingURL=smart-table-core.es.js.map
