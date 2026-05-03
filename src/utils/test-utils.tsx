import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { theme } from '@/config/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </PaperProvider>
    </QueryProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
