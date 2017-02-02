import {proxyListener, SEARCH_CHANGED} from '../events';

const searchListener = proxyListener({[SEARCH_CHANGED]: 'onSearchChange'});

export default function ({table}) {
  return Object.assign(
    searchListener({emitter: table}),
    {
      search(input){
        return table.search({value: input});
      }
    });
}