import {curry, tap, compose} from 'smart-table-operators';
import {pointer} from 'smart-table-json-pointer';
import {emitter, Emitter} from 'smart-table-events';
import {SortConfiguration} from './sort';
import {SearchConfiguration} from 'smart-table-search';
import {FilterConfiguration} from 'smart-table-filter';
import {sliceFactory, SliceConfiguration} from '../slice';

export const enum SmartTableEvents {
    TOGGLE_SORT = 'TOGGLE_SORT',
    DISPLAY_CHANGED = 'DISPLAY_CHANGED',
    PAGE_CHANGED = 'CHANGE_PAGE',
    EXEC_CHANGED = 'EXEC_CHANGED',
    FILTER_CHANGED = 'FILTER_CHANGED',
    SUMMARY_CHANGED = 'SUMMARY_CHANGED',
    SEARCH_CHANGED = 'SEARCH_CHANGED',
    EXEC_ERROR = 'EXEC_ERROR'
}

export interface TableState {
    search: SearchConfiguration;
    filter: FilterConfiguration;
    sort: SortConfiguration;
    slice: SliceConfiguration;
}

export interface DisplayedItem<T> {
    index: number;
    value: T;
}

export interface DisplayChangeCallback<T> {
    (items: DisplayedItem<T>[]): void;
}

export interface ProcessingOptions {
    processingDelay: number
}

export interface SmartTable<T> extends Emitter {
    readonly filteredCount: number;
    readonly length: number;

    sort(input: SortConfiguration): void;

    filter(input: FilterConfiguration): void;

    slice(input: SliceConfiguration): void;

    search(input: SearchConfiguration): void;

    eval(tableState?: TableState): Promise<DisplayedItem<T>[]>;

    exec(opts?: ProcessingOptions): void;

    onDisplayChange(callback: DisplayChangeCallback<T>): void;

    getTableState(): TableState;

    getMatchingItems(): T[];
}

const curriedPointer = <T>(path: string) => {
    const {get, set} = pointer<T>(path);
    return {get, set: curry(set)};
};

export interface TableConfiguration<T> {
    data: T[];
    tableState: TableState;
    sortFactory: (conf: SortConfiguration) => (array: T[]) => T[];
    filterFactory: (conf: FilterConfiguration) => (array: T[]) => T[];
    searchFactory: (conf: SearchConfiguration) => (array: T[]) => T[];
}

export const tableDirective = <T>({sortFactory, tableState, data, filterFactory, searchFactory}: TableConfiguration<T>): SmartTable<T> => {
    let filteredCount = data.length;
    let matchingItems = data;
    const table: SmartTable<T> = <SmartTable<T>>emitter();
    const sortPointer = curriedPointer('sort');
    const slicePointer = curriedPointer('slice');
    const filterPointer = curriedPointer('filter');
    const searchPointer = curriedPointer('search');

    // We need to register in case the summary comes from outside (like server data)
    table.on(SmartTableEvents.SUMMARY_CHANGED, ({filteredCount: count}) => {
        filteredCount = count;
    });

    const safeAssign = curry((base, extension) => Object.assign({}, base, extension));
    const dispatch = curry(table.dispatch, 2);

    const dispatchSummary = (filtered: T[]) => {
        matchingItems = filtered;
        return dispatch(SmartTableEvents.SUMMARY_CHANGED, {
            page: tableState.slice.page,
            size: tableState.slice.size,
            filteredCount: filtered.length
        });
    };

    const exec = ({processingDelay = 20}: ProcessingOptions = {processingDelay: 20}) => {
        table.dispatch(SmartTableEvents.EXEC_CHANGED, {working: true});
        setTimeout(() => {
            try {
                const filterFunc = filterFactory(filterPointer.get(tableState));
                const searchFunc = searchFactory(searchPointer.get(tableState));
                const sortFunc = sortFactory(sortPointer.get(tableState));
                const sliceFunc = sliceFactory(slicePointer.get(tableState));
                const execFunc = compose(filterFunc, searchFunc, tap(dispatchSummary), sortFunc, sliceFunc);
                const displayed = execFunc(data);
                table.dispatch(SmartTableEvents.DISPLAY_CHANGED, displayed.map(d => ({
                    index: data.indexOf(d),
                    value: d
                })));
            } catch (err) {
                table.dispatch(SmartTableEvents.EXEC_ERROR, err);
            } finally {
                table.dispatch(SmartTableEvents.EXEC_CHANGED, {working: false});
            }
        }, processingDelay);
    };

    const updateTableState = curry((pter, ev, newPartialState) => compose(
        safeAssign(pter.get(tableState)),
        tap(dispatch(ev)),
        pter.set(tableState)
    )(newPartialState));

    const resetToFirstPage = () => updateTableState(slicePointer, SmartTableEvents.PAGE_CHANGED, {page: 1});

    const tableOperation = (pter, ev) => compose(
        updateTableState(pter, ev),
        resetToFirstPage,
        () => table.exec() // We wrap within a function so table.exec can be overwritten (when using with a server for example)
    );

    const api = {
        sort: tableOperation(sortPointer, SmartTableEvents.TOGGLE_SORT),
        filter: tableOperation(filterPointer, SmartTableEvents.FILTER_CHANGED),
        search: tableOperation(searchPointer, SmartTableEvents.SEARCH_CHANGED),
        slice: compose(updateTableState(slicePointer, SmartTableEvents.PAGE_CHANGED), () => table.exec()),
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
            table.on(SmartTableEvents.DISPLAY_CHANGED, fn);
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
