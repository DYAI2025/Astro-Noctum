import type { Meta, StoryObj } from '@storybook/react';
import FusionRing3D from '../FusionRing3D';
import { useFusionRingMock } from './useFusionRingMock';

const meta: Meta<typeof FusionRing3D> = {
  title: 'Bazodiac/FusionRing3D',
  component: FusionRing3D,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof FusionRing3D>;

const Template = (args: any) => {
  const mockOverride = useFusionRingMock(args.profile);
  return <FusionRing3D {...args} signalOverride={mockOverride} />;
};

// ==================== 4 PROFILE ====================
export const FeuerProfil: Story = {
  render: Template,
  args: { profile: 'feuer' },
  name: '🔥 Feuer (starke Peaks)',
};

export const WasserProfil: Story = {
  render: Template,
  args: { profile: 'wasser' },
  name: '🌊 Wasser (tief & fließend)',
};

export const ErdeProfil: Story = {
  render: Template,
  args: { profile: 'erde' },
  name: '🌍 Erde (stabil & symmetrisch)',
};

export const GemischtProfil: Story = {
  render: Template,
  args: { profile: 'gemischt' },
  name: '🌌 Gemischt (komplex & dynamisch)',
};
