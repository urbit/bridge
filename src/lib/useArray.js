import { useCallback, useState } from 'react';

/**
 * Manages an immutable array of items.
 */
export default function useArray(initialItems = [], itemBuilder) {
  const [items, _setItems] = useState(initialItems);

  const append = () => _setItems(items => [...items, itemBuilder()]);

  const removeAt = i =>
    _setItems(items => {
      const newItems = [...items.slice(0, i), ...items.slice(i + 1)];
      return newItems;
    });

  const updateAt = (i, update = {}) =>
    _setItems(items => [
      ...items.slice(0, i),
      {
        ...items[i],
        ...update,
      },
      ...items.slice(i + 1),
    ]);

  return [
    items,
    {
      append,
      removeAt,
      updateAt,
    },
  ];
}
