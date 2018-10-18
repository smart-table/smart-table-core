export const sliceFactory = ({ page = 1, size } = { page: 1 }) => (array = []) => {
    const actualSize = size || array.length;
    const offset = (page - 1) * actualSize;
    return array.slice(offset, offset + actualSize);
};
