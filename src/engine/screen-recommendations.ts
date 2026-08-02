import type { ScreenFrameType, ScreenMeshType, ScreenInput, ScreenResult } from './screen.js';

export interface ScreenRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type: 'mount' | 'frame-type' | 'mesh-type' | 'installation' | 'ordering' | 'safety';
}

export interface ScreenRecommendationSet {
  recommendedMesh: ScreenMeshType;
  recommendedFrame: ScreenFrameType;
  petFriendly: boolean;
  insectProtection: string;
  solarProtection: string;
  durability: string;
  diyRecommendation: string;
  professionalRecommendation: string;
  orderingRecommendation: string;
  safetyNotes: string;
  items: ScreenRecommendationItem[];
}

export function suggestMeshType(windowWidthMm: number, windowHeightMm: number): ScreenMeshType {
  if (windowWidthMm > 1524 || windowHeightMm > 1828) return 'pet-screen'; // Large screen benefits from tear resistance
  return 'fiberglass';
}

export function suggestFrameType(windowWidthMm: number, windowHeightMm: number): ScreenFrameType {
  if (windowWidthMm > 1828) return 'fiberglass'; // Heavy duty rigid frame
  return 'aluminum';
}

export function buildScreenRecommendations(input: ScreenInput, result: ScreenResult): ScreenRecommendationSet {
  const recMesh = suggestMeshType(input.windowWidthMm, input.windowHeightMm);
  const recFrame = suggestFrameType(input.windowWidthMm, input.windowHeightMm);

  const petFriendly = input.meshType === 'pet-screen' || input.meshType === 'stainless-steel';
  const insectProtection = input.meshType === 'stainless-steel' ? 'Maximum micro-mesh barrier' : 'Standard 18x16 insect barrier';
  const solarProtection = input.meshType === 'solar-screen' ? 'Blocks up to 80% solar heat & UV rays' : 'Standard 30% solar reduction';
  const durability = input.meshType === 'pet-screen' ? '7x stronger than fiberglass (tear proof)' : 'Standard flexibility & long life';

  const diyRecommendation = result.installationDifficulty === 'easy'
    ? 'Ideal DIY project — simple frame assembly & spline roller tool'
    : 'Moderate DIY project — requires careful frame corner alignment';

  const professionalRecommendation = result.installationDifficulty === 'professional'
    ? 'Professional installation recommended for custom wood or security steel frames'
    : 'Self-assembly easily completed with standard hand tools';

  let orderingNote = 'Custom screen frame required';
  let orderingTip = 'Specialty window dimensions require custom frame kit';
  if (result.orderingRecommendation === 'exact') {
    orderingNote = 'Order Exact Size';
    orderingTip = 'Standard factory frame size matches opening directly';
  } else if (result.orderingRecommendation === 'next-stock') {
    orderingNote = 'Order Next Stock Size';
    orderingTip = 'Fits with standard mounting clips & tension springs';
  } else if (result.orderingRecommendation === 'trim') {
    orderingNote = 'Trim Stock Frame to Fit';
    orderingTip = 'Stock screen frame kit can be cut to exact width';
  }

  const mountText = input.mountType === 'standard' ? 'Standard Clip Mount' : (input.mountType === 'flush' ? 'Flush Track Fit' : 'Recessed Frame Fit');
  const mountTip = input.mountType === 'standard'
    ? 'Allows 3/8" frame clearance for standard plunger latches'
    : 'Direct track slide fit with minimal frame gap';

  const formatName = (str: string) => str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

  const meshTips: Record<ScreenMeshType, string> = {
    'fiberglass': 'Most popular, budget-friendly, pliable, easy DIY installation',
    'aluminum': 'Durable metal wire mesh, sag-resistant, classic architectural look',
    'pet-screen': 'Heavy-duty vinyl coated polyester, 7x stronger, resists dog/cat claws',
    'solar-screen': 'Blocks sun glare & heat gain, lowers summer AC cooling costs',
    'stainless-steel': 'Maximum security protection, impervious to damage & rodents',
  };

  const frameTips: Record<ScreenFrameType, string> = {
    'aluminum': 'Standard lightweight extruded aluminum, rustproof & durable',
    'vinyl': 'Low maintenance vinyl profile, color-matched to vinyl windows',
    'fiberglass': 'Rigid high-strength composite, minimal flex on wide spans',
    'wood': 'Classic stained/painted timber frame for historic home preservation',
  };

  const items: ScreenRecommendationItem[] = [
    {
      title: 'MOUNT',
      body: mountText,
      tip: mountTip,
      type: 'mount',
    },
    {
      title: 'FRAME TYPE',
      body: formatName(input.frameType),
      tip: frameTips[input.frameType] ?? 'Durable screen frame profile',
      type: 'frame-type',
    },
    {
      title: 'MESH TYPE',
      body: formatName(input.meshType),
      tip: meshTips[input.meshType] ?? 'Insect protection mesh',
      type: 'mesh-type',
    },
    {
      title: 'ORDERING',
      body: orderingNote,
      tip: orderingTip,
      type: 'ordering',
    },
    {
      title: 'INSTALLATION',
      body: result.installationDifficulty === 'easy' ? 'Easy DIY' : (result.installationDifficulty === 'moderate' ? 'Moderate DIY' : 'Professional'),
      tip: diyRecommendation,
      type: 'installation',
    },
  ];

  if (petFriendly) {
    items.push({
      title: 'SAFETY',
      body: 'Pet & Tear Resistant',
      tip: 'Heavy-duty weave prevents claw tears & pet punctures',
      type: 'safety',
    });
  }

  return {
    recommendedMesh: recMesh,
    recommendedFrame: recFrame,
    petFriendly,
    insectProtection,
    solarProtection,
    durability,
    diyRecommendation,
    professionalRecommendation,
    orderingRecommendation: orderingNote,
    safetyNotes: 'Always verify window screen plunger pin positions before final ordering.',
    items,
  };
}
