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





export const checkDateTolerance = (date: Date) => {
    const now = new Date();
    return Math.abs(now.getTime() - date.getTime());
}
