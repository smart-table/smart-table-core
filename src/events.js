export const TOGGLE_SORT = 'TOGGLE_SORT';
export const DISPLAY_CHANGED = 'DISPLAY_CHANGED';
export const PAGE_CHANGED = 'CHANGE_PAGE';
export const EXEC_CHANGED = 'EXEC_STARTED';
export const FILTER_CHANGED = 'FILTER_CHANGED';
export const SUMMARY_CHANGED = 'SUMMARY_CHANGED';
export const SEARCH_CHANGED = 'SEARCH_CHANGED';
export const EXEC_ERROR = 'EXEC_ERROR';

export function emitter () {

  const listenersLists = {};

  return {
    on(event, ...listeners){
      listenersLists[event] = (listenersLists[event] || []).concat(listeners);
      return this;
    },
    dispatch(event, ...args){
      const listeners = listenersLists[event] || [];
      for (let listener of listeners) {
        listener(...args);
      }
      return this;
    },
    off(event, ...listeners){
      const list = listenersLists[event] || [];
      listenersLists[event] = listeners.length ? list.filter(listener => !listeners.includes(listener)) : [];
      return this;
    }
  }
}

export function proxyListener (eventMap) {
  return function ({emitter}) {

    const proxy = {};
    let eventListeners = {};

    for (let ev of Object.keys(eventMap)) {
      const method = eventMap[ev];
      eventListeners[ev] = [];
      proxy[method] = function (...listeners) {
        eventListeners[ev] = eventListeners[ev].concat(listeners);
        emitter.on(ev, ...listeners);
        return this;
      };
    }

    return Object.assign(proxy, {
      off(ev){
        if (!ev) {
          Object.keys(eventListeners).forEach(eventName => this.off(eventName));
        }

        if (eventListeners[ev]) {
          emitter.off(ev, ...eventListeners[ev]);
        }

        return this;
      }
    });
  }
}