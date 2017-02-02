import {proxyListener, FILTER_CHANGED} from '../events';

const filterListener = proxyListener({[FILTER_CHANGED]: 'onFilterChange'});

export default function ({table, pointer, operator = 'includes', type = 'string'}) {
  return Object.assign({
      filter(input){
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
    },
    filterListener({emitter: table}));
}