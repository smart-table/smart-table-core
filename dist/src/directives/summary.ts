import {proxyListener} from 'smart-table-events';
import {SmartTable, SmartTableEvents} from './table';
import {ProxyEmitter} from 'smart-table-events';

export interface SummaryDirective extends ProxyEmitter {
    onSummaryChange(listener: SummaryChangeCallback): SummaryDirective;
}

export interface Summary {
    page: number;
    size: number;
    filteredCount: number;
}

export interface SummaryChangeCallback {
    (summary: Summary): void;
}

export interface SummaryDirectiveConfiguration<T> {
    table: SmartTable<T>
}

const summaryListener = proxyListener({[SmartTableEvents.SUMMARY_CHANGED]: 'onSummaryChange'});

export const summaryDirective = <T>({table}: SummaryDirectiveConfiguration<T>) => <SummaryDirective>summaryListener({emitter: table});
