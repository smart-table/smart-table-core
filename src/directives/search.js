import {SEARCH_CHANGED} from '../events';
import {proxyListener} from 'smart-table-events';

const searchListener = proxyListener({[SEARCH_CHANGED]: 'onSearchChange'});

export default function ({table, scope = []}) {
  return Object.assign(
    searchListener({emitter: table}), {
      search(input){
        return table.search({value: input, scope});
      }
    });
}