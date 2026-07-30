import * as Keychain from 'react-native-keychain';

export const useKeychain = () => ({
  set: async (
    key: string,
    value: string,
    options?: Keychain.Options,
  ): Promise<void> => {
    await Keychain.setGenericPassword(key, value, options);
  },
  get: async (
    key: string,
    options?: Keychain.Options,
  ): Promise<Keychain.UserCredentials | null> => {
    const credentials = await Keychain.getGenericPassword(options);
    if (credentials && credentials.username === key) {
      return credentials;
    }
    return null;
  },
  remove: async (
    key: string,
    options?: Keychain.Options,
  ): Promise<void> => {
    await Keychain.resetGenericPassword(options);
  },
});
