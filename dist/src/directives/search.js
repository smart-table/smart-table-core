import {proxyListener} from 'smart-table-events';
import {SEARCH_CHANGED} from '../events';

const searchListener = proxyListener({[SEARCH_CHANGED]: 'onSearchChange'});

export default ({table, scope = []}) => Object.assign(searchListener({emitter: table}), {
	search(input, opts = {}) {
		return table.search(Object.assign({}, {value: input, scope}, opts));
	},
	state() {
		return table.getTableState().search;
	}
});
