import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchSoilData, classifyUsdaTexture } from '../../src/services/soilGrids';
import { createUserProvidedClimateData, SOHAG_HISTORICAL_BENCHMARK } from '../../src/services/nasaPower';

describe('SmartCrop API Integration & Data Integrity Test Suite', () => {

  it('Integration: SOHAG historical benchmark contains verified agronomic values', () => {
    assert.strictEqual(SOHAG_HISTORICAL_BENCHMARK.latitude, 26.55);
    assert.strictEqual(SOHAG_HISTORICAL_BENCHMARK.longitude, 31.70);
    assert.strictEqual(SOHAG_HISTORICAL_BENCHMARK.sourceStatus, 'demo_mode');
    assert.ok(SOHAG_HISTORICAL_BENCHMARK.avgTemperatureC >= 24 && SOHAG_HISTORICAL_BENCHMARK.avgTemperatureC <= 26);
    assert.ok(SOHAG_HISTORICAL_BENCHMARK.referenceEt0Mm !== undefined && SOHAG_HISTORICAL_BENCHMARK.referenceEt0Mm > 1800);
    assert.strictEqual(SOHAG_HISTORICAL_BENCHMARK.avgRelativeHumidityPct, 38.5, 'Sohag benchmark RH must be verified 38.5%');
    assert.strictEqual(SOHAG_HISTORICAL_BENCHMARK.highHumidityDaysCount, 0);
  });

  it('Integration: User-provided climate builder processes custom inputs correctly', () => {
    const userClimate = createUserProvidedClimateData({
      latitude: -33.86,
      longitude: 151.20,
      locationName: 'Sydney Basin, Australia',
      avgTemperatureC: 18.2,
      maxTemperatureC: 32.5,
      minTemperatureC: 7.0,
      totalPrecipitationMm: 1200,
      avgRelativeHumidityPct: 68.0
    });

    assert.strictEqual(userClimate.sourceStatus, 'user_specified');
    assert.strictEqual(userClimate.hemisphere, 'southern');
    assert.strictEqual(userClimate.isSyntheticFallback, false);
    assert.ok(userClimate.referenceEt0Mm !== undefined && userClimate.referenceEt0Mm > 0);
    assert.strictEqual(userClimate.avgRelativeHumidityPct, 68.0);
    assert.ok(userClimate.summerAvgRhPct !== undefined && userClimate.winterAvgRhPct !== undefined);
  });

  it('Integration: Soil fallback on network isolation produces realistic soil profile with USDA classification', async () => {
    const profile = await fetchSoilData(26.55, 31.70, 'clay_loam');

    assert.ok(profile.soilType !== undefined);
    assert.ok(profile.ph >= 3.5 && profile.ph <= 10.5);
    assert.ok(profile.organicMatterPct >= 0.1 && profile.organicMatterPct <= 15.0);
    assert.strictEqual(profile.salinitySource, 'unavailable', 'SoilGrids does not provide electrical conductivity salinity data');
    assert.ok(['soilgrids_live', 'regional_swri_benchmark', 'global_usda_texture_model', 'user_specified'].includes(profile.source));
  });

  it('Integration: USDA Soil Texture Triangle edge-cases', () => {
    // Heavy clay / silty clay
    const heavyClay = classifyUsdaTexture(45, 15, 40);
    assert.strictEqual(heavyClay, 'silty_clay');

    // High pure sand (90% sand, 3% clay, 7% silt) -> silt + 1.5*clay = 11.5 < 15 -> 'sandy'
    assert.strictEqual(classifyUsdaTexture(3, 90, 7), 'sandy');

    // Sandy loam (15% clay, 65% sand, 20% silt)
    assert.strictEqual(classifyUsdaTexture(15, 65, 20), 'sandy_loam');

    // Balanced clay loam (32% clay, 34% sand, 34% silt)
    assert.strictEqual(classifyUsdaTexture(32, 34, 34), 'clay_loam');
  });

});
