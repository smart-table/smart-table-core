import {proxyListener} from 'smart-table-events';
import {SEARCH_CHANGED} from '../events';

const searchListener = proxyListener({[SEARCH_CHANGED]: 'onSearchChange'});

export default ({table, scope = []}) => Object.assign(searchListener({emitter: table}), {
	search(input) {
		return table.search({value: input, scope});
	}
});
