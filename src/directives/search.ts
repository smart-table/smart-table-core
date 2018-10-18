import {proxyListener, ProxyEmitter} from 'smart-table-events';
import {SmartTable, SmartTableEvents} from './table';
import {SearchConfiguration} from 'smart-table-search';

interface SearchProxy extends ProxyEmitter {
    onSearchChange(listener: SearchChangeCallback): SearchDirective;
}

export {SearchConfiguration} from 'smart-table-search';

export interface SearchChangeCallback {
    (searchState: SearchConfiguration): void;
}

export interface SearchDirective extends SearchProxy {
    search(input: string, opts?: object): void;

    state(): SearchConfiguration;
}

export interface SearchDirectiveConfiguration<T> {
    table: SmartTable<T>;
    scope: string[]
}

const searchListener = proxyListener({[SmartTableEvents.SEARCH_CHANGED]: 'onSearchChange'});

export const searchDirective = <T>({table, scope = []}: SearchDirectiveConfiguration<T>): SearchDirective => {
    const proxy = <SearchProxy>searchListener({emitter: table});
    return Object.assign(proxy, {
        search(input, opts = {}) {
            return table.search(Object.assign({}, {value: input, scope}, opts));
        },
        state() {
            return table.getTableState().search;
        }
    }, proxy);
};
