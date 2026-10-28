import { it, expect } from 'vitest';
import { supportVarietyFixture } from '../e2e/variety-fixture';
import { boundWorkCard, followUpWork } from '../src/ui/mission-panels';

it('paid work briefs keep committed duration and never ask to replace lost staff or repay supplies', () => {
  for (const fantasy of [false, true]) {
    const { game, paid, work } = supportVarietyFixture(fantasy);
    paid.crew.forEach((member) => (member.life = 'dead'));
    paid.inventory = {};
    const before = structuredClone(paid);
    const html = boundWorkCard(
      game,
      paid,
      work.id,
      () => '<button disabled>Paid order</button>',
      'Support work',
    );
    expect(html).toContain('Work in progress');
    expect(html).toContain('Supplies and participants are already committed');
    expect(html).toContain(`Field work: ${paid.support!.total}s real`);
    expect(html).not.toContain('Work supplies:');
    expect(html).not.toContain('Team requirements:');
    expect(html).not.toContain('Recruit 1');
    expect(paid).toEqual(before);
  }
});

it('completed work retains a return receipt rather than a replayable dispatch card', () => {
  for (const fantasy of [false, true]) {
    const { game, completed } = supportVarietyFixture(fantasy);
    const html = followUpWork(game, completed, () => {
      throw Error('Completed work must not render a dispatch control');
    });
    expect(html).toContain('Work complete');
    expect(html).toContain('Field work complete');
    expect(html).toContain('Plot route to hub');
    expect(html).not.toContain('Work supplies:');
  }
});
