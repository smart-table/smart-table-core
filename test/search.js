import search from '../src/search';
import zora from 'zora';

export default zora()
  .test('full text search on all values (flat object)', function * (t) {
    const collection = [
      {a: 'woo', b: 'foot'},
      {a: 'foo', b: 'w'},
      {a: 'foo', b: 'b'},
    ];
    const output = search({value: 'w', scope: ['a', 'b']})(collection);
    t.deepEqual(output, [
      {a: 'woo', b: 'foot'},
      {a: 'foo', b: 'w'}
    ]);
  })
  .test('full text search on all values (nested object)', function * (t) {
    const collection = [
      {a: 'woo', b: {c: 'foot'}},
      {a: 'foo', b: {c: 'w'}},
      {a: 'foo', b: {c: 'b'}},
    ];
    const output = search({value: 'w', scope: ['a', 'b.c']})(collection);
    t.deepEqual(output, [
      {"a": "woo", "b": {"c": "foot"}},
      {"a": "foo", "b": {"c": "w"}}
    ]);
  })
  .test('full text search: do nothing when no scope is provided', function * (t) {
    const collection = [
      {a: 'woo', b: 'foot'},
      {a: 'foo', b: 'w'},
      {a: 'foo', b: 'b'},
    ];
    const output = search({value: 'w'})(collection);
    t.deepEqual(output, collection);
  })
  .test('full text search: do nothing when no value is provided', function * (t) {
    const collection = [
      {a: 'woo', b: 'foot'},
      {a: 'foo', b: 'w'},
      {a: 'foo', b: 'b'},
    ];
    const output = search({value: '', scope:['a']})(collection);
    t.deepEqual(output, collection);
  });