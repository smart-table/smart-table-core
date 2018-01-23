import sort from 'smart-table-sort';
import filter from 'smart-table-filter';
import search from 'smart-table-search';
import table from './directives/table';

export default function ({
													 sortFactory = sort,
													 filterFactory = filter,
													 searchFactory = search,
													 tableState = {sort: {}, slice: {page: 1}, filter: {}, search: {}},
													 data = []
												 }, ...tableDirectives) {

	const coreTable = table({sortFactory, filterFactory, tableState, data, searchFactory});

	return tableDirectives.reduce((accumulator, newdir) => {
		return Object.assign(accumulator, newdir({
			sortFactory,
			filterFactory,
			searchFactory,
			tableState,
			data,
			table: coreTable
		}));
	}, coreTable);
}