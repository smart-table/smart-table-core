(function () {
'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var keys = createCommonjsModule(function (module, exports) {
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
});

var is_arguments = createCommonjsModule(function (module, exports) {
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
}
});

var index = createCommonjsModule(function (module) {
var pSlice = Array.prototype.slice;



var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
};

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (is_arguments(a)) {
    if (!is_arguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = keys(a),
        kb = keys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}
});

var assert = (collect) => {
  const insertAssertionHook = (fn) => (...args) => {
    const assertResult = fn(...args);
    collect(assertResult);
    return assertResult;
  };

  return {
    ok: insertAssertionHook((val, message = 'should be truthy') => ({
      pass: Boolean(val),
      expected: 'truthy',
      actual: val,
      operator: 'ok',
      message
    })),
    deepEqual: insertAssertionHook((actual, expected, message = 'should be equivalent') => ({
      pass: index(actual, expected),
      actual,
      expected,
      message,
      operator: 'deepEqual'
    })),
    equal: insertAssertionHook((actual, expected, message = 'should be equal') => ({
      pass: actual === expected,
      actual,
      expected,
      message,
      operator: 'equal'
    })),
    notOk: insertAssertionHook((val, message = 'should not be truthy') => ({
      pass: !Boolean(val),
      expected: 'falsy',
      actual: val,
      operator: 'notOk',
      message
    })),
    notDeepEqual: insertAssertionHook((actual, expected, message = 'should not be equivalent') => ({
      pass: !index(actual, expected),
      actual,
      expected,
      message,
      operator: 'notDeepEqual'
    })),
    notEqual: insertAssertionHook((actual, expected, message = 'should not be equal') => ({
      pass: actual !== expected,
      actual,
      expected,
      message,
      operator: 'notEqual'
    })),
    throws: insertAssertionHook((func, expected, message) => {
      let caught, pass, actual;
      if (typeof expected === 'string') {
        [expected, message] = [message, expected];
      }
      try {
        func();
      } catch (error) {
        caught = {error};
      }
      pass = caught !== undefined;
      actual = caught && caught.error;
      if (expected instanceof RegExp) {
        pass = expected.test(actual) || expected.test(actual && actual.message);
        expected = String(expected);
      } else if (typeof expected === 'function' && caught) {
        pass = actual instanceof expected;
        actual = actual.constructor;
      }
      return {
        pass,
        expected,
        actual,
        operator: 'throws',
        message: message || 'should throw'
      };
    }),
    doesNotThrow: insertAssertionHook((func, expected, message) => {
      let caught;
      if (typeof expected === 'string') {
        [expected, message] = [message, expected];
      }
      try {
        func();
      } catch (error) {
        caught = {error};
      }
      return {
        pass: caught === undefined,
        expected: 'no thrown error',
        actual: caught && caught.error,
        operator: 'doesNotThrow',
        message: message || 'should not throw'
      };
    }),
    fail: insertAssertionHook((reason = 'fail called') => ({
      pass: false,
      actual: 'fail called',
      expected: 'fail not called',
      message: reason,
      operator: 'fail'
    }))
  };
};

var test = ({description, spec, only = false} = {}) => {
  const assertions = [];
  const collect = (...args) => assertions.push(...args.map(a => Object.assign({description}, a)));

  const instance = {
    run(){
      const now = Date.now();
      return Promise.resolve(spec(assert(collect)))
        .then(() => ({assertions, executionTime: Date.now() - now}));
    }
  };

  Object.defineProperties(instance, {
    only: {value: only},
    assertions: {value: assertions},
    length: {
      get(){
        return assertions.length
      }
    },
    description: {value: description}
  });

  return instance;
};

const tapOut = ({pass, message, index}) => {
  const status = pass === true ? 'ok' : 'not ok';
  console.log([status, index, message].join(' '));
};

const canExit = () => {
  return typeof process !== 'undefined' && typeof process.exit === 'function';
};

var tap = () => function * () {
  let index = 1;
  let lastId = 0;
  let success = 0;
  let failure = 0;

  const starTime = Date.now();
  console.log('TAP version 13');
  try {
    while (true) {
      const assertion = yield;
      if (assertion.pass === true) {
        success++;
      } else {
        failure++;
      }
      assertion.index = index;
      if (assertion.id !== lastId) {
        console.log(`# ${assertion.description} - ${assertion.executionTime}ms`);
        lastId = assertion.id;
      }
      tapOut(assertion);
      if (assertion.pass !== true) {
        console.log(`  ---
  operator: ${assertion.operator}
  expected: ${JSON.stringify(assertion.expected)}
  actual: ${JSON.stringify(assertion.actual)}
  ...`);
      }
      index++;
    }
  } catch (e) {
    console.log('Bail out! unhandled exception');
    console.log(e);
    if (canExit()) {
      process.exit(1);
    }
  }
  finally {
    const execution = Date.now() - starTime;
    if (index > 1) {
      console.log(`
1..${index - 1}
# duration ${execution}ms
# success ${success}
# failure ${failure}`);
    }
    if (failure && canExit()) {
      process.exit(1);
    }
  }
};

var plan$1 = () => {
  const tests = [];
  const instance = {
    test(description, spec, opts = {}){
      if (!spec && description.test) {
        //this is a plan
        tests.push(...description);
      } else {
        const testItems = (description, spec) => (!spec && description.test) ? [...description] : [{description, spec}];
        tests.push(...testItems(description, spec).map(t => test(Object.assign(t, opts))));
      }
      return instance;
    },
    only(description, spec, opts = {}){
      return instance.test(description, spec, Object.assign(opts, {only: true}));
    },
    async run(sink = tap()){
      const sinkIterator = sink();
      const hasOnly = tests.some(t => t.only);
      const runnable = hasOnly ? tests.filter(t => t.only) : tests;
      let id = 1;
      sinkIterator.next();
      try {
        const results = runnable.map(t => t.run());
        for (let r of results) {
          const {assertions, executionTime} = await r;
          for (let assert of assertions) {
            sinkIterator.next(Object.assign(assert, {id, executionTime}));
          }
          id++;
        }
      }
      catch (e) {
        sinkIterator.throw(e);
      } finally {
        sinkIterator.return();
      }
    },
    [Symbol.iterator](){
      return tests[Symbol.iterator]();
    }
  };

  Object.defineProperties(instance, {
    tests: {value: tests},
    length: {
      get(){
        return tests.length
      }
    }
  });

  return instance;
};

var sliceFactory = ({page = 1, size} = {}) => (array = []) => {
  const actualSize = size || array.length;
  const offset = (page - 1) * actualSize;
  return array.slice(offset, offset + actualSize);
};

var slice = plan$1()
  .test('slice: get a page with specified size', (t) => {
    const input = [1, 2, 3, 4, 5, 6, 7];
    const output = sliceFactory({page: 1, size: 5})(input);
    t.deepEqual(output, [1, 2, 3, 4, 5]);
  })
  .test('slice: get a partial page if size is too big', (t) => {
    const input = [1, 2, 3, 4, 5, 6, 7];
    const output = sliceFactory({page: 2, size: 5})(input);
    t.deepEqual(output, [6, 7]);
  })
  .test('slice: get all the asset if no param is provided', (t) => {
    const input = [1, 2, 3, 4, 5, 6, 7];
    const output = sliceFactory()(input);
    t.deepEqual(output, input);
  });

function swap (f) {
  return (a, b) => f(b, a);
}

function compose (first, ...fns) {
  return (...args) => fns.reduce((previous, current) => current(previous), first(...args));
}

function curry (fn, arityLeft) {
  const arity = arityLeft || fn.length;
  return (...args) => {
    const argLength = args.length || 1;
    if (arity === argLength) {
      return fn(...args);
    } else {
      const func = (...moreArgs) => fn(...args, ...moreArgs);
      return curry(func, arity - args.length);
    }
  };
}



function tap$1 (fn) {
  return arg => {
    fn(arg);
    return arg;
  }
}

function pointer (path) {

  const parts = path.split('.');

  function partial (obj = {}, parts = []) {
    const p = parts.shift();
    const current = obj[p];
    return (current === undefined || parts.length === 0) ?
      current : partial(current, parts);
  }

  function set (target, newTree) {
    let current = target;
    const [leaf, ...intermediate] = parts.reverse();
    for (let key of intermediate.reverse()) {
      if (current[key] === undefined) {
        current[key] = {};
        current = current[key];
      }
    }
    current[leaf] = Object.assign(current[leaf] || {}, newTree);
    return target;
  }

  return {
    get(target){
      return partial(target, [...parts])
    },
    set
  }
}

function sortByProperty (prop) {
  const propGetter = pointer(prop).get;
  return (a, b) => {
    const aVal = propGetter(a);
    const bVal = propGetter(b);

    if (aVal === bVal) {
      return 0;
    }

    if (bVal === undefined) {
      return -1;
    }

    if (aVal === undefined) {
      return 1;
    }

    return aVal < bVal ? -1 : 1;
  }
}

function sortFactory ({pointer: pointer$$1, direction} = {}) {
  if (!pointer$$1 || direction === 'none') {
    return array => [...array];
  }

  const orderFunc = sortByProperty(pointer$$1);
  const compareFunc = direction === 'desc' ? swap(orderFunc) : orderFunc;

  return (array) => [...array].sort(compareFunc);
}

function typeExpression (type) {
  switch (type) {
    case 'boolean':
      return Boolean;
    case 'number':
      return Number;
    case 'date':
      return (val) => new Date(val);
    default:
      return compose(String, (val) => val.toLowerCase());
  }
}

const operators = {
  includes(value){
    return (input) => input.includes(value);
  },
  is(value){
    return (input) => Object.is(value, input);
  },
  isNot(value){
    return (input) => !Object.is(value, input);
  },
  lt(value){
    return (input) => input < value;
  },
  gt(value){
    return (input) => input > value;
  },
  lte(value){
    return (input) => input <= value;
  },
  gte(value){
    return (input) => input >= value;
  },
  equals(value){
    return (input) => value == input;
  },
  notEquals(value){
    return (input) => value != input;
  }
};

const every = fns => (...args) => fns.every(fn => fn(...args));

function predicate ({value = '', operator = 'includes', type = 'string'}) {
  const typeIt = typeExpression(type);
  const operateOnTyped = compose(typeIt, operators[operator]);
  const predicateFunc = operateOnTyped(value);
  return compose(typeIt, predicateFunc);
}

//avoid useless filter lookup (improve perf)
function normalizeClauses (conf) {
  const output = {};
  const validPath = Object.keys(conf).filter(path => Array.isArray(conf[path]));
  validPath.forEach(path => {
    const validClauses = conf[path].filter(c => c.value !== '');
    if (validClauses.length) {
      output[path] = validClauses;
    }
  });
  return output;
}

function filter (filter) {
  const normalizedClauses = normalizeClauses(filter);
  const funcList = Object.keys(normalizedClauses).map(path => {
    const getter = pointer(path).get;
    const clauses = normalizedClauses[path].map(predicate);
    return compose(getter, every(clauses));
  });
  const filterPredicate = every(funcList);

  return (array) => array.filter(filterPredicate);
}

var search = function (searchConf = {}) {
  const {value, scope = []} = searchConf;
  const searchPointers = scope.map(field => pointer(field).get);
  if (!scope.length || !value) {
    return array => array;
  } else {
    return array => array.filter(item => searchPointers.some(p => String(p(item)).includes(String(value))))
  }
};

function emitter () {

  const listenersLists = {};
  const instance = {
    on(event, ...listeners){
      listenersLists[event] = (listenersLists[event] || []).concat(listeners);
      return instance;
    },
    dispatch(event, ...args){
      const listeners = listenersLists[event] || [];
      for (let listener of listeners) {
        listener(...args);
      }
      return instance;
    },
    off(event, ...listeners){
      if (!event) {
        Object.keys(listenersLists).forEach(ev => instance.off(ev));
      } else {
        const list = listenersLists[event] || [];
        listenersLists[event] = listeners.length ? list.filter(listener => !listeners.includes(listener)) : [];
      }
      return instance;
    }
  };
  return instance;
}

function proxyListener (eventMap) {
  return function ({emitter}) {

    const proxy = {};
    let eventListeners = {};

    for (let ev of Object.keys(eventMap)) {
      const method = eventMap[ev];
      eventListeners[ev] = [];
      proxy[method] = function (...listeners) {
        eventListeners[ev] = eventListeners[ev].concat(listeners);
        emitter.on(ev, ...listeners);
        return proxy;
      };
    }

    return Object.assign(proxy, {
      off(ev){
        if (!ev) {
          Object.keys(eventListeners).forEach(eventName => proxy.off(eventName));
        }
        if (eventListeners[ev]) {
          emitter.off(ev, ...eventListeners[ev]);
        }
        return proxy;
      }
    });
  }
}

const TOGGLE_SORT = 'TOGGLE_SORT';
const DISPLAY_CHANGED = 'DISPLAY_CHANGED';
const PAGE_CHANGED = 'CHANGE_PAGE';
const EXEC_CHANGED = 'EXEC_CHANGED';
const FILTER_CHANGED = 'FILTER_CHANGED';
const SUMMARY_CHANGED = 'SUMMARY_CHANGED';
const SEARCH_CHANGED = 'SEARCH_CHANGED';
const EXEC_ERROR = 'EXEC_ERROR';

function curriedPointer (path) {
  const {get, set} = pointer(path);
  return {get, set: curry(set)};
}

var table$1 = function ({
  sortFactory,
  tableState,
  data,
  filterFactory,
  searchFactory
}) {
  const table = emitter();
  const sortPointer = curriedPointer('sort');
  const slicePointer = curriedPointer('slice');
  const filterPointer = curriedPointer('filter');
  const searchPointer = curriedPointer('search');

  const safeAssign = curry((base, extension) => Object.assign({}, base, extension));
  const dispatch = curry(table.dispatch, 2);

  const dispatchSummary = (filtered) => {
    dispatch(SUMMARY_CHANGED, {
      page: tableState.slice.page,
      size: tableState.slice.size,
      filteredCount: filtered.length
    });
  };

  const exec = ({processingDelay = 20} = {}) => {
    table.dispatch(EXEC_CHANGED, {working: true});
    setTimeout(function () {
      try {
        const filterFunc = filterFactory(filterPointer.get(tableState));
        const searchFunc = searchFactory(searchPointer.get(tableState));
        const sortFunc = sortFactory(sortPointer.get(tableState));
        const sliceFunc = sliceFactory(slicePointer.get(tableState));
        const execFunc = compose(filterFunc, searchFunc, tap$1(dispatchSummary), sortFunc, sliceFunc);
        const displayed = execFunc(data);
        table.dispatch(DISPLAY_CHANGED, displayed.map(d => {
          return {index: data.indexOf(d), value: d};
        }));
      } catch (e) {
        table.dispatch(EXEC_ERROR, e);
      } finally {
        table.dispatch(EXEC_CHANGED, {working: false});
      }
    }, processingDelay);
  };

  const updateTableState = curry((pter, ev, newPartialState) => compose(
    safeAssign(pter.get(tableState)),
    tap$1(dispatch(ev)),
    pter.set(tableState)
  )(newPartialState));

  const resetToFirstPage = () => updateTableState(slicePointer, PAGE_CHANGED, {page: 1});

  const tableOperation = (pter, ev) => compose(
    updateTableState(pter, ev),
    resetToFirstPage,
    () => table.exec() // we wrap within a function so table.exec can be overwritten (when using with a server for example)
  );

  const api = {
    sort: tableOperation(sortPointer, TOGGLE_SORT),
    filter: tableOperation(filterPointer, FILTER_CHANGED),
    search: tableOperation(searchPointer, SEARCH_CHANGED),
    slice: compose(updateTableState(slicePointer, PAGE_CHANGED), () => table.exec()),
    exec,
    eval(state = tableState){
      return Promise.resolve()
        .then(function () {
          const sortFunc = sortFactory(sortPointer.get(state));
          const searchFunc = searchFactory(searchPointer.get(state));
          const filterFunc = filterFactory(filterPointer.get(state));
          const sliceFunc = sliceFactory(slicePointer.get(state));
          const execFunc = compose(filterFunc, searchFunc, sortFunc, sliceFunc);
          return execFunc(data).map(d => {
            return {index: data.indexOf(d), value: d}
          });
        });
    },
    onDisplayChange(fn){
      table.on(DISPLAY_CHANGED, fn);
    },
    getTableState(){
      const sort = Object.assign({}, tableState.sort);
      const search = Object.assign({}, tableState.search);
      const slice = Object.assign({}, tableState.slice);
      const filter = {};
      for (let prop in tableState.filter) {
        filter[prop] = tableState.filter[prop].map(v => Object.assign({}, v));
      }
      return {sort, search, slice, filter};
    }
  };

  const instance = Object.assign(table, api);

  Object.defineProperty(instance, 'length', {
    get(){
      return data.length;
    }
  });

  return instance;
};

