import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../../src/services/auth';
import { dbService } from '../../src/services/database';
import type { 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  SoilData, 
  RotationPlan, 
  FarmRecord, 
  SavedPlanRecord 
} from '../../src/types';

describe('SmartCrop Farmer Platform: Authentication, Farm Management & Saved Plans', () => {

  const dummyAssessmentInput: FarmAssessmentInput = {
    districtId: 'custom',
    latitude: 26.55,
    longitude: 31.70,
    locationName: 'Sohag Test Field',
    soilType: 'clay_loam',
    soilPh: 7.8,
    organicMatterPct: 1.5,
    soilSalinityEC: 1.2,
    irrigationAvailability: 'medium',
    farmerPriority: 'water_conservation',
    previousCrop: 'fallow'
  };

  const dummyClimate: NasaPowerClimateData = {
    latitude: 26.55,
    longitude: 31.70,
    hemisphere: 'northern',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    dataPointsCount: 366,
    avgTemperatureC: 24.5,
    maxTemperatureC: 42.0,
    minTemperatureC: 7.0,
    totalPrecipitationMm: 15.0,
    avgSolarRadiationMj: 21.0,
    estimatedGDD: 3800,
    summerAvgTempC: 33.0,
    winterAvgTempC: 16.5,
    sourceStatus: 'live_api',
    fetchedAt: new Date().toISOString()
  };

  const dummySoil: SoilData = {
    soilType: 'clay_loam',
    ph: 7.8,
    organicMatterPct: 1.5,
    salinityEC: 1.2,
    source: 'user_specified',
    uncertaintyLevel: 'low'
  };

  const dummyPlan: RotationPlan = {
    id: 'test-plan-101',
    titleEn: 'Wheat-Legume Resilient Cycle',
    titleAr: 'دورة القمح والبقوليات المستدامة',
    taglineEn: 'Optimized for water conservation and nitrogen replenishment',
    taglineAr: 'محسنة لترشيد المياه وتثبيت النيتروجين الطبيعي',
    strategicFocusEn: 'Balanced agronomic rotation',
    strategicFocusAr: 'تعاقب زراعي متوازن',
    overallScore: 89,
    rank: 1,
    twoYearWaterEfficiencyScore: 92,
    soilHealthBenefitScore: 88,
    climateResilienceScore: 90,
    economicStabilityScore: 86,
    totalWaterDemandMm: 1250,
    netNitrogenBalanceKgHa: 45,
    soilHealthBenefitTier: 'high',
    climateResilienceRating: 'high',
    economicRiskProfile: 'low',
    steps: [
      {
        cropId: 'wheat',
        season: 'winter',
        year: 1,
        seasonLabelEn: 'Year 1 - Winter',
        seasonLabelAr: 'السنة الأولى - شتوي',
        crop: {
          id: 'wheat',
          nameEn: 'Bread Wheat',
          nameAr: 'قمح الخبز',
          scientificName: 'Triticum aestivum',
          family: 'Poaceae',
          cropCategory: 'cereal',
          season: 'winter',
          growthDurationDaysMin: 140,
          growthDurationDaysMax: 160,
          waterRequirementMm: 450,
          nitrogenContributionKgHa: -80,
          soilSalinityToleranceECe: 6.0,
          irrigationWaterSalinityMaxECw: 4.0,
          preferredSoilTextures: ['clay_loam'],
          minTemperatureC: 4,
          maxTemperatureC: 32,
          optimalTempMinC: 15,
          optimalTempMaxC: 22,
          marketLiquidityTier: 'high',
          economicMarginTier: 'medium'
        },
        recommendedVariety: {
          varietyName: 'Giza 171',
          commercialAvailability: 'high',
          breederInstitution: 'ARC Egypt',
          daysToMaturity: 150,
          yieldPotentialKgHa: 7500,
          heatToleranceTier: 'high',
          droughtToleranceTier: 'moderate',
          salinityToleranceECe: 5.5,
          diseaseResistance: ['Stem Rust', 'Leaf Rust'],
          rationaleEn: 'Excellent regional adaptation',
          rationaleAr: 'ملاءمة ممتازة للظروف المحلية'
        },
        waterEstimateMm: 450,
        nitrogenContributionKg: -80,
        agronomicNotesEn: 'High yielding grain crop',
        agronomicNotesAr: 'محصول حبوب عالي الإنتاجية'
      }
    ],
    whyItFitsEn: 'Matches soil texture and low water budget',
    whyItFitsAr: 'يطابق قوام التربة والميزانية المائية',
    rotationRationaleEn: 'Protects soil health',
    rotationRationaleAr: 'يحافظ على خصوبة التربة',
    limitationsEn: ['Requires punctual sowing'],
    limitationsAr: ['يتطلب الالتزام بموعد الزراعة'],
    dataSourcesAndUncertaintiesEn: ['NASA POWER', 'SoilGrids'],
    dataSourcesAndUncertaintiesAr: ['ناسا باور', 'سويل جريدز']
  };

  // --------------------------------------------------------------------------
  // 1. User Registration & Validation
  // --------------------------------------------------------------------------
  describe('User Registration & Credentials Validation', () => {
    it('successfully registers a new farmer profile with valid credentials', async () => {
      const email = `farmer_${Date.now()}@smartcrop.test`;
      const res = await authService.register({
        fullName: 'Mahmoud El-Sayed',
        email,
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        country: 'Egypt',
        city: 'Sohag'
      });

      assert.ok(res.user.id);
      assert.strictEqual(res.user.fullName, 'Mahmoud El-Sayed');
      assert.strictEqual(res.user.email, email.toLowerCase());
      assert.strictEqual(res.user.country, 'Egypt');
      assert.strictEqual(res.user.city, 'Sohag');
      const currentSession = authService.getCurrentSession();
      assert.ok(currentSession?.token);
    });

    it('rejects registration with mismatched passwords', async () => {
      await assert.rejects(
        async () => {
          await authService.register({
            fullName: 'Test Farmer',
            email: 'test_mismatch@smartcrop.test',
            password: 'Password123!',
            confirmPassword: 'DifferentPassword456!',
            country: 'Egypt',
            city: 'Akhmim'
          });
        },
        { message: /do not match/i }
      );
    });

    it('rejects registration with passwords shorter than 8 characters', async () => {
      await assert.rejects(
        async () => {
          await authService.register({
            fullName: 'Test Short',
            email: 'test_short@smartcrop.test',
            password: 'short',
            confirmPassword: 'short',
            country: 'Egypt',
            city: 'Girga'
          });
        },
        { message: /at least 8 characters/i }
      );
    });

    it('rejects registration with invalid email formats', async () => {
      await assert.rejects(
        async () => {
          await authService.register({
            fullName: 'Bad Email',
            email: 'not-an-email',
            password: 'ValidPassword123!',
            confirmPassword: 'ValidPassword123!',
            country: 'Jordan',
            city: 'Amman'
          });
        },
        { message: /valid email address/i }
      );
    });

    it('prevents duplicate account registration for the same email address', async () => {
      const duplicateEmail = `duplicate_${Date.now()}@smartcrop.test`;
      await authService.register({
        fullName: 'Original Farmer',
        email: duplicateEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        country: 'Morocco',
        city: 'Fes'
      });

      await assert.rejects(
        async () => {
          await authService.register({
            fullName: 'Imposter Farmer',
            email: duplicateEmail.toUpperCase(), // Test case insensitivity
            password: 'Password999!',
            confirmPassword: 'Password999!',
            country: 'Morocco',
            city: 'Fes'
          });
        },
        { message: /already exists/i }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2. User Authentication, Session Persistence & Logout
  // --------------------------------------------------------------------------
  describe('Authentication & Session Management', () => {
    const userEmail = `login_test_${Date.now()}@smartcrop.test`;
    const password = 'CorrectPassword2026!';

    it('authenticates valid credentials and rejects incorrect passwords', async () => {
      await authService.register({
        fullName: 'Login Test User',
        email: userEmail,
        password,
        confirmPassword: password,
        country: 'Tunisia',
        city: 'Sousse'
      });

      // Wrong password should throw
      await assert.rejects(
        async () => {
          await authService.login(userEmail, 'WrongPassword!');
        },
        { message: /invalid/i }
      );

      // Correct password should succeed
      const loggedUser = await authService.login(userEmail, password);
      assert.strictEqual(loggedUser.email, userEmail.toLowerCase());
      assert.strictEqual(loggedUser.fullName, 'Login Test User');

      // Logout clears session
      await authService.logout();
      assert.strictEqual(authService.getCurrentSession(), null);
    });

    it('handles password reset request for registered accounts', async () => {
      const resetSuccess = await authService.requestPasswordReset(userEmail);
      assert.strictEqual(resetSuccess, true);

      // Safe enumeration protection: returns true for non-existent emails
      const safeEnumeration = await authService.requestPasswordReset('nobody@smartcrop.test');
      assert.strictEqual(safeEnumeration, true);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Farm Profile Management (CRUD)
  // --------------------------------------------------------------------------
  describe('Farm Profile Management (CRUD)', () => {
    let testUser: { id: string };

    it('creates, reads, updates, and deletes farm records', async () => {
      const reg = await authService.register({
        fullName: 'Farm Owner',
        email: `farm_owner_${Date.now()}@smartcrop.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        country: 'Egypt',
        city: 'Tahta'
      });
      testUser = reg.user;

      // 1. Create Farm
      const newFarm = await dbService.createFarm({
        userId: testUser.id,
        farmName: 'Al-Baraka Nile Field',
        latitude: 26.77,
        longitude: 31.50,
        country: 'Egypt',
        region: 'Tahta, Sohag',
        farmArea: 10.5,
        areaUnit: 'feddan',
        soilType: 'clay_loam',
        soilPh: 7.6,
        organicMatterPct: 1.8,
        soilSalinityEC: 1.1,
        irrigationAvailability: 'high',
        irrigationMethod: 'surface_furrow',
        irrigationWaterSalinityECw: 0.8,
        farmerPriority: 'soil_health',
        previousCrop: 'faba_bean',
        notes: 'Adjacent to main canal'
      });

      assert.ok(newFarm.id);
      assert.strictEqual(newFarm.farmName, 'Al-Baraka Nile Field');
      assert.strictEqual(newFarm.farmArea, 10.5);
      assert.strictEqual(newFarm.soilPh, 7.6);

      // 2. Read Farms List
      const farmsList = await dbService.getFarms(testUser.id);
      assert.strictEqual(farmsList.length, 1);
      assert.strictEqual(farmsList[0].id, newFarm.id);

      // 3. Update Farm
      const updatedFarm = await dbService.updateFarm(testUser.id, newFarm.id, {
        farmArea: 12.0,
        soilPh: 7.4,
        notes: 'Expanded parcel after canal lining'
      });
      assert.strictEqual(updatedFarm.farmArea, 12.0);
      assert.strictEqual(updatedFarm.soilPh, 7.4);
      assert.strictEqual(updatedFarm.notes, 'Expanded parcel after canal lining');

      // 4. Delete Farm
      await dbService.deleteFarm(testUser.id, newFarm.id);
      const remainingFarms = await dbService.getFarms(testUser.id);
      assert.strictEqual(remainingFarms.length, 0);
    });

    it('enforces user ownership isolation: User A cannot modify User B farm', async () => {
      const userA = await authService.register({
        fullName: 'User A',
        email: `usera_${Date.now()}@smartcrop.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        country: 'Egypt',
        city: 'Sohag'
      });

      const userB = await authService.register({
        fullName: 'User B',
        email: `userb_${Date.now()}@smartcrop.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        country: 'Egypt',
        city: 'Girga'
      });

      const farmA = await dbService.createFarm({
        userId: userA.user.id,
        farmName: 'Farm of User A',
        latitude: 26.55,
        longitude: 31.70,
        country: 'Egypt',
        region: 'Sohag',
        farmArea: 5,
        areaUnit: 'feddan',
        soilType: 'clay_loam',
        irrigationAvailability: 'medium',
        farmerPriority: 'water_conservation'
      });

      // User B trying to access User A's farm should fail
      const farmFoundByB = await dbService.getFarmById(userB.user.id, farmA.id);
      assert.strictEqual(farmFoundByB, null);

      await assert.rejects(
        async () => {
          await dbService.updateFarm(userB.user.id, farmA.id, { farmName: 'Hacked Farm' });
        },
        { message: /not found or unauthorized/i }
      );

      await assert.rejects(
        async () => {
          await dbService.deleteFarm(userB.user.id, farmA.id);
        },
        { message: /not found or unauthorized/i }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. Saved Plan Snapshots, Immutability & Duplication
  // --------------------------------------------------------------------------
  describe('Saved Agricultural Plans: Full Snapshot Persistence & Immutability', () => {
    let testUser: { id: string };
    let savedPlan: SavedPlanRecord;

    it('saves a full agricultural plan snapshot with inputs, climate, and seed varieties', async () => {
      const reg = await authService.register({
        fullName: 'Plan Saver',
        email: `plan_saver_${Date.now()}@smartcrop.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        country: 'Egypt',
        city: 'Akhmim'
      });
      testUser = reg.user;

      savedPlan = await dbService.savePlan({
        userId: testUser.id,
        farmName: 'Akhmim Reclaimed Parcel',
        planName: 'Autumn 2026 Resilient Wheat Rotation',
        userNotes: 'Verify certified Giza 171 seeds from agriculture cooperative',
        planSnapshot: dummyPlan,
        originalInputs: dummyAssessmentInput,
        soilDataSnapshot: dummySoil,
        climateDataSnapshot: dummyClimate,
        recommendationVersion: 'v2.1-global-fao56'
      });

      assert.ok(savedPlan.id);
      assert.strictEqual(savedPlan.planName, 'Autumn 2026 Resilient Wheat Rotation');
      assert.strictEqual(savedPlan.planSnapshot.overallScore, 89);
      assert.strictEqual(savedPlan.planSnapshot.steps[0].recommendedVariety?.varietyName, 'Giza 171');
      assert.strictEqual(savedPlan.originalInputs.soilType, 'clay_loam');
    });

    it('preserves snapshot immutability: external changes do not mutate the saved record', async () => {
      // Mutate local dummy object
      dummyPlan.overallScore = 40;
      dummyPlan.titleEn = 'Mutated Title';

      // Retrieve plan from storage
      const fetched = await dbService.getPlan(savedPlan.id);
      assert.ok(fetched);
      assert.strictEqual(fetched.planSnapshot.overallScore, 89);
      assert.strictEqual(fetched.planSnapshot.titleEn, 'Wheat-Legume Resilient Cycle');
    });

    it('allows updating plan custom name and farmer agronomic notes', async () => {
      const updated = await dbService.updateSavedPlan(testUser.id, savedPlan.id, {
        planName: 'Updated Wheat & Legume Strategy 2026',
        userNotes: 'Added micronutrient bio-stimulants schedule'
      });

      assert.strictEqual(updated.planName, 'Updated Wheat & Legume Strategy 2026');
      assert.strictEqual(updated.userNotes, 'Added micronutrient bio-stimulants schedule');
    });

    it('duplicates a saved plan into an independent new snapshot', async () => {
      const duplicated = await dbService.duplicateSavedPlan(testUser.id, savedPlan.id);

      assert.notStrictEqual(duplicated.id, savedPlan.id);
      assert.ok(duplicated.planName.includes('Copy') || duplicated.planName.includes('نسخة'));
      assert.strictEqual(duplicated.planSnapshot.overallScore, 89);

      // Verify both exist independently
      const allPlans = await dbService.getSavedPlans(testUser.id);
      assert.strictEqual(allPlans.length, 2);
    });

    it('deletes a saved plan with ownership verification', async () => {
      await dbService.deleteSavedPlan(testUser.id, savedPlan.id);
      const remainingPlans = await dbService.getSavedPlans(testUser.id);
      assert.strictEqual(remainingPlans.length, 1); // Only the duplicate remains
    });
  });

  // --------------------------------------------------------------------------
  // 5. Activity History Audit Trail & Filtering
  // --------------------------------------------------------------------------
  describe('Agricultural Activity History Timeline & Logging', () => {
    it('accurately logs audit records for all farm and plan actions with filter support', async () => {
      const user = await authService.register({
        fullName: 'Audit Farmer',
        email: `audit_${Date.now()}@smartcrop.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        country: 'Egypt',
        city: 'Juhayna'
      });

      // 1. Account created activity
      let history = await dbService.getActivityHistory(user.user.id);
      assert.ok(history.some(h => h.activityType === 'account_created'));

      // 2. Create farm logs activity
      const farm = await dbService.createFarm({
        userId: user.user.id,
        farmName: 'Juhayna Organic Farm',
        latitude: 26.65,
        longitude: 31.50,
        country: 'Egypt',
        region: 'Juhayna',
        farmArea: 8.0,
        areaUnit: 'feddan',
        soilType: 'clay_loam',
        irrigationAvailability: 'high',
        farmerPriority: 'soil_health'
      });

      history = await dbService.getActivityHistory(user.user.id);
      assert.ok(history.some(h => h.activityType === 'farm_created' && h.farmId === farm.id));

      // 3. Save plan logs activity
      const plan = await dbService.savePlan({
        userId: user.user.id,
        farmId: farm.id,
        farmName: farm.farmName,
        planName: 'Juhayna Seasonal Plan',
        planSnapshot: dummyPlan,
        originalInputs: dummyAssessmentInput,
        soilDataSnapshot: dummySoil,
        climateDataSnapshot: dummyClimate,
        recommendationVersion: 'v2.1-global-fao56'
      });

      history = await dbService.getActivityHistory(user.user.id);
      assert.ok(history.some(h => h.activityType === 'plan_saved' && h.planId === plan.id));

      // 4. Test filter by activityType
      const planOnlyHistory = await dbService.getActivityHistory(user.user.id, {
        activityType: 'plan_saved'
      });
      assert.ok(planOnlyHistory.every(h => h.activityType === 'plan_saved'));

      // 5. Test filter by farmId
      const farmOnlyHistory = await dbService.getActivityHistory(user.user.id, {
        farmId: farm.id
      });
      assert.ok(farmOnlyHistory.every(h => h.farmId === farm.id));
    });
  });

  // --------------------------------------------------------------------------
  // 6. Farmer KPI Analytics & Statistics
  // --------------------------------------------------------------------------
  describe('Farmer KPI Analytics & Dashboard Statistics', () => {
    it('calculates correct aggregate metrics for total plans, farms, area, and top crops', async () => {
      const user = await authService.register({
        fullName: 'Analytics Farmer',
        email: `analytics_${Date.now()}@smartcrop.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        country: 'Egypt',
        city: 'Sohag'
      });

      await dbService.createFarm({
        userId: user.user.id,
        farmName: 'North Parcel',
        latitude: 26.55,
        longitude: 31.70,
        country: 'Egypt',
        region: 'Sohag',
        farmArea: 7.5,
        areaUnit: 'feddan',
        soilType: 'clay_loam',
        irrigationAvailability: 'medium',
        farmerPriority: 'water_conservation'
      });

      await dbService.createFarm({
        userId: user.user.id,
        farmName: 'South Parcel',
        latitude: 26.50,
        longitude: 31.72,
        country: 'Egypt',
        region: 'Sohag',
        farmArea: 12.5,
        areaUnit: 'feddan',
        soilType: 'sandy_loam',
        irrigationAvailability: 'high',
        farmerPriority: 'profitability'
      });

      await dbService.savePlan({
        userId: user.user.id,
        farmName: 'North Parcel',
        planName: 'Crop Plan Alpha',
        planSnapshot: dummyPlan,
        originalInputs: dummyAssessmentInput,
        soilDataSnapshot: dummySoil,
        climateDataSnapshot: dummyClimate,
        recommendationVersion: 'v2.1-global-fao56'
      });

      const stats = await dbService.getFarmerStats(user.user.id);
      assert.strictEqual(stats.totalFarms, 2);
      assert.strictEqual(stats.totalArea, 20.0);
      assert.strictEqual(stats.totalPlans, 1);
      assert.ok(Array.isArray(stats.topCrops));
      assert.ok(stats.topCrops.some(c => c.id === 'wheat'));
    });
  });

  // --------------------------------------------------------------------------
  // 7. Profile Updates & Account Deletion (Cascade Cleanup)
  // --------------------------------------------------------------------------
  describe('Farmer Profile Updates & Account Deletion', () => {
    it('updates farmer profile details and clears data upon account deletion', async () => {
      const user = await authService.register({
        fullName: 'Omar Khalid',
        email: `omar_${Date.now()}@smartcrop.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        country: 'Sudan',
        city: 'Khartoum'
      });

      // Update Profile
      const updated = await dbService.updateProfile(user.user.id, {
        fullName: 'Omar Khalid Al-Ansari',
        city: 'Omdurman',
        profileImage: '🚜'
      });
      assert.strictEqual(updated.fullName, 'Omar Khalid Al-Ansari');
      assert.strictEqual(updated.city, 'Omdurman');
      assert.strictEqual(updated.profileImage, '🚜');

      // Add a farm & plan
      const farm = await dbService.createFarm({
        userId: user.user.id,
        farmName: 'Omar Farm',
        latitude: 15.5,
        longitude: 32.5,
        country: 'Sudan',
        region: 'Gezira',
        farmArea: 15.0,
        areaUnit: 'feddan',
        soilType: 'clay_loam',
        irrigationAvailability: 'high',
        farmerPriority: 'profitability'
      });

      await dbService.savePlan({
        userId: user.user.id,
        farmId: farm.id,
        farmName: farm.farmName,
        planName: 'Omar Gezira Rotation',
        planSnapshot: dummyPlan,
        originalInputs: dummyAssessmentInput,
        soilDataSnapshot: dummySoil,
        climateDataSnapshot: dummyClimate,
        recommendationVersion: 'v2.1-global-fao56'
      });

      // Delete Account
      await dbService.deleteAccount(user.user.id);

      // Verify cascade deletion
      const profile = await dbService.getProfile(user.user.id);
      assert.strictEqual(profile, null);

      const farms = await dbService.getFarms(user.user.id);
      assert.strictEqual(farms.length, 0);

      const plans = await dbService.getSavedPlans(user.user.id);
      assert.strictEqual(plans.length, 0);

      const history = await dbService.getActivityHistory(user.user.id);
      assert.strictEqual(history.length, 0);
    });
  });

});
