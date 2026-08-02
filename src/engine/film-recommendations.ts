import type { FilmType, FilmInput, FilmResult, FilmOrientation, FilmClimate, FilmGlassType } from './film.js';
import { FILM_TYPE_DATA } from './film.js';

export interface FilmRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type: 'film-type' | 'roll-size' | 'solar' | 'installation' | 'care' | 'safety';
}

export interface FilmRecommendationSet {
  recommendedFilmType: FilmType;
  recommendedRollWidth: string;
  installationAdvice: string;
  cleaningAdvice: string;
  expectedLifespan: string;
  suitableClimate: string;
  energySavings: string;
  professionalInstallRecommendation: string;
  warnings: string;
  nextSteps: string;
  items: FilmRecommendationItem[];
}

export function suggestFilmType(
  orientation: FilmOrientation,
  climate: FilmClimate,
  glassType: FilmGlassType
): FilmType {
  if (climate === 'hot' || orientation === 'south' || orientation === 'west') {
    return glassType === 'double-pane' ? 'heat-control' : 'reflective';
  }
  return 'uv-protection';
}

export function buildFilmRecommendations(input: FilmInput, result: FilmResult): FilmRecommendationSet {
  const recFilm = suggestFilmType(input.orientation, input.climate, input.glassType);
  const spec = FILM_TYPE_DATA[input.filmType] ?? FILM_TYPE_DATA.privacy;

  const rollWidthInches = Math.round(result.requiredRollWidthMm / 25.4);
  const rollWidthStr = `${rollWidthInches}" Roll Width (${result.requiredRollWidthMm} mm)`;

  const installationAdvice = result.installationDifficulty === 'easy'
    ? 'Easy DIY wet-application using soapy water solution & rubber squeegee'
    : (result.installationDifficulty === 'moderate'
      ? 'Moderate DIY — requires careful edge trimming with snap-off utility knife'
      : 'Professional installation recommended for thick security film or multi-story glass');

  const cleaningAdvice = 'Use non-abrasive microfiber cloth and mild soapy water. Avoid ammonia-based Windex cleaners.';
  const expectedLifespan = `${spec.expectedLifespanYears} years interior durability under direct solar exposure.`;
  const suitableClimate = input.climate === 'hot' ? 'High Solar Heat Control Zone' : 'Moderate Sun Protection Zone';

  const energySavings = result.heatReductionPercent > 50
    ? `Reduces solar heat gain up to ${result.heatReductionPercent}%, cutting summer AC electric bills by 15–25%.`
    : `Blocks ${result.uvProtectionPercent}% harmful UV rays to prevent furniture & flooring sun fading.`;

  const proRec = result.installationDifficulty === 'professional'
    ? 'Professional installation strongly recommended for clean optical clarity & seal warranty.'
    : 'Self-installation easily completed with basic window application kit.';

  const items: FilmRecommendationItem[] = [
    {
      title: 'FILM TYPE',
      body: spec.displayName,
      tip: `VLT ${spec.vltPercent}% · UV Block ${spec.uvBlockPercent}% · Heat Cut ${result.heatReductionPercent}%`,
      type: 'film-type',
    },
    {
      title: 'ROLL SIZE',
      body: rollWidthStr,
      tip: `Cut size: ${Math.round(result.filmWidthMm / 25.4)}" × ${Math.round(result.filmHeightMm / 25.4)}" (includes 1" trim margin)`,
      type: 'roll-size',
    },
    {
      title: 'SOLAR & ENERGY',
      body: energySavings,
      tip: `Glare reduction: ${spec.glareReductionPercent}% · Privacy rating: ${spec.privacyRating}/10`,
      type: 'solar',
    },
    {
      title: 'INSTALLATION',
      body: result.installationDifficulty === 'easy' ? 'Easy Wet DIY' : (result.installationDifficulty === 'moderate' ? 'Moderate DIY' : 'Professional'),
      tip: installationAdvice,
      type: 'installation',
    },
    {
      title: 'CARE & MAINTENANCE',
      body: `Lifespan ${spec.expectedLifespanYears} Years`,
      tip: cleaningAdvice,
      type: 'care',
    },
  ];

  if (result.warnings.length > 0) {
    items.push({
      title: 'SAFETY',
      body: result.warnings[0].message,
      tip: 'Verify window glass seal warranty before applying heat-absorbing interior film.',
      type: 'safety',
    });
  }

  return {
    recommendedFilmType: recFilm,
    recommendedRollWidth: rollWidthStr,
    installationAdvice,
    cleaningAdvice,
    expectedLifespan,
    suitableClimate,
    energySavings,
    professionalInstallRecommendation: proRec,
    warnings: result.warnings.map(w => w.message).join(' | '),
    nextSteps: 'Clean window glass thoroughly with squeegee before peeling adhesive backing film.',
    items,
  };
}
