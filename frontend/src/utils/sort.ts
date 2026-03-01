export type SortDirection = 'asc' | 'desc';
export type SortKeyPath = Array<string | number>;

const getNestedValue = (obj: any, path: SortKeyPath): any => {
  if (!path.length) return obj;
  const [key, ...rest] = path;
  if (obj == null) return undefined;
  return getNestedValue(obj[key as keyof typeof obj], rest);
};

export const bubbleSort = <T>(items: T[], keyPath: SortKeyPath, direction: SortDirection = 'asc'): T[] => {
  const factor = direction === 'asc' ? 1 : -1;
  const arr = [...items];

  const compare = (a: T, b: T) => {
    const va = getNestedValue(a, keyPath);
    const vb = getNestedValue(b, keyPath);

    if (va == null && vb == null) return 0;
    if (va == null) return -1 * factor;
    if (vb == null) return 1 * factor;

    if (typeof va === 'number' && typeof vb === 'number') {
      return va - vb;
    }
    const sa = String(va).toLowerCase();
    const sb = String(vb).toLowerCase();
    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return 0;
  };

  const bubbleSortRecursive = (n: number) => {
    if (n <= 1) return;
    for (let i = 0; i < n - 1; i++) {
      if (compare(arr[i], arr[i + 1]) * factor > 0) {
        const tmp = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = tmp;
      }
    }
    bubbleSortRecursive(n - 1);
  };

  bubbleSortRecursive(arr.length);
  return arr;
};
