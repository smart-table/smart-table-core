import { defaultSortFactory } from 'smart-table-sort';
import { filter } from 'smart-table-filter';
import { regexp } from 'smart-table-search';
import { tableDirective } from './directives/table';
const defaultTableState = () => ({ sort: {}, slice: { page: 1 }, filter: {}, search: {} });
export const smartTable = ({ sortFactory = defaultSortFactory, filterFactory = filter, searchFactory = regexp, tableState = defaultTableState(), data = [] } = {
    sortFactory: defaultSortFactory,
    filterFactory: filter,
    searchFactory: regexp,
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
export * from './directives/filter';
export * from './directives/search';
export * from './directives/pagination';
export * from './directives/sort';
export * from './directives/summary';
export * from './directives/table';
export * from './directives/working-indicator';
