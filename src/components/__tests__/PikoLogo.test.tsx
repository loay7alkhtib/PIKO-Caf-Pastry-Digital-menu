import { describe, expect, it } from 'vitest';
import { render } from '../../test/utils/test-utils';
import PikoLogo from '../PikoLogo';

describe('PikoLogo', () => {
  it('renders without crashing', () => {
    const { container } = render(<PikoLogo />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with props', () => {
    const { container } = render(<PikoLogo className='test-class' />);
    expect(container.firstChild).toBeTruthy();
  });
});
