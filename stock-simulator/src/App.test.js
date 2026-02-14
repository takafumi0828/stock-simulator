import { render, screen } from '@testing-library/react';
import App from './App';

test('renders invader game title', () => {
  render(<App />);
  const title = screen.getByText(/インベーダーゲーム/i);
  expect(title).toBeInTheDocument();
});
