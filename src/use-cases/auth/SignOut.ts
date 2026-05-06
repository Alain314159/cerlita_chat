export interface SignOutDependencies {
  signOut: () => Promise<void>;
  cleanupNotifications: () => void;
}

export const SignOutUseCase = async (deps: SignOutDependencies) => {
  await deps.signOut();
  deps.cleanupNotifications();
};
