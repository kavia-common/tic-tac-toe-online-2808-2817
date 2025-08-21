import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header brand and buttons', () => {
  render(<App />);
  expect(screen.getByText(/Tic Tac Toe/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /dark|light/i })).toBeInTheDocument();
});

test('renders board with 9 cells', () => {
  render(<App />);
  const cells = screen.getAllByRole('gridcell');
  expect(cells).toHaveLength(9);
});
