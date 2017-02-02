export default function sliceFactory ({page = 1, size} = {}) {
  return function sliceFunction (array = []) {
    const actualSize = size || array.length;
    const offset = (page - 1) * actualSize;
    return array.slice(offset, offset + actualSize);
  };
}
