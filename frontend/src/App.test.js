test('renders app title', () => {
  render(<App />);
  const element = screen.getByText(/logic gate synthesizer/i);
  expect(element).toBeInTheDocument();
});