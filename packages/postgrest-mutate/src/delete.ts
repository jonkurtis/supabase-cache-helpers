import { mutate, Operation, Cache } from './lib';

export type DeleteItemProps<Type extends Record<string, unknown>> = Omit<
  Operation<Type>,
  'type'
>;

export const deleteItem = <Key, Type extends Record<string, unknown>>(
  op: DeleteItemProps<Type>,
  cache: Cache<Key, Type>
) => mutate({ type: 'DELETE', ...op }, cache);
