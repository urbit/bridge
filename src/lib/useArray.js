import { useCallback, useState } from 'react';
import { identity } from 'lodash';

/**
 * Manages an immutable array of items.
 */
export default function useArray(initialItems = [], itemBuilder = identity) {
  const [items, _setItems] = useState(initialItems);

  const append = useCallback(
    item => _setItems(items => [...items, itemBuilder(item)]),
    [_setItems, itemBuilder]
  );

  const removeAt = useCallback(
    i =>
      _setItems(items => {
        const newItems = [...items.slice(0, i), ...items.slice(i + 1)];
        return newItems;
      }),
    [_setItems]
  );

  const updateAt = useCallback(
    (i, update = {}) =>
      _setItems(items => [
        ...items.slice(0, i),
        {
          ...items[i],
          ...update,
        },
        ...items.slice(i + 1),
      ]),
    [_setItems]
  );

  const clear = useCallback(() => _setItems([]), [_setItems]);

  return [
    items,
    {
      append,
      removeAt,
      updateAt,
      clear,
    },
  ];
}
