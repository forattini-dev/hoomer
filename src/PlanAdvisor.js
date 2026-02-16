import { CONFIG } from './config.js';
import { Geom } from './geometry.js';

const MIN_SIGNIFICANT_WALL_LENGTH_CM = 150;
const ENDPOINT_DEADBAND_LIMIT = 6;

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function flattenStories(app) {
  return asArray(app?.stories);
}

function terrainRect(app) {
  const w = toNumber(app?.terrainWidth, CONFIG.DEFAULT_TERRAIN_WIDTH);
  const h = toNumber(app?.terrainHeight, CONFIG.DEFAULT_TERRAIN_HEIGHT);
  const hw = w / 2;
  const hh = h / 2;
  if (app?.axisOrigin === 'center') {
    return { minX: -hw, maxX: hw, minY: -hh, maxY: hh };
  }
  return { minX: 0, maxX: w, minY: -h, maxY: 0 };
}

function collectStructureState(stories) {
  const storySummaries = [];
  let wallCount = 0;
  let floorCount = 0;
  let stairCount = 0;
  let doorCount = 0;
  let windowCount = 0;
  let labelCount = 0;

  const walls = [];

  for (let i = 0; i < stories.length; i += 1) {
    const story = stories[i] || {};
    const structure = story.layers?.structure || {};

    const storyWalls = asArray(structure.walls);
    const storyFloors = asArray(structure.floors);
    const storyStairs = asArray(structure.stairs);
    const storyDoors = asArray(structure.doors);
    const storyWindows = asArray(structure.windows);
    const storyLabels = asArray(structure.labels);

    wallCount += storyWalls.length;
    floorCount += storyFloors.length;
    stairCount += storyStairs.length;
    doorCount += storyDoors.length;
    windowCount += storyWindows.length;
    labelCount += storyLabels.length;

    walls.push(...storyWalls);

    storySummaries.push({
      index: i,
      name: story.name || `Story ${i}`,
      wallCount: storyWalls.length,
      floorCount: storyFloors.length,
      stairCount: storyStairs.length,
      doorCount: storyDoors.length,
      windowCount: storyWindows.length,
      labelCount: storyLabels.length,
      height: toNumber(story.storyHeight, CONFIG.DEFAULT_STORY_HEIGHT),
      slabThickness: toNumber(story.slabThickness, CONFIG.DEFAULT_SLAB_THICKNESS),
    });
  }

  return {
    storySummaries,
    wallCount,
    floorCount,
    stairCount,
    doorCount,
    windowCount,
    labelCount,
    walls,
  };
}

function detectTerrainViolations(walls, bounds) {
  const violations = [];
  for (const w of walls) {
    const x1 = toNumber(w.x1, NaN);
    const y1 = toNumber(w.y1, NaN);
    const x2 = toNumber(w.x2, NaN);
    const y2 = toNumber(w.y2, NaN);

    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
      violations.push('Existe uma parede com coordenadas inválidas.');
      continue;
    }

    if (
      x1 < bounds.minX || x1 > bounds.maxX || y1 < bounds.minY || y1 > bounds.maxY ||
      x2 < bounds.minX || x2 > bounds.maxX || y2 < bounds.minY || y2 > bounds.maxY
    ) {
      violations.push('Há elementos fora dos limites do lote.');
      break;
    }
  }
  return violations;
}

function detectConnectivityIssues(walls) {
  if (!walls.length) return [];

  const endpointMap = Geom.buildEndpointMap(walls, 1.5);
  let deadEnds = 0;
  let crossings = 0;

  endpointMap.forEach(joint => {
    if (joint.connections.length === 1) deadEnds += 1;
    if (joint.connections.length >= 3) crossings += 1;
  });

  const messages = [];
  if (deadEnds > ENDPOINT_DEADBAND_LIMIT) {
    messages.push(`Há ${deadEnds} extremidades de parede soltas. Revise circulações e fechamentos.`);
  }
  if (crossings === 0) {
    messages.push('Não foram encontrados nós com 3+ ligações (juntas). Considere revisar malha de circulação.');
  }
  return messages;
}

function detectQualityIssues(structure, app) {
  const issues = [];
  const warnings = [];
  const suggestions = [];

  if (!structure.wallCount) {
    issues.push('Não há paredes desenhadas. O projeto não possui contorno de ambiente.');
  }

  if (structure.floorCount > 0) {
    // intentionally avoid false positives for future complex floor workflows
    if (!structure.wallCount) {
      issues.push('Há pisos definidos sem paredes estruturais no mesmo pavimento.');
    }
  }

  const hasThinSlab = structure.storySummaries.some((story) => story.slabThickness < 8);
  if (app?.stories?.length > 1 && hasThinSlab) {
    warnings.push('Há laje com espessura abaixo de 8 cm.');
  }

  const shortWalls = structure.walls.filter((w) => toNumber(w.length, 0) < MIN_SIGNIFICANT_WALL_LENGTH_CM);
  if (shortWalls.length > 0) {
    warnings.push(`${shortWalls.length} parede(s) têm menos de ${MIN_SIGNIFICANT_WALL_LENGTH_CM} cm.`);
  }

  if (structure.storySummaries.some(s => s.height < 220)) {
    warnings.push('Existe pavimento com pé-direito abaixo de 2.20m.');
  }

  for (const story of structure.storySummaries) {
    if (story.wallCount && story.height > 500) {
      suggestions.push(`Pavimento "${story.name}" com pé-direito alto (${story.height} cm): confira conforto e acessibilidade.`);
      break;
    }
  }

  if (structure.wallCount > 0 && structure.doorCount === 0) {
    suggestions.push('Nenhuma porta adicionada. Considere inserir portas para circulação entre ambientes.');
  }

  const bounds = terrainRect(app);
  const terrainWarnings = detectTerrainViolations(structure.walls, bounds);
  if (terrainWarnings.length > 0) {
    issues.push(...terrainWarnings);
  }

  warnings.push(...detectConnectivityIssues(structure.walls));

  const issuesLen = issues.length;
  const warningsLen = warnings.length;
  let score = 100;
  score -= Math.min(45, issuesLen * 18);
  score -= Math.min(35, warningsLen * 4);
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    issueCount: issuesLen,
    warningCount: warningsLen,
    issues,
    warnings,
    suggestions,
    structure,
  };
}

export function analyzePlan(app) {
  const stories = flattenStories(app);
  const structure = collectStructureState(stories);
  const result = detectQualityIssues(structure, app);

  return {
    schemaVersion: 1,
    createdAt: Date.now(),
    projectName: app?.projectName || 'Untitled Project',
    storyCount: stories.length,
    ...result,
  };
}

export function formatPlanAdvice(result) {
  const lines = [];
  lines.push(`Pontuação do projeto: ${result.score}/100`);

  if (result.issues.length) {
    lines.push('');
    lines.push('Problemas críticos:');
    result.issues.forEach((item) => lines.push(`- ${item}`));
  }

  if (result.warnings.length) {
    lines.push('');
    lines.push('Atenções:');
    result.warnings.forEach((item) => lines.push(`- ${item}`));
  }

  if (result.suggestions.length) {
    lines.push('');
    lines.push('Sugestões (IA local):');
    result.suggestions.forEach((item) => lines.push(`- ${item}`));
  }

  if (!result.issues.length && !result.warnings.length && !result.suggestions.length) {
    lines.push('Nenhum ponto crítico encontrado.');
  }

  return lines.join('\n');
}
