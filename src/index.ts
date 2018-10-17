import {defaultSortFactory, SortConfiguration} from 'smart-table-sort';
import {filter, FilterConfiguration} from 'smart-table-filter';
import {regexp, SearchConfiguration} from 'smart-table-search';
import table, {SmartTable, TableState} from './directives/table';

export interface SmartTableInput<T> {
    sortFactory: (conf: SortConfiguration<T>) => (items: T[]) => T[];
    filterFactory: (conf: FilterConfiguration) => (items: T[]) => T[];
    searchFactory: (conf: SearchConfiguration) => (items: T[]) => T[];
    tableState: TableState<T>;
    data: T[]
}

export interface SmartTableExtensionInput<T> extends SmartTableInput<T> {
    table: SmartTable<T>
}

export interface SmartTableExtension<T> {
    (input: SmartTableExtensionInput<T>): SmartTable<T>;
}

const defaultTableState = {sort: {}, slice: {page: 1}, filter: {}, search: {value: '', scope: []}};
const defaultTableInput = {
    sortFactory: defaultSortFactory,
    filterFactory: filter,
    searchFactory: regexp,
    tableState: defaultTableState,
    data: []
};

export const smartTable = <T>({
                                  sortFactory = defaultSortFactory,
                                  filterFactory = filter,
                                  searchFactory = regexp,
                                  tableState = defaultTableState,
                                  data = []
                              }: SmartTableInput<T> = defaultTableInput, ...tableExtensions: SmartTableExtension<T>[]): SmartTable<T> => {

    const coreTable = table({sortFactory, filterFactory, tableState, data, searchFactory});

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
