import {proxyListener, ProxyEmitter} from 'smart-table-events';
import {FilterConfiguration, FilterOperator} from 'smart-table-filter';
import {SmartTable, SmartTableEvents} from './table';

interface FilterProxy extends ProxyEmitter {
    onFilterChange(listener: FilterChangeCallback): FilterDirective;
}

export interface FilterChangeCallback {
    (filterState: FilterConfiguration): void;
}

export interface FilterDirective extends FilterProxy {

    filter(input: string): void;

    state(): FilterConfiguration;
}

const filterListener = proxyListener({[SmartTableEvents.FILTER_CHANGED]: 'onFilterChange'});

enum Type {
    BOOLEAN = 'boolean',
    NUMBER = 'number',
    DATE = 'date',
    STRING = 'string'
}

export interface FilterDirectiveConfiguration<T> {
    table: SmartTable<T>;
    pointer: string;
    operator?: FilterOperator;
    type?: Type;
}

export default <T>({table, pointer, operator = FilterOperator.INCLUDES, type = Type.STRING}: FilterDirectiveConfiguration<T>): FilterDirective => {
    const proxy = <FilterProxy>filterListener({emitter: table});
    return Object.assign({
        filter(input: string) {
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
        },
        state() {
            return table.getTableState().filter;
        }
    }, proxy);
}
