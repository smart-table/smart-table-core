export default ({page = 1, size} = {}) => (array = []) => {
	const actualSize = size || array.length;
	const offset = (page - 1) * actualSize;
	return array.slice(offset, offset + actualSize);
}
