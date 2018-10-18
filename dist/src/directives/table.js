import { curry, tap, compose } from 'smart-table-operators';
import { pointer } from 'smart-table-json-pointer';
import { emitter } from 'smart-table-events';
import { sliceFactory } from '../slice';
export var SmartTableEvents;
(function (SmartTableEvents) {
    SmartTableEvents["TOGGLE_SORT"] = "TOGGLE_SORT";
    SmartTableEvents["DISPLAY_CHANGED"] = "DISPLAY_CHANGED";
    SmartTableEvents["PAGE_CHANGED"] = "CHANGE_PAGE";
    SmartTableEvents["EXEC_CHANGED"] = "EXEC_CHANGED";
    SmartTableEvents["FILTER_CHANGED"] = "FILTER_CHANGED";
    SmartTableEvents["SUMMARY_CHANGED"] = "SUMMARY_CHANGED";
    SmartTableEvents["SEARCH_CHANGED"] = "SEARCH_CHANGED";
    SmartTableEvents["EXEC_ERROR"] = "EXEC_ERROR";
})(SmartTableEvents || (SmartTableEvents = {}));
const curriedPointer = (path) => {
    const { get, set } = pointer(path);
    return { get, set: curry(set) };
};
export const tableDirective = ({ sortFactory, tableState, data, filterFactory, searchFactory }) => {
    let filteredCount = data.length;
    let matchingItems = data;
    const table = emitter();
    const sortPointer = curriedPointer('sort');
    const slicePointer = curriedPointer('slice');
    const filterPointer = curriedPointer('filter');
    const searchPointer = curriedPointer('search');
    // We need to register in case the summary comes from outside (like server data)
    table.on("SUMMARY_CHANGED" /* SUMMARY_CHANGED */, ({ filteredCount: count }) => {
        filteredCount = count;
    });
    const safeAssign = curry((base, extension) => Object.assign({}, base, extension));
    const dispatch = curry(table.dispatch, 2);
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
                const execFunc = compose(filterFunc, searchFunc, tap(dispatchSummary), sortFunc, sliceFunc);
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
    const updateTableState = curry((pter, ev, newPartialState) => compose(safeAssign(pter.get(tableState)), tap(dispatch(ev)), pter.set(tableState))(newPartialState));
    const resetToFirstPage = () => updateTableState(slicePointer, "CHANGE_PAGE" /* PAGE_CHANGED */, { page: 1 });
    const tableOperation = (pter, ev) => compose(updateTableState(pter, ev), resetToFirstPage, () => table.exec() // We wrap within a function so table.exec can be overwritten (when using with a server for example)
    );
    const api = {
        sort: tableOperation(sortPointer, "TOGGLE_SORT" /* TOGGLE_SORT */),
        filter: tableOperation(filterPointer, "FILTER_CHANGED" /* FILTER_CHANGED */),
        search: tableOperation(searchPointer, "SEARCH_CHANGED" /* SEARCH_CHANGED */),
        slice: compose(updateTableState(slicePointer, "CHANGE_PAGE" /* PAGE_CHANGED */), () => table.exec()),
        exec,
        async eval(state = tableState) {
            const sortFunc = sortFactory(sortPointer.get(state));
            const searchFunc = searchFactory(searchPointer.get(state));
            const filterFunc = filterFactory(filterPointer.get(state));
            const sliceFunc = sliceFactory(slicePointer.get(state));
            const execFunc = compose(filterFunc, searchFunc, sortFunc, sliceFunc);
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
