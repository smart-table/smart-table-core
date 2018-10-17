import {ProxyEmitter, proxyListener} from 'smart-table-events';
import {SmartTable, SmartTableEvents} from './table';

export interface WorkingIndicator {
    working: boolean
}

export interface WorkingIndicatorChangeCallback {
    (state: WorkingIndicator): void;
}

export interface WorkingIndicatorDirective extends ProxyEmitter {
    onExecutionChange(listener: WorkingIndicatorChangeCallback): void;
}

export interface WorkingIndicatorDirectiveConfiguration<T> {
    table: SmartTable<T>;
}

const executionListener = proxyListener({[SmartTableEvents.EXEC_CHANGED]: 'onExecutionChange'});

export default <T>({table}: WorkingIndicatorDirectiveConfiguration<T>) => <WorkingIndicatorDirective>executionListener({emitter: table});
