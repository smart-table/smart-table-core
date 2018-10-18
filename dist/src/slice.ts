export interface SliceConfiguration {
    page?: number;
    size?: number;
}

export const sliceFactory = <T>({page = 1, size}: SliceConfiguration = {page: 1}) => (array: T[] = []): T[] => {
    const actualSize = size || array.length;
    const offset = (page - 1) * actualSize;
    return array.slice(offset, offset + actualSize);
};
