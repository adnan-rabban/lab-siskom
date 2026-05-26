import { describe, it, expect } from 'vitest';
import { amModulationConfig } from './amModulation';

describe('AM Modulation procedure', () => {
  it('should connect the modulation input and oscilloscope before asking users to observe 50% AM', () => {
    const connectionsBeforeStep8 = amModulationConfig.procedure
      .filter(step => step.stepNumber <= 8)
      .flatMap(step => step.requiredConnections ?? []);

    expect(connectionsBeforeStep8).toContain('conn-funcgen-sig-mod');
    expect(connectionsBeforeStep8).toContain('conn-sig-scope-ch1');
    expect(connectionsBeforeStep8).toContain('conn-tuned-scope');
  });
});
