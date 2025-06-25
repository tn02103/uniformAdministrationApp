import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function for components that need providers
 * You can extend this with providers like QueryClient, Router, etc.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Add providers here when needed
  // const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  //   return (
  //     <QueryClientProvider client={testQueryClient}>
  //       <Router>
  //         {children}
  //       </Router>
  //     </QueryClientProvider>
  //   );
  // };

  return render(ui, { ...options });
}

/**
 * Helper to create mock props for components
 */
export function createMockProps<T extends Record<string, unknown>>(
  overrides: Partial<T> = {}
): T {
  const defaults = {
    // Add common default props here
  };
  
  return { ...defaults, ...overrides } as T;
}

/**
 * Helper to wait for async operations in tests
 */
export async function waitForNextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// Re-export everything from testing library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
