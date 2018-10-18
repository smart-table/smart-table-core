'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var smartTableOperators = require('smart-table-operators');
var smartTableJsonPointer = require('smart-table-json-pointer');
var smartTableEvents = require('smart-table-events');
var smartTableFilter = require('smart-table-filter');
var smartTableSort = require('smart-table-sort');
var smartTableSearch = require('smart-table-search');

const sliceFactory = ({ page = 1, size } = { page: 1 }) => (array = []) => {
    const actualSize = size || array.length;
    const offset = (page - 1) * actualSize;
    return array.slice(offset, offset + actualSize);
};

(function (SmartTableEvents) {
    SmartTableEvents["TOGGLE_SORT"] = "TOGGLE_SORT";
    SmartTableEvents["DISPLAY_CHANGED"] = "DISPLAY_CHANGED";
    SmartTableEvents["PAGE_CHANGED"] = "CHANGE_PAGE";
    SmartTableEvents["EXEC_CHANGED"] = "EXEC_CHANGED";
    SmartTableEvents["FILTER_CHANGED"] = "FILTER_CHANGED";
    SmartTableEvents["SUMMARY_CHANGED"] = "SUMMARY_CHANGED";
    SmartTableEvents["SEARCH_CHANGED"] = "SEARCH_CHANGED";
    SmartTableEvents["EXEC_ERROR"] = "EXEC_ERROR";
})(exports.SmartTableEvents || (exports.SmartTableEvents = {}));
const curriedPointer = (path) => {
    const { get, set } = smartTableJsonPointer.pointer(path);
    return { get, set: smartTableOperators.curry(set) };
};
const tableDirective = ({ sortFactory, tableState, data, filterFactory, searchFactory }) => {
    let filteredCount = data.length;
    let matchingItems = data;
    const table = smartTableEvents.emitter();
    const sortPointer = curriedPointer('sort');
    const slicePointer = curriedPointer('slice');
    const filterPointer = curriedPointer('filter');
    const searchPointer = curriedPointer('search');
    // We need to register in case the summary comes from outside (like server data)
    table.on("SUMMARY_CHANGED" /* SUMMARY_CHANGED */, ({ filteredCount: count }) => {
        filteredCount = count;
    });
    const safeAssign = smartTableOperators.curry((base, extension) => Object.assign({}, base, extension));
    const dispatch = smartTableOperators.curry(table.dispatch, 2);
    const dispatchSummary = (filtered) => {
        matchingItems = filtered;
        return dispatch("SUMMARY_CHANGED" /* SUMMARY_CHANGED */, {
            page: tableState.slice.page,
            size: tableState.slice.size,
            filteredCount: filtered.length
        });
    };
    const exec = ({ processingDelay = 20 } = { processingDelay: 20 }) => {
        table.dispatch("EXEC_CHANGED" /* EXEC_CHANGED */, { working: true });
        setTimeout(() => {
            try {
                const filterFunc = filterFactory(filterPointer.get(tableState));
                const searchFunc = searchFactory(searchPointer.get(tableState));
                const sortFunc = sortFactory(sortPointer.get(tableState));
                const sliceFunc = sliceFactory(slicePointer.get(tableState));
                const execFunc = smartTableOperators.compose(filterFunc, searchFunc, smartTableOperators.tap(dispatchSummary), sortFunc, sliceFunc);
                const displayed = execFunc(data);
                table.dispatch("DISPLAY_CHANGED" /* DISPLAY_CHANGED */, displayed.map(d => ({
                    index: data.indexOf(d),
                    value: d
                })));
            }
            catch (err) {
                table.dispatch("EXEC_ERROR" /* EXEC_ERROR */, err);
            }
            finally {
                table.dispatch("EXEC_CHANGED" /* EXEC_CHANGED */, { working: false });
            }
        }, processingDelay);
    };
    const updateTableState = smartTableOperators.curry((pter, ev, newPartialState) => smartTableOperators.compose(safeAssign(pter.get(tableState)), smartTableOperators.tap(dispatch(ev)), pter.set(tableState))(newPartialState));
    const resetToFirstPage = () => updateTableState(slicePointer, "CHANGE_PAGE" /* PAGE_CHANGED */, { page: 1 });
    const tableOperation = (pter, ev) => smartTableOperators.compose(updateTableState(pter, ev), resetToFirstPage, () => table.exec() // We wrap within a function so table.exec can be overwritten (when using with a server for example)
    );
    const api = {
        sort: tableOperation(sortPointer, "TOGGLE_SORT" /* TOGGLE_SORT */),
        filter: tableOperation(filterPointer, "FILTER_CHANGED" /* FILTER_CHANGED */),
        search: tableOperation(searchPointer, "SEARCH_CHANGED" /* SEARCH_CHANGED */),
        slice: smartTableOperators.compose(updateTableState(slicePointer, "CHANGE_PAGE" /* PAGE_CHANGED */), () => table.exec()),
        exec,
        async eval(state = tableState) {
            const sortFunc = sortFactory(sortPointer.get(state));
            const searchFunc = searchFactory(searchPointer.get(state));
            const filterFunc = filterFactory(filterPointer.get(state));
            const sliceFunc = sliceFactory(slicePointer.get(state));
            const execFunc = smartTableOperators.compose(filterFunc, searchFunc, sortFunc, sliceFunc);
            return execFunc(data).map(d => ({ index: data.indexOf(d), value: d }));
        },
        onDisplayChange(fn) {
            table.on("DISPLAY_CHANGED" /* DISPLAY_CHANGED */, fn);
        },
        getTableState() {
            const sort = Object.assign({}, tableState.sort);
            const search = Object.assign({}, tableState.search);
            const slice = Object.assign({}, tableState.slice);
            const filter = {};
            for (const prop of Object.getOwnPropertyNames(tableState.filter)) {
                filter[prop] = tableState.filter[prop].map(v => Object.assign({}, v));
            }
            return { sort, search, slice, filter };
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

const filterListener = smartTableEvents.proxyListener({ ["FILTER_CHANGED" /* FILTER_CHANGED */]: 'onFilterChange' });
(function (FilterType) {
    FilterType["BOOLEAN"] = "boolean";
    FilterType["NUMBER"] = "number";
    FilterType["DATE"] = "date";
    FilterType["STRING"] = "string";
})(exports.FilterType || (exports.FilterType = {}));
const filterDirective = ({ table, pointer, operator = "includes" /* INCLUDES */, type = "string" /* STRING */ }) => {
    const proxy = filterListener({ emitter: table });
    return Object.assign({
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
    }, proxy);
};

const searchListener = smartTableEvents.proxyListener({ ["SEARCH_CHANGED" /* SEARCH_CHANGED */]: 'onSearchChange' });
const searchDirective = ({ table, scope = [] }) => {
    const proxy = searchListener({ emitter: table });
    return Object.assign(proxy, {
        search(input, opts = {}) {
            return table.search(Object.assign({}, { value: input, scope }, opts));
        },
        state() {
            return table.getTableState().search;
        }
    }, proxy);
};

const sliceListener = smartTableEvents.proxyListener({
    ["CHANGE_PAGE" /* PAGE_CHANGED */]: 'onPageChange',
    ["SUMMARY_CHANGED" /* SUMMARY_CHANGED */]: 'onSummaryChange'
});
const paginationDirective = ({ table }) => {
    let { slice: { page: currentPage, size: currentSize } } = table.getTableState();
    let itemListLength = table.filteredCount;
    const proxy = sliceListener({ emitter: table });
    const api = {
        selectPage(p) {
            return table.slice({ page: p, size: currentSize });
        },
        selectNextPage() {
            return api.selectPage(currentPage + 1);
        },
        selectPreviousPage() {
            return api.selectPage(currentPage - 1);
        },
        changePageSize(size) {
            return table.slice({ page: 1, size });
        },
        isPreviousPageEnabled() {
            return currentPage > 1;
        },
        isNextPageEnabled() {
            return Math.ceil(itemListLength / currentSize) > currentPage;
        },
        state() {
            return Object.assign(table.getTableState().slice, { filteredCount: itemListLength });
        }
    };
    const directive = Object.assign(api, proxy);
    directive.onSummaryChange(({ page: p, size: s, filteredCount }) => {
        currentPage = p;
        currentSize = s;
        itemListLength = filteredCount;
    });
    return directive;
};

const debounce = (fn, time) => {
    let timer = null;
    return (...args) => {
        if (timer !== null) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => fn(...args), time);
    };
};
const sortListeners = smartTableEvents.proxyListener({ ["TOGGLE_SORT" /* TOGGLE_SORT */]: 'onSortToggle' });
const directions = ["asc" /* ASC */, "desc" /* DESC */];
const sortDirective = ({ pointer, table, cycle = false, debounceTime = 0 }) => {
    const cycleDirections = cycle === true ? ["none" /* NONE */].concat(directions) : [...directions].reverse();
    const commit = debounce(table.sort, debounceTime);
    let hit = 0;
    const proxy = sortListeners({ emitter: table });
    const directive = Object.assign({
        toggle() {
            hit++;
            const direction = cycleDirections[hit % cycleDirections.length];
            return commit({ pointer, direction });
        },
        state() {
            return table.getTableState().sort;
        }
    }, proxy);
    directive.onSortToggle(({ pointer: p }) => {
        hit = pointer !== p ? 0 : hit;
    });
    const { pointer: statePointer, direction = "asc" /* ASC */ } = directive.state();
    hit = statePointer === pointer ? (direction === "asc" /* ASC */ ? 1 : 2) : 0;
    return directive;
};

const summaryListener = smartTableEvents.proxyListener({ ["SUMMARY_CHANGED" /* SUMMARY_CHANGED */]: 'onSummaryChange' });
const summaryDirective = ({ table }) => summaryListener({ emitter: table });

const executionListener = smartTableEvents.proxyListener({ ["EXEC_CHANGED" /* EXEC_CHANGED */]: 'onExecutionChange' });
const workingIndicatorDirective = ({ table }) => executionListener({ emitter: table });

const defaultTableState = () => ({ sort: {}, slice: { page: 1 }, filter: {}, search: {} });
const smartTable = ({ sortFactory = smartTableSort.defaultSortFactory, filterFactory = smartTableFilter.filter, searchFactory = smartTableSearch.regexp, tableState = defaultTableState(), data = [] } = {
    sortFactory: smartTableSort.defaultSortFactory,
    filterFactory: smartTableFilter.filter,
    searchFactory: smartTableSearch.regexp,
    tableState: defaultTableState(),
    data: []
}, ...tableExtensions) => {
    const coreTable = tableDirective({ sortFactory, filterFactory, tableState, data, searchFactory });
    return tableExtensions.reduce((accumulator, newdir) => Object.assign(accumulator, newdir({
        sortFactory,
        filterFactory,
        searchFactory,
        tableState,
        data,
        table: coreTable
    })), coreTable);
};

exports.FilterOperator = smartTableFilter.FilterOperator;
exports.SortDirection = smartTableSort.SortDirection;
exports.smartTable = smartTable;
exports.filterDirective = filterDirective;
exports.searchDirective = searchDirective;
exports.paginationDirective = paginationDirective;
exports.sortDirective = sortDirective;
exports.summaryDirective = summaryDirective;
exports.tableDirective = tableDirective;
exports.workingIndicatorDirective = workingIndicatorDirective;
