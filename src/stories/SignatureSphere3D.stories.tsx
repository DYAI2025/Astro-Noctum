import type { Meta, StoryObj } from '@storybook/react';
import { SignatureSphere3D } from '@/src/components/signatur-3d/SignatureSphere3D';

const meta: Meta<typeof SignatureSphere3D> = {
  title: 'Signatur 3D/Wuxing Surfaces',
  component: SignatureSphere3D,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '480px', height: '480px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SignatureSphere3D>;

const SAMPLE_WEIGHTS = {
  Sun: 0.65, Moon: 0.45, Mercury: 0.30, Venus: 0.50,
  Mars: 0.55, Jupiter: 0.40, Saturn: 0.35, Uranus: 0.25,
  Neptune: 0.30, Pluto: 0.20,
};

export const FireDark: Story = {
  args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Fire', planetariumMode: true },
};

export const EarthDark: Story = {
  args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Earth', planetariumMode: true },
};

export const WoodDark: Story = {
  args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Wood', planetariumMode: true },
};

export const MetalDark: Story = {
  args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Metal', planetariumMode: true },
};

export const WaterDark: Story = {
  args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Water', planetariumMode: true },
};

export const FireBright: Story = {
  args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Fire', planetariumMode: false },
};

export const WaterBright: Story = {
  args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Water', planetariumMode: false },
};
