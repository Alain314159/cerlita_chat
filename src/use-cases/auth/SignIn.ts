export interface SignInDependencies {
  signIn: (email: string, password: string) => Promise<any>;
}

export const SignInUseCase = async (
  deps: SignInDependencies,
  email: string, 
  password: string
) => {
  return await deps.signIn(email, password);
};
