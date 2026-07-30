import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GlassCard } from '@/components/motion/GlassCard';
import { MicroToggle, MicroHeart, MicroProgress } from '@/components/motion/MicroInteractions';

describe('ProfilePage', () => {
  it('renders profile card', () => {
    render(
      <GlassCard variant="light">
        <div>
          <div data-testid="avatar">SA</div>
          <h2>Sara Al-Ahmed</h2>
          <p>sara@example.com</p>
          <p>Patient ID: PAT-12345</p>
        </div>
      </GlassCard>
    );
    expect(screen.getByText('Sara Al-Ahmed')).toBeInTheDocument();
    expect(screen.getByText('sara@example.com')).toBeInTheDocument();
  });

  it('renders profile tabs', () => {
    render(
      <div role="tablist">
        <button role="tab">Personal Info</button>
        <button role="tab">Medical History</button>
        <button role="tab">Notifications</button>
        <button role="tab">Settings</button>
      </div>
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveTextContent('Personal Info');
  });

  it('renders notification preferences with toggles', () => {
    render(
      <div>
        <label>Email Notifications</label>
        <MicroToggle checked={true} onChange={vi.fn()} />
        <label>SMS Notifications</label>
        <MicroToggle checked={false} onChange={vi.fn()} />
      </div>
    );
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
  });

  it('renders profile settings with progress', () => {
    render(
      <div>
        <MicroProgress value={80} label="Profile Completion" />
        <MicroHeart liked={true} onClick={vi.fn()} />
      </div>
    );
    expect(screen.getByText('Profile Completion')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('toggles notification setting', () => {
    const handleToggle = vi.fn();
    render(<MicroToggle checked={false} onChange={handleToggle} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it('renders medical history section', () => {
    render(
      <GlassCard variant="light">
        <h3>Medical History</h3>
        <ul>
          <li>Blood Type: A+</li>
          <li>Allergies: Penicillin</li>
          <li>Chronic Conditions: None</li>
        </ul>
      </GlassCard>
    );
    expect(screen.getByText('Blood Type: A+')).toBeInTheDocument();
    expect(screen.getByText('Allergies: Penicillin')).toBeInTheDocument();
  });
});