var tableFactory = function ({
  sortFactory: sortFactory$$1 = sortFactory,
  filterFactory = filter,
  searchFactory = search,
  tableState = {sort: {}, slice: {page: 1}, filter: {}, search: {}},
  data = []
}, ...tableDirectives) {

  const coreTable = table$1({sortFactory: sortFactory$$1, filterFactory, tableState, data, searchFactory});

  return tableDirectives.reduce((accumulator, newdir) => {
    return Object.assign(accumulator, newdir({
      sortFactory: sortFactory$$1,
      filterFactory,
      searchFactory,
      tableState,
      data,
      table: coreTable
    }));
  }, coreTable);
};

var table = plan$1()
  .test('compose table factory', (t) => {
    const data = [];
    const tableState = {};
    const tableInstance = tableFactory({data, tableState}, function ({data: d, tableState: ts}) {
      return {
        getData(){
          return d;
        },
        getTableState(){
          return ts;
        }
      };
    });

    t.ok(tableInstance.getData !== undefined && tableInstance.getTableState !== undefined, 'table instance should have extended behaviour');
    t.ok(tableInstance.exec !== undefined, 'table instance should have regular behaviour');
    t.equal(tableInstance.getData(), data, 'all factories should have the same data reference');
    t.equal(tableInstance.getTableState(), tableState, 'all factories should have the same table state reference');
  });

const filterListener = proxyListener({[FILTER_CHANGED]: 'onFilterChange'});

var filter$1 = function ({table, pointer, operator = 'includes', type = 'string'}) {
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
};

function fakeTable () {
  const table = emitter();
  table.filter = input => input;
  return table;
}

var filterDirective = plan$1()
  .test('filter directive should be able to register listener', (t) => {
    let counter = 0;
    const table = fakeTable();
    const fd = filter$1({table, pointer: 'foo'});
    fd.onFilterChange(() => counter++);
    table.dispatch(FILTER_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('filter directive should call table filter method passing the appropriate argument', (t) => {
    const table = fakeTable();
    const fd = filter$1({table, pointer: 'foo.bar', operator: 'is', type: 'number'});
    const arg = fd.filter(42);
    t.deepEqual(arg, {'foo.bar': [{value: 42, operator: 'is', type: 'number'}]});
  });

const searchListener = proxyListener({[SEARCH_CHANGED]: 'onSearchChange'});

var search$1 = function ({table, scope = []}) {
  return Object.assign(
    searchListener({emitter: table}), {
      search(input){
        return table.search({value: input, scope});
      }
    });
};

function fakeTable$1 () {
  const table = emitter();
  table.search = input => input;
  return table;
}

var searchDirective = plan$1()
  .test('search directive should be able to register listener', (t) => {
    let counter = 0;
    const table = fakeTable$1();
    const dir = search$1({table});
    dir.onSearchChange(() => counter++);
    table.dispatch(SEARCH_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('search directive should call table search method passing the appropriate argument', (t) => {
    const table = fakeTable$1();
    const dir = search$1({table, scope: ['foo', 'bar.woot']});
    const arg = dir.search(42);
    t.deepEqual(arg, {value: 42, scope: ['foo', 'bar.woot']});
  });

const sliceListener = proxyListener({[PAGE_CHANGED]: 'onPageChange', [SUMMARY_CHANGED]: 'onSummaryChange'});

var slice$1 = function ({table}) {
  let {slice:{page:currentPage, size:currentSize}} = table.getTableState();
  let itemListLength = table.length;

  const api = {
    selectPage(p){
      return table.slice({page: p, size: currentSize});
    },
    selectNextPage(){
      return api.selectPage(currentPage + 1);
    },
    selectPreviousPage(){
      return api.selectPage(currentPage - 1);
    },
    changePageSize(size){
      return table.slice({page: 1, size});
    },
    isPreviousPageEnabled(){
      return currentPage > 1;
    },
    isNextPageEnabled(){
      return Math.ceil(itemListLength / currentSize) > currentPage;
    }
  };
  const directive = Object.assign(api, sliceListener({emitter: table}));

  directive.onSummaryChange(({page:p, size:s, filteredCount}) => {
    currentPage = p;
    currentSize = s;
    itemListLength = filteredCount;
  });

  return directive;
};

function fakeTable$2 (slice = {}) {
  const table = emitter();
  table.getTableState = () => ({
    slice
  });
  table.slice = input => input;
  return table;
}

var sliceDirective = plan$1()
  .test('slice directive should be able to register listener to PAGE_CHANGED event', (t) => {
    let counter = 0;
    const table = fakeTable$2();
    const dir = slice$1({table});
    dir.onPageChange(() => counter++);
    table.dispatch(PAGE_CHANGED, {size: 25, page: 1});
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('slice directive should be able to register listener to SUMMARY_CHANGED event', (t) => {
    let counter = 0;
    const table = fakeTable$2();
    const dir = slice$1({table});
    dir.onSummaryChange(() => counter++);
    table.dispatch(SUMMARY_CHANGED, {size: 25, page: 1});
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('slice directive should call table slice method with the given page', (t) => {
    const table = fakeTable$2({size: 25, page: 4});
    const dir = slice$1({table});
    const arg = dir.selectPage(2);
    t.deepEqual(arg, {page: 2, size: 25});
  })
  .test('slice directive should call table slice method with the next page arguments', (t) => {
    const table = fakeTable$2({size: 21, page: 4});
    const dir = slice$1({table});
    const {page, size} = dir.selectNextPage();
    t.equal(page, 5, 'should be the next page');
    t.equal(size, 21, 'should keep the current page size');
  })
  .test('slice directive should call table slice method with the previous page arguments', (t) => {
    const table = fakeTable$2({size: 26, page: 9});
    const dir = slice$1({table});
    const {page, size} = dir.selectPreviousPage();
    t.equal(page, 8, 'should be the previous page');
    t.equal(size, 26, 'should keep the current page size');
  })
  .test('slice directive should call table slice method with the page size, returning to page one', (t) => {
    const table = fakeTable$2();
    const dir = slice$1({table, size: 100, page: 3});
    const {page, size} = dir.changePageSize(42);
    t.equal(page, 1, 'should have returned to the first page');
    t.equal(size, 42, 'should have change the page size');
  })
  .test('slice directive should tell whether previous page is enabled', (t) => {
    const table = fakeTable$2();
    const dir = slice$1({table});
    table.dispatch(SUMMARY_CHANGED, {size: 25, page: 1});
    t.equal(dir.isPreviousPageEnabled(), false);
    table.dispatch(SUMMARY_CHANGED, {size: 25, page: 2});
    t.equal(dir.isPreviousPageEnabled(), true);
  })
  .test('slice directive should tell whether next page is enabled', (t) => {
    const table = fakeTable$2();
    const dir = slice$1({table});
    table.dispatch(SUMMARY_CHANGED, {size: 25, page: 3, filteredCount: 100});
    t.equal(dir.isNextPageEnabled(), true);
    table.dispatch(SUMMARY_CHANGED, {size: 25, page: 2, filteredCount: 38});
    t.equal(dir.isNextPageEnabled(), false);
  });

const sortListeners = proxyListener({[TOGGLE_SORT]: 'onSortToggle'});
const directions = ['asc', 'desc'];

var sort = function ({pointer, table, cycle = false}) {

  const cycleDirections = cycle === true ? ['none'].concat(directions) : [...directions].reverse();

  let hit = 0;

  const directive = Object.assign({
    toggle(){
      hit++;
      const direction = cycleDirections[hit % cycleDirections.length];
      return table.sort({pointer, direction});
    }

  }, sortListeners({emitter: table}));

  directive.onSortToggle(({pointer:p}) => {
    if (pointer !== p) {
      hit = 0;
    }
  });

  return directive;
};

function fakeTable$3 () {
  const table = emitter();
  table.sort = input => input;
  return table;
}

var sortDirective = plan$1()
  .test('sort directive should be able to register listener', (t) => {
    let counter = 0;
    const table = fakeTable$3();
    const dir = sort({table, pointer: 'foo.bar'});
    dir.onSortToggle(() => counter++);
    table.dispatch(TOGGLE_SORT, {});
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('sort directive dual state mode: sequentially change sort direction', (t) => {
    const table = fakeTable$3();
    const dir = sort({table, pointer: 'foo.bar'});
    const arg = dir.toggle();
    t.deepEqual(arg, {pointer: 'foo.bar', direction: 'asc'});
    const secondArg = dir.toggle();
    t.deepEqual(secondArg, {pointer: 'foo.bar', direction: 'desc'});
    const thirdArg = dir.toggle();
    t.deepEqual(thirdArg, {pointer: 'foo.bar', direction: 'asc'});
  })
  .test('sort directive cycle mode: sequentially change sort direction', (t) => {
    const table = fakeTable$3();
    const dir = sort({table, pointer: 'foo.bar', cycle: true});
    const arg = dir.toggle();
    t.deepEqual(arg, {pointer: 'foo.bar', direction: 'asc'});
    const secondArg = dir.toggle();
    t.deepEqual(secondArg, {pointer: 'foo.bar', direction: 'desc'});
    const thirdArg = dir.toggle();
    t.deepEqual(thirdArg, {pointer: 'foo.bar', direction: 'none'});
    const fourthArg = dir.toggle();
    t.deepEqual(fourthArg, {pointer: 'foo.bar', direction: 'asc'});
  })
  .test('a directive should reset when it is not concerned by the toggle', (t) => {
    const table = fakeTable$3();
    const dir = sort({table, pointer: 'foo.bar'});
    const arg = dir.toggle();
    t.deepEqual(arg, {pointer: 'foo.bar', direction: 'asc'});
    table.dispatch(TOGGLE_SORT, {pointer: 'woot.woot'});
    const secondArg = dir.toggle();
    t.deepEqual(secondArg, {pointer: 'foo.bar', direction: 'asc'});
  })
;

const summaryListener = proxyListener({[SUMMARY_CHANGED]: 'onSummaryChange'});

var summary = ({table}) => summaryListener({emitter: table});

var summaryDirective = plan$1()
  .test('summary directive should be able to register listener', (t) => {
    let counter = 0;
    const table = emitter();
    const s = summary({table});
    s.onSummaryChange(() => counter++);
    table.dispatch(SUMMARY_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  });

const executionListener = proxyListener({[EXEC_CHANGED]: 'onExecutionChange'});

var workingIndicator = ({table}) => executionListener({emitter: table});

var wokringIndicatorDirective = plan$1()
  .test('summary directive should be able to register listener', (t) => {
    let counter = 0;
    const table = emitter();
    const s = workingIndicator({table});
    s.onExecutionChange(() => counter++);
    table.dispatch(EXEC_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  });

function wait (time) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve('finished');
    }, time);
  });
}

var tableDirective = plan$1()
  .test('table directive: should be able to register listener on display change', (t) => {
    let displayed = null;
    const table = tableFactory({});
    table.onDisplayChange((args) => displayed = args);
    table.dispatch(DISPLAY_CHANGED, 'foo');
    t.equal(displayed, 'foo');
  })
  .test('table directive: sort should dispatch the mutated sort state', (t) => {
    let sortState = null;
    let sliceState = null;
    const table = tableFactory({});
    table.on(TOGGLE_SORT, arg => sortState = arg);
    table.on(PAGE_CHANGED, arg => sliceState = arg);
    const newState = {direction: 'asc', pointer: 'foo.bar'};
    table.sort(newState);
    t.deepEqual(sortState, newState);
    t.deepEqual(sliceState, {page: 1}, 'should have reset to first page');
  })
  .test('table directive: sort should trigger an execution with the new state', (t) => {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.sort({direction: 'asc', pointer: 'foo.bar'});
    t.deepEqual(newState, {slice: {page: 1}, filter: {}, search: {}, sort: {direction: 'asc', pointer: 'foo.bar'}});
  })
  .test('table directive: slice should dispatch the mutated slice state', (t) => {
    let sliceState = null;
    const table = tableFactory({});
    table.on(PAGE_CHANGED, arg => sliceState = arg);
    const newState = {page: 7, size: 25};
    table.slice(newState);
    t.deepEqual(sliceState, newState);
  })
  .test('table directive: slice should trigger an execution with the new state', (t) => {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.slice({page: 4, size: 12});
    t.deepEqual(newState, {"sort": {}, "slice": {"page": 4, "size": 12}, "filter": {}, "search": {}});
  })
  .test('table directive: filter should dispatch the mutated filter state', (t) => {
    let filterState = null;
    let sliceState = null;
    const table = tableFactory({});
    table.on(FILTER_CHANGED, arg => filterState = arg);
    table.on(PAGE_CHANGED, arg => sliceState = arg);
    const newState = {foo: [{value: 'bar'}]};
    table.filter(newState);
    t.deepEqual(filterState, newState);
    t.deepEqual(sliceState, {page: 1}, 'should have reset the page');
  })
  .test('table directive: filter should trigger an execution with the new state', (t) => {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.filter({foo: [{value: 'bar'}]});
    t.deepEqual(newState, {"sort": {}, "slice": {"page": 1}, "filter": {"foo": [{"value": "bar"}]}, "search": {}}
    );
  })
  .test('table directive: search should dispatch the mutated search state', (t) => {
    let searchState = null;
    let sliceState = null;
    const table = tableFactory({});
    table.on(SEARCH_CHANGED, arg => searchState = arg);
    table.on(PAGE_CHANGED, arg => sliceState = arg);
    const newState = {value: 'foo'};
    table.search(newState);
    t.deepEqual(searchState, newState);
    t.deepEqual(sliceState, {page: 1}, 'should have reset to the first page');
  })
  .test('table directive: search should trigger an execution with the new state', (t) => {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.search({value: 'bar'});
    t.deepEqual(newState, {"sort": {}, "slice": {"page": 1}, "filter": {}, "search": {"value": "bar"}});
  })
  .test('table directive: eval should return the displayed collection based on table state by default', async function (t) {
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });
    const output = await table.eval();
    t.deepEqual(output, [
      {"index": 2, "value": {"id": 3, "name": "bip"}},
      {"index": 1, "value": {"id": 2, "name": "blah"}}
    ]);

    //table state has mutated !
    tableState.slice = {page: 2, size: 2};
    const outputBis = await table.eval();
    t.deepEqual(outputBis, [{"index": 0, "value": {"id": 1, "name": "foo"}}]);
  })
  .test('table directive: eval should be able to take any state as input', async function (t) {
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });
    const output = await table.eval({sort: {}, slice: {}, filter: {}, search: {}});
    t.deepEqual(output, [
      {"index": 0, "value": {"id": 1, "name": "foo"}},
      {"index": 1, "value": {"id": 2, "name": "blah"}},
      {"index": 2, "value": {"id": 3, "name": "bip"}}
    ]);
  })
  .test('table directive: eval should not dispatch any event', async function (t) {
    let counter = 0;
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const incrementCounter = () => counter++;
    const table = tableFactory({
      tableState
    });
    table.on(DISPLAY_CHANGED, incrementCounter);
    table.on(TOGGLE_SORT, incrementCounter);
    table.on(PAGE_CHANGED, incrementCounter);
    table.on(FILTER_CHANGED, incrementCounter);
    table.on(SEARCH_CHANGED, incrementCounter);
    table.on(SUMMARY_CHANGED, incrementCounter);
    table.on(EXEC_CHANGED, incrementCounter);
    await table.eval();
    t.equal(counter, 0, 'counter should not have been updated');
    t.deepEqual(tableState, {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    }, 'table state should not have changed');
  })
  .test('exec should first set the working state to true then false', async function (t) {
    let workingState;
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ]
    });
    table.on(EXEC_CHANGED, function ({working}) {
      workingState = working;
    });
    table.exec();
    t.equal(workingState, true);
    await wait(25);
    t.equal(workingState, false);
  })
  .test('exec should dispatch the display changed event with the new displayed value', async function (t) {
    let displayed;
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });

    table.onDisplayChange(val => displayed = val);
    table.exec();
    await wait(25);
    t.deepEqual(displayed, [
      {"index": 2, "value": {"id": 3, "name": "bip"}},
      {"index": 1, "value": {"id": 2, "name": "blah"}}
    ]);
  })
  .test('exec should dispatch the summary changed event with the new value', async function (t) {
    let summary;
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {name: [{value: 'b'}]},
      slice: {page: 1, size: 1}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });

    table.on(SUMMARY_CHANGED, val => summary = val);
    table.exec();
    await wait(25);
    t.deepEqual(summary, {"page": 1, "size": 1, "filteredCount": 2}
    );
  })
  .test('getTableState should return a deep copy of the tableState', (t) => {
    const tableState = {
      sort: {pointer: 'foo'},
      slice: {page: 2, size: 25},
      search: {value: 'wat', scope: []},
      filter: {foo: [{value: 'blah'}]}
    };
    const table = tableFactory({data: [], tableState});
    const copy = table.getTableState();
    t.deepEqual(copy, tableState);
    t.ok(!Object.is(copy.sort, tableState.sort));
    t.ok(!Object.is(copy.search, tableState.search));
    t.ok(!Object.is(copy.filter, tableState.filter));
    t.ok(!Object.is(copy.slice, tableState.slice));
  });

plan$1()
  .test(slice)
  .test(table)
  .test(filterDirective)
  .test(searchDirective)
  .test(sliceDirective)
  .test(sortDirective)
  .test(summaryDirective)
  .test(wokringIndicatorDirective)
  .test(tableDirective)
  .run();

}());
//# sourceMappingURL=index.js.map
