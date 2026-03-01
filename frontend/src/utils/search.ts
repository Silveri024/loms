import { SortKeyPath } from './sort';

const getNestedValue = (obj: any, path: SortKeyPath): any => {
  if (!path.length) return obj;
  const [key, ...rest] = path;
  if (obj == null) return undefined;
  return getNestedValue(obj[key as keyof typeof obj], rest);
};

// Binary search for a prefix match on a sorted array by string key.
export const binarySearchPrefix = <T>(items: T[], keyPath: SortKeyPath, query: string): T[] => {
  if (!query) return items;
  const q = query.toLowerCase();
  const getVal = (item: T) => {
    const v = getNestedValue(item, keyPath);
    return v != null ? String(v).toLowerCase() : '';
  };

  let left = 0;
  let right = items.length - 1;
  let firstMatch = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const val = getVal(items[mid]);
    if (val.startsWith(q)) {
      firstMatch = mid;
      right = mid - 1; // search further left
    } else if (val < q) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (firstMatch === -1) return [];

  const results: T[] = [];
  for (let i = firstMatch; i < items.length; i++) {
    const val = getVal(items[i]);
    if (val.startsWith(q)) {
      results.push(items[i]);
    } else {
      break;
    }
  }
  return results;
};
