import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  VERIFIED_CROP_IMAGES, 
  getVerifiedCropImage, 
  getCropSvgPlaceholder,
  CROP_CATEGORY_COLORS 
} from '../../src/data/cropImages';
import { CROP_IMAGES_MAP, getCropImageUrl, getCropSvgFallback } from '../../src/data/agriImages';
import { CROPS_DATABASE } from '../../src/data/crops';

describe('Galaxy Planters — Crop Photography & Rotation Timeline Verification', () => {

  describe('Crop Image Registry Integrity (All 30 Crops + Fallow)', () => {
    it('contains verified photography records for all 30 crops in the database', () => {
      const dbCropIds = Object.keys(CROPS_DATABASE);
      assert.strictEqual(dbCropIds.length, 30, 'Crops database must contain 30 crops');

      for (const cropId of dbCropIds) {
        const record = VERIFIED_CROP_IMAGES[cropId];
        assert.ok(record, `Crop ID "${cropId}" must exist in VERIFIED_CROP_IMAGES`);
        assert.ok(record.imagePath.startsWith('/images/crops/'), `Crop "${cropId}" must have local public image path`);
        assert.ok(record.url.startsWith('https://'), `Crop "${cropId}" must have valid HTTPS primary image URL`);
        assert.ok(record.secondaryUrl.startsWith('https://'), `Crop "${cropId}" must have valid HTTPS secondary image URL`);
        assert.ok(record.imageLicense.length > 0, `Crop "${cropId}" must specify image license`);
        assert.ok(record.nameEn.length > 0, `Crop "${cropId}" must have English name`);
        assert.ok(record.nameAr.length > 0, `Crop "${cropId}" must have Arabic name`);
        assert.ok(record.scientificName.length > 0, `Crop "${cropId}" must have scientific name`);
        assert.ok(record.altEn.length > 0, `Crop "${cropId}" must have English alt text`);
        assert.ok(record.altAr.length > 0, `Crop "${cropId}" must have Arabic alt text`);
        assert.ok(record.sourceAttribution.length > 0, `Crop "${cropId}" must have source attribution`);
        assert.ok(record.plantPartDepicted.length > 0, `Crop "${cropId}" must specify plant part depicted`);
      }
    });

    it('contains summer fallow rest period entry', () => {
      const fallowRecord = VERIFIED_CROP_IMAGES.fallow;
      assert.ok(fallowRecord, 'Fallow entry must exist in registry');
      assert.strictEqual(fallowRecord.category, 'fallow');
      assert.ok(fallowRecord.imagePath.startsWith('/images/crops/'));
      assert.ok(fallowRecord.url.startsWith('https://'));
    });

    it('gracefully handles missing crop IDs with wheat fallback in getVerifiedCropImage', () => {
      const fallback = getVerifiedCropImage('non_existent_crop');
      assert.ok(fallback, 'Must return a valid record');
      assert.strictEqual(fallback.cropId, 'wheat', 'Must fallback to wheat');

      const validWheat = getVerifiedCropImage('wheat');
      assert.strictEqual(validWheat.cropId, 'wheat');
    });

    it('generates crisp SVG placeholders containing the crop name and SVG tags', () => {
      const svgUri = getCropSvgPlaceholder('Durum Wheat', 'cereal');
      assert.ok(svgUri.startsWith('data:image/svg+xml;utf8,'), 'Must return data URI');
      const decodedSvg = decodeURIComponent(svgUri);
      assert.ok(decodedSvg.includes('<svg'), 'Must contain SVG opening tag');
      assert.ok(decodedSvg.includes('Durum Wheat'), 'Must contain embedded crop name');
      assert.ok(decodedSvg.includes('Galaxy Planters'), 'Must contain Galaxy Planters watermark');
    });

    it('maps all categories to distinct color schemes', () => {
      const categories = ['cereal', 'legume', 'oilseed', 'vegetable', 'fiber', 'sugar', 'forage', 'industrial', 'fallow'];
      for (const cat of categories) {
        assert.ok(CROP_CATEGORY_COLORS[cat], `Category "${cat}" must have a designated color theme`);
        assert.ok(CROP_CATEGORY_COLORS[cat].bg.startsWith('#'), `Category "${cat}" must have valid hex background color`);
      }
    });
  });

  describe('Backwards Compatibility with CROP_IMAGES_MAP', () => {
    it('mirrors all 30 crops into CROP_IMAGES_MAP', () => {
      const cropIds = Object.keys(CROPS_DATABASE);
      for (const id of cropIds) {
        assert.ok(CROP_IMAGES_MAP[id], `CROP_IMAGES_MAP must contain crop "${id}"`);
        assert.ok(CROP_IMAGES_MAP[id].url.length > 0);
        assert.ok(CROP_IMAGES_MAP[id].altEn.length > 0);
        assert.ok(CROP_IMAGES_MAP[id].altAr.length > 0);
      }
    });

    it('returns high-resolution URLs via getCropImageUrl', () => {
      const wheatUrl = getCropImageUrl('wheat');
      assert.ok(wheatUrl.startsWith('https://'));

      const unknownUrl = getCropImageUrl('unknown_species');
      assert.ok(unknownUrl.startsWith('https://'));
    });

    it('returns SVG fallback via getCropSvgFallback', () => {
      const fallback = getCropSvgFallback('Barley', 'cereal');
      assert.ok(fallback.startsWith('data:image/svg+xml;utf8,'));
      assert.ok(decodeURIComponent(fallback).includes('Barley'));
    });
  });

});
