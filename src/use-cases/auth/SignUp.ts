export interface SignUpDependencies {
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  createProfile: (params: any) => Promise<void>;
  getUserProfile: (userId: string) => Promise<any>;
}

export const SignUpUseCase = async (
  deps: SignUpDependencies,
  email: string,
  password: string,
  displayName: string
) => {
  const data = await deps.signUp(email, password, displayName);
  
  if (data.user) {
    await deps.createProfile({
      id: data.user.id,
      email: data.user.email || email,
      display_name: displayName,
    });
    
    return await deps.getUserProfile(data.user.id);
  }
  
  return null;
};
