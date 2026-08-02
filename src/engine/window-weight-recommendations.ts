import type { WindowWeightInput, WindowWeightResult } from './window-weight.js';

export interface WindowWeightRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type: 'handling' | 'installers' | 'vacuum-cups' | 'transport' | 'safety';
}

export interface WindowWeightRecommendationSet {
  handlingAdvice: string;
  transportationAdvice: string;
  storageAdvice: string;
  installationAdvice: string;
  safetyEquipment: string;
  recommendedInstallers: string;
  vacuumCupRecommendation: string;
  riskWarnings: string;
  nextSteps: string;
  items: WindowWeightRecommendationItem[];
}

export function buildWindowWeightRecommendations(
  input: WindowWeightInput,
  result: WindowWeightResult
): WindowWeightRecommendationSet {
  const kg = result.totalWindowWeightKg;
  const lbs = result.totalWindowWeightLbs;

  const installersStr = `${result.installersRequired} ${result.installersRequired === 1 ? 'Person' : 'People'} Required`;
  const installersTip = result.installersRequired === 1
    ? 'Under OSHA 55 lb (25 kg) limit — safe for single-person carrying.'
    : `OSHA 55 lb limit exceeded — minimum ${result.installersRequired}-person team required for safe lifting.`;

  const cupsStr = result.vacuumCupsRecommended > 0
    ? `${result.vacuumCupsRecommended} Suction Cups (${result.vacuumCupsRecommended * 50} kg / ${result.vacuumCupsRecommended * 110} lbs Capacity)`
    : 'Manual Grip Only';
  const cupsTip = result.vacuumCupsRecommended > 0
    ? 'Use 8" dual-vacuum suction cups positioned evenly near glass corners.'
    : 'Lightweight glass panel — manual edge grip sufficient.';

  const transMap: Record<string, { label: string; tip: string }> = {
    'standard-courier': { label: 'Standard Courier Delivery', tip: 'Parcel courier or personal vehicle transport' },
    'freight-skid': { label: 'Pallet Skid Freight', tip: 'Vertical A-frame rack or pallet skid truck delivery' },
    'crated-freight': { label: 'Wooden Crate Freight', tip: 'Reinforced wooden crate on LTL freight carrier' },
    'heavy-crane': { label: 'Heavy Crane & Glass Rigging', tip: 'Requires glass A-frame truck & crane hoist rigging' },
  };

  const transInfo = transMap[result.transportationCategory] ?? transMap['standard-courier'];

  const handlingAdvice = result.handlingDifficulty === 'easy'
    ? 'Single-person carry using standard glass safety gloves.'
    : (result.handlingDifficulty === 'moderate'
      ? 'Two-person team lift with cut-resistant gloves & wrist cuffs.'
      : 'Four-person team or mechanical suction lift required.');

  const storageAdvice = 'Store vertically leaning at a 5–7° angle against a padded rack. Never lay heavy glass flat on concrete.';
  const installationAdvice = 'Verify window opening header load capacity before setting heavy double or triple pane unit onto shims.';
  const safetyEquipment = 'Kevlar cut-resistant gloves, safety glasses, steel-toe boots, and glass suction cups.';

  const riskWarnings = result.warnings.map(w => w.message).join(' | ');
  const nextSteps = 'Confirm installation crew headcount and inspect vacuum suction cup rubber pads before lifting.';

  const items: WindowWeightRecommendationItem[] = [
    {
      title: 'HANDLING',
      body: result.handlingDifficulty.toUpperCase() + ' LIFT',
      tip: handlingAdvice,
      type: 'handling',
    },
    {
      title: 'INSTALLERS',
      body: installersStr,
      tip: installersTip,
      type: 'installers',
    },
    {
      title: 'VACUUM CUPS',
      body: cupsStr,
      tip: cupsTip,
      type: 'vacuum-cups',
    },
    {
      title: 'TRANSPORT',
      body: transInfo.label,
      tip: transInfo.tip,
      type: 'transport',
    },
    {
      title: 'SAFETY EQUIPMENT',
      body: 'Kevlar Gloves & Suction Cups',
      tip: safetyEquipment,
      type: 'safety',
    },
  ];

  return {
    handlingAdvice,
    transportationAdvice: transInfo.label,
    storageAdvice,
    installationAdvice,
    safetyEquipment,
    recommendedInstallers: installersStr,
    vacuumCupRecommendation: cupsStr,
    riskWarnings,
    nextSteps,
    items,
  };
}
