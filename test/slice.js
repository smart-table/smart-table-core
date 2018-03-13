import test from 'zora';
import slicer from '../src/slice';

test('slice: get a page with specified size', (t) => {
	const input = [1, 2, 3, 4, 5, 6, 7];
	const output = slicer({page: 1, size: 5})(input);
	t.deepEqual(output, [1, 2, 3, 4, 5]);
});
test('slice: get a partial page if size is too big', (t) => {
	const input = [1, 2, 3, 4, 5, 6, 7];
	const output = slicer({page: 2, size: 5})(input);
	t.deepEqual(output, [6, 7]);
});
test('slice: get all the asset if no param is provided', (t) => {
	const input = [1, 2, 3, 4, 5, 6, 7];
	const output = slicer()(input);
	t.deepEqual(output, input);
});