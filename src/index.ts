import {defaultSortFactory} from 'smart-table-sort';
import {filter, FilterConfiguration} from 'smart-table-filter';
import {regexp} from 'smart-table-search';
import {tableDirective, SmartTable, TableState} from './directives/table';
import {SearchConfiguration} from 'smart-table-search';
import {SortConfiguration} from './directives/sort';

export interface SmartTableInput<T> {
    sortFactory?: (conf: SortConfiguration) => (items: T[]) => T[];
    filterFactory?: (conf: FilterConfiguration) => (items: T[]) => T[];
    searchFactory?: (conf: SearchConfiguration) => (items: T[]) => T[];
    tableState?: TableState;
    data?: T[]
}

export interface SmartTableExtensionInput<T> extends SmartTableInput<T> {
    table: SmartTable<T>
}

export interface SmartTableExtension<T> {
    (input: SmartTableExtensionInput<T>): any;
}

const defaultTableState = () => ({sort: {}, slice: {page: 1}, filter: {}, search: {}});
export const smartTable = <T>({
                                  sortFactory = defaultSortFactory,
                                  filterFactory = filter,
                                  searchFactory = regexp,
                                  tableState = defaultTableState(),
                                  data = []
                              }: SmartTableInput<T> = {
    sortFactory: defaultSortFactory,
    filterFactory: filter,
    searchFactory: regexp,
    tableState: defaultTableState(),
    data: []
}, ...tableExtensions: SmartTableExtension<T>[]): SmartTable<T> => {

    const coreTable = tableDirective({sortFactory, filterFactory, tableState, data, searchFactory});

    return tableExtensions.reduce((accumulator, newdir) => Object.assign(accumulator, newdir({
            sortFactory,
            filterFactory,
            searchFactory,
            tableState,
            data,
            table: coreTable
        }))
        , coreTable);
};

export * from './directives/filter';
export * from './directives/search';
export * from './directives/pagination';
export * from './directives/sort';
export * from './directives/summary';
export * from './directives/table';
export * from './directives/working-indicator';
export * from './slice';
