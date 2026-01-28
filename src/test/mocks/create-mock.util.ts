/**
 * Create a type-safe Jest mock object by assigning `jest.fn()` to the specified method names.
 *
 * The returned object is cast to `jest.Mocked<T>` and contains the provided keys as mocked functions.
 *
 * @param methodNames - Keys of `T` representing method names to mock
 * @returns A `jest.Mocked<T>` with each specified method replaced by a `jest.Mock`
 */
export function createAutoMock<T extends object>(
  methodNames: (keyof T)[],
): jest.Mocked<T> {
  const mock = {} as jest.Mocked<T>;
  for (const name of methodNames) {
    (mock as Record<keyof T, jest.Mock>)[name] = jest.fn();
  }
  return mock;
}

/**
 * Reset all function properties on a Jest-mocked object that expose `mockReset`.
 *
 * Iterates the provided mock object's own enumerable keys and calls `mockReset()` on any property that is a function and has a `mockReset` method. This mutates the passed `mock`.
 *
 * @param mock - A Jest-mocked object whose mock functions should be reset
 */
export function resetAllMocks<T extends object>(mock: jest.Mocked<T>): void {
  for (const key of Object.keys(mock)) {
    const value = mock[key as keyof T];
    if (typeof value === 'function' && 'mockReset' in (value as object)) {
      (value as unknown as jest.Mock).mockReset();
    }
  }
}