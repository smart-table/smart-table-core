import {curry, tap, compose} from 'smart-table-operators';
import pointer from 'smart-table-json-pointer';
import {emitter} from 'smart-table-events';
import sliceFactory from '../slice';
import {
	SUMMARY_CHANGED,
	TOGGLE_SORT,
	DISPLAY_CHANGED,
	PAGE_CHANGED,
	EXEC_CHANGED,
	FILTER_CHANGED,
	SEARCH_CHANGED,
	EXEC_ERROR
} from '../events';

const curriedPointer = path => {
	const {get, set} = pointer(path);
	return {get, set: curry(set)};
};

export default ({sortFactory, tableState, data, filterFactory, searchFactory}) => {
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
