import {proxyListener} from 'smart-table-events';
import {FILTER_CHANGED} from '../events';

const filterListener = proxyListener({[FILTER_CHANGED]: 'onFilterChange'});

export default ({table, pointer, operator = 'includes', type = 'string'}) => Object.assign({
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
	}
}, filterListener({emitter: table}));
