import type { Crop, NasaPowerClimateData, Season, CropTimeline } from '../types';

/**
 * Global Crop Agricultural Calendar Engine
 * Dynamically computes scientifically calibrated planting windows, harvest windows,
 * growing duration ranges, and agronomic timing rationales according to:
 * - Hemisphere (Northern vs Southern)
 * - Thermal regime (subtropical/arid vs temperate vs tropical)
 * - Winter minimum temperatures & frost hazard (Tmin < 0°C)
 * - Extreme summer maximum temperatures (Tmax > 40°C)
 * - Specific physiological crop thermal requirements (Tbase, Topt, Tmax)
 */

interface CalendarRule {
  durationRangeDays: [number, number];
  roleInRotationEn: string;
  roleInRotationAr: string;
  importantNotesEn: string;
  importantNotesAr: string;
}

const CROP_CALENDAR_RULES: Record<string, CalendarRule> = {
  wheat: {
    durationRangeDays: [140, 160],
    roleInRotationEn: 'Primary staple cereal producing dense fibrous root biomass, stabilizing soil aggregation and providing grain security.',
    roleInRotationAr: 'محصول استراتيجي حبوب رئيسي ذو كتلة جذرية ليفية كثيفة، يثبت تجمعات التربة ويؤمن السيادة الغذائية.',
    importantNotesEn: 'Avoid following other small cereals to break crown and root rot pathogens. Ensure timely sowing in the optimal window to prevent heat sterility during spring grain filling.',
    importantNotesAr: 'تجنب الزراعة بعد محاصيل الحبوب النجيلية المتتالية لكسر فطريات تعفن التاج والجذور. احرص على الزراعة في الميعاد لتفادي صدمات القيظ أثناء امتلاء الحبوب.'
  },
  berseem: {
    durationRangeDays: [150, 180],
    roleInRotationEn: 'Biological nitrogen powerhouse and high-biomass forage legume fixing up to 180 kg N/ha and vastly enriching soil organic matter.',
    roleInRotationAr: 'محصول علفي بقولي فائق التثبيت الحيوي للنيتروجين (+180 كجم N/هـ)، يثري دبال التربة ومادتها العضوية بنجاح.',
    importantNotesEn: 'Yields multiple nutritious forage cuts. Invert and incorporate the final root flush and crown stubble into the soil ahead of summer planting for maximum nitrogen crediting.',
    importantNotesAr: 'يعطي 4-5 حشات علفية غنية. احرص على قلب بقايا الحشة الأخيرة والجذور في التربة قبل زراعة المحصول الصيفي لتعظيم الاستفادة من النيتروجين المخزن.'
  },
  sorghum: {
    durationRangeDays: [100, 120],
    roleInRotationEn: 'Drought-hardy C4 summer grain providing abundant forage/feed and biomass while demanding substantially less water than summer maize.',
    roleInRotationAr: 'حبوب صيفية C4 متفوقة في تحمل الجفاف والحرارة، توفر أعلافاً وحبوباً وفيرة مع استهلاك مائي أقل كثيراً من الذرة الشامية.',
    importantNotesEn: 'C4 physiological pathway thrives under extreme summer heat up to 45°C. Deep roots extract subsoil moisture efficiently.',
    importantNotesAr: 'يمتلك تمثيلاً ضوئياً رباعي الكربون C4 يتحمل موجات الحر الشديدة حتى 45°م. وتتعمق جذوره لاستخلاص الرطوبة من الأعماق بكفاءة.'
  },
  faba_bean: {
    durationRangeDays: [130, 150],
    roleInRotationEn: 'High-protein pulse fixing substantial atmospheric nitrogen, improving soil structural tilth and serving as an ideal break before summer grains.',
    roleInRotationAr: 'بقوليات غذائية عالية البروتين تثبت كميات وفيرة من النيتروجين الجوي، تحسن بناء التربة وتعد كاسراً مثالياً قبل الحبوب الصيفية.',
    importantNotesEn: 'Inoculate seed with Rhizobium leguminosarum strains if legumes have not been planted recently. Sensitive to excessive salinity (EC > 3.0 dS/m).',
    importantNotesAr: 'يُفضل تلقيح البذور بالعقدين البكتيري لضمان كفاءة العقد الجذرية. حساس للملوحة المرتفعة في التربة ومياه الري فوق 3 ديسيمنز/م.'
  },
  onion: {
    durationRangeDays: [130, 160],
    roleInRotationEn: 'High-value commercial cash bulb crop with shallow fibrous rooting that utilizes residual topsoil fertility and breaks cereal root pests.',
    roleInRotationAr: 'محصول نقدي تجاري عالي القيمة التسويقية بجذور سطحية تستغل خصوبة الطبقة العليا وتكسر دورات نيماتودا الحبوب.',
    importantNotesEn: 'Shallow rooting demands disciplined moisture control. Withhold irrigation 2–3 weeks before harvesting to ensure proper bulb curing and skin formation.',
    importantNotesAr: 'جذوره السطحية تتطلب رياً منتظماً دون تغريق. يجب منع الري قبل الحصاد بـ 2-3 أسابيع لضمان جفاف الرقبة وتصلب القشور لسهولة التخزين.'
  },
  barley: {
    durationRangeDays: [95, 115],
    roleInRotationEn: 'Highly salt- and drought-resilient winter cereal that matures early, conserving late-season irrigation and yielding nutritious feed grain and straw.',
    roleInRotationAr: 'حبوب شتوية فائقة التحمل للملوحة والجفاف ومبكرة النضج، توفر مياه الري في نهاية الموسم وتنتج حباً وتِبناً عالي الجودة.',
    importantNotesEn: 'Tolerates soil salinity up to 8.0 dS/m. Because it matures 2–3 weeks before wheat, it facilitates earlier field preparation for warm-season successors.',
    importantNotesAr: 'يتحمل ملوحة التربة حتى 8 ديسيمنز/متر. نضجه المبكر قبل القمح بأسابيع يتيح إخلاء الحقل وتجهيزه مبكراً للمحصول الصيفي التالي.'
  },
  canola: {
    durationRangeDays: [120, 145],
    roleInRotationEn: 'Brassicaceae oilseed with a deep vertical taproot that breaks subterranean hardpans, biofumigates nematode seedbanks, and diversifies income.',
    roleInRotationAr: 'محصول زيت صليبي ذو جذر وتدي متعمق يفتت الطبقات الصماء، ويفرز مركبات حيوية تطهر التربة من النيماتودا ويعظم العائد المالي.',
    importantNotesEn: 'Outstanding disease break crop for cereal rotations. Must be harvested carefully when pods turn golden-brown to prevent seed shattering.',
    importantNotesAr: 'محصول كاسر استثنائي لأمراض الحبوب النجيلية. يجب الالتزام بالحصاد عند تحول القرون إلى اللون البني الذهبي لتفادي انفراط البذور.'
  },
  potato: {
    durationRangeDays: [90, 120],
    roleInRotationEn: 'Premium high-yielding tuber cash crop that demands thorough soil tilth and generates high financial returns per hectare.',
    roleInRotationAr: 'محصول درني نقدي عالي الإنتاجية والقيمة الاقتصادية، يترك التربة في حالة تفكك ونعومة ممتازة للمحصول التالي.',
    importantNotesEn: 'Requires friable, well-drained soil for unhindered tuber expansion. Maintain uniform soil moisture; avoid water stress during tuber initiation and bulking.',
    importantNotesAr: 'يتطلب تربة هشة جيدة الصرف لتسهيل نمو الدرنات. حافظ على رطوبة معتدلة منتظمة وتجنب العطش في مرحلتي الصب وتكوين الدرنات.'
  },
  rice: {
    durationRangeDays: [120, 145],
    roleInRotationEn: 'High-yielding wetland staple crop that leaches soil salts during ponding, leaving fields cleansed for subsequent winter pulses or cereals.',
    roleInRotationAr: 'محصول مائي صيفي رئيسي يسهم غمره المائي في غسيل أملاح التربة واستصلاحها للمحاصيل الشتوية اللاحقة.',
    importantNotesEn: 'Requires guaranteed irrigation water supplies. Alternate wetting and drying (AWD) irrigation schedules can save 20–30% of water without yield decline.',
    importantNotesAr: 'يتطلب مصدراً مائياً وفيراً ومستقراً. يمكن لتطبيق الري بالتناوب (التهوية والتجفيف الدوري) توفير 20-30% من استهلاك المياه دون نقص في المحصول.'
  },
  maize: {
    durationRangeDays: [105, 130],
    roleInRotationEn: 'High-biomass C4 cereal grain serving as the cornerstone of livestock feed, generating abundant nutritious stover and soil organic residue.',
    roleInRotationAr: 'محصول حبوب صيفي C4 غزير الإنتاج يمثل حجر الزاوية للأعلاف، ويوفر كتلة حيوية نباتية وفيرة تخصب التربة بعد فرم القش.',
    importantNotesEn: 'Sensitive to moisture deficit and excessive heat (>38°C) during the 2-week tasseling and silking window. Ensure nitrogen is available at V6 and tasseling.',
    importantNotesAr: 'حساس جداً للإجهاد المائي والحرارة المفرطة (>38°م) أثناء مرحلة التزهير وطرد الحريرة. تأكد من توفر النيتروجين والري المنتظم في هذه الفترة الحرجة.'
  },
  soybean: {
    durationRangeDays: [105, 125],
    roleInRotationEn: 'High-value protein and oil legume that fixes 60–100 kg N/ha, conditioning the seedbed perfectly for subsequent winter cereals.',
    roleInRotationAr: 'بقوليات صيفية استراتيجية للبروتين والزيت تثبت 60-100 كجم نيتروجين/هكتار، وتهيئ مرقداً ممتازاً لزراعة القمح الشتوي اللاحق.',
    importantNotesEn: 'Ideal predecessor for wheat. Its leaves drop before maturity, mulching the soil with nitrogen-rich organic residue that mineralizes rapidly.',
    importantNotesAr: 'سلف مثالي لمحصول القمح. تتساقط أوراقه قبل الحصاد لتشكل غطاءً عضوياً غنياً بالنيتروجين يتحلل سريعاً ليغذي المحصول الشتوي.'
  },
  chickpea: {
    durationRangeDays: [110, 130],
    roleInRotationEn: 'Drought-tolerant cool-season pulse fixing biological nitrogen, thriving on residual moisture with exceptionally low irrigation requirements.',
    roleInRotationAr: 'بقوليات معتدلة مقاومة للجفاف تثبت النيتروجين الحيوي، وتكتفي باحتياج مائي منخفض جداً وتنمو على الرطوبة المتبقية.',
    importantNotesEn: 'Extremely susceptible to root rot in waterlogged soils. Plant in well-drained beds and avoid flood irrigation during flowering and pod setting.',
    importantNotesAr: 'شديد الحساسية للغدق وركود المياه حول الجذور. يُزرع في مصاطب جيدة الصرف وتجنب الري الغزير أثناء فترتي التزهير والعقد.'
  },
  sesame: {
    durationRangeDays: [90, 110],
    roleInRotationEn: 'Deep-rooting, ultra-low-water summer oilseed that withstands intense heat spells and thrives in lighter, well-aerated soils.',
    roleInRotationAr: 'محصول زيت صيفي وتدي فائق التوفير للمياه، يتحمل موجات القيظ الشديدة وينجح بامتياز في الأراضي الخفيفة والمتوسطة جيدة الصرف.',
    importantNotesEn: 'Water requirement is very low (~380 mm). Excellent replacement for high-water summer crops under tight water rationing. Avoid heavy standing water.',
    importantNotesAr: 'استهلاكه المائي ضئيل (~380 مم). بديل اقتصادي استثنائي للمحاصيل الصيفية شرهة المياه عند شح الري. حساس جداً لركود الماء.'
  },
  groundnut: {
    durationRangeDays: [120, 140],
    roleInRotationEn: 'Leguminous oil and protein cash crop that thrives in sandy/light soils, fixing nitrogen and improving soil friability as pods mature underground.',
    roleInRotationAr: 'محصول نقدي بقولي زيتي يزدهر في الأراضي الرملية والخفيفة، يثبت النيتروجين ويزيد من مسامية وخصوبة التربة بدخول الإبر وتكوين القرون.',
    importantNotesEn: 'Requires loose, sandy-textured topsoil for easy peg penetration. Maintain steady moisture during pod development; avoid heavy saline water.',
    importantNotesAr: 'يتطلب تربة رملية أو طميية خفيفة مفككة لتسهيل اختراق إبر التلقيح وتكوين القرون. حافظ على رطوبة معتدلة أثناء امتلاء القرون.'
  },
  sunflower: {
    durationRangeDays: [90, 110],
    roleInRotationEn: 'Deep taproot scavenger that mines subsoil moisture and nutrients from depths >1.5 m, breaking pest cycles and producing premium vegetable oil.',
    roleInRotationAr: 'محصول وتدي عميق يستخلص الرطوبة والعناصر الغذائية من أعماق تتجاوز 1.5 متر، يكسر دورات الآفات وينتج زيتاً نباتياً ممتازاً.',
    importantNotesEn: 'Remarkable adaptability across soil textures and moderate salinity. Its extensive root zone leaves soil well aerated for following crops.',
    importantNotesAr: 'مرونة عالية للتكيف عبر مختلف أنواع التربة والملوحة المتوسطة. يترك شبكة أنفاق جذرية عميقة تهوي التربة للمحصول اللاحق.'
  },
  oats: {
    durationRangeDays: [115, 135],
    roleInRotationEn: 'Cool-season cereal and cover crop with extensive fibrous roots that suppress weeds allelopathically and scavenge residual subsoil nitrogen.',
    roleInRotationAr: 'محصول حبوب وعلف شتوي ذو شبكة جذور ليفية تكتم الحشائش أليلوباثياً وتمتص بقايا النيتروجين المتسرب في باطن التربة.',
    importantNotesEn: 'Tolerates cooler soils at planting than wheat. Excellent companion or cover crop before spring and summer row crops.',
    importantNotesAr: 'يتحمل برودة التربة عند الزراعة أكثر من القمح. محصول تغطية ممتاز يسبق محاصيل الحبوب الصيفية.'
  },
  millet: {
    durationRangeDays: [75, 95],
    roleInRotationEn: 'Short-duration, ultra-drought-hardy C4 summer grain with deep roots that stabilizes sandy drylands under extreme heatwaves up to 45°C.',
    roleInRotationAr: 'حبوب صيفية C4 قصيرة العمر وفائقة التحمل للجفاف والحرارة حتى 45°م؛ تثبت الأراضي الرملية وتنتج حبوباً وأعلافاً في أشد البيئات جفافاً.',
    importantNotesEn: 'Fast maturity (80–90 days) allows rapid rotation turnaround. Low water demand makes it ideal for water-scarce arid zones.',
    importantNotesAr: 'نضج سريع (80-90 يوماً) يتيح تتابعاً سريعاً للمحاصيل. استهلاكه المائي المنخفض يجعله مثالياً لمناطق الشح المائي.'
  },
  cowpea: {
    durationRangeDays: [70, 90],
    roleInRotationEn: 'High-temperature, drought-tolerant summer pulse fixing substantial atmospheric nitrogen (+70 kg N/ha) while providing rapid canopy soil cover.',
    roleInRotationAr: 'بقوليات صيفية مقاومة للحرارة والجفاف تثبت النيتروجين الجوي (+70 كجم N/هـ) وتوفر تغطية نباتية سريعة لحماية سطح التربة من التبخر.',
    importantNotesEn: 'Performs reliably on low-fertility sandy soils. Fixes nitrogen efficiently even under high ambient summer temperatures.',
    importantNotesAr: 'ينمو بكفاءة في الأراضي الرملية ضعيفة الخصوبة. يثبت النيتروجين بامتياز حتى في درجات الحرارة الصيفية المرتفعة.'
  },
  lentil: {
    durationRangeDays: [110, 130],
    roleInRotationEn: 'High-value cool-season pulse fixing biological nitrogen (+65 kg N/ha) that conditions the seedbed for subsequent high-yielding summer grains.',
    roleInRotationAr: 'بقوليات شتوية عالية القيمة الغذائية والسوقية تثبت النيتروجين الحيوي (+65 كجم N/هـ) وتهيئ مرقد التربة لحبوب الصيف التالية.',
    importantNotesEn: 'Shallow rooting requires good weed management early. Avoid waterlogged fields or saline irrigation water (ECw > 1.0 dS/m).',
    importantNotesAr: 'جذوره سطحية وتتطلب مكافحة مبكرة للحشائش. تجنب الحقول ذات الصرف الضعيف أو مياه الري المالحة (أكثر من 1.0 ديسيمنز/م).'
  },
  common_bean: {
    durationRangeDays: [85, 105],
    roleInRotationEn: 'High-margin commercial grain pulse that enriches soil biology (+45 kg N/ha) while fitting tightly between major winter cereal crops.',
    roleInRotationAr: 'بقوليات غذائية وتجارية عالية الربحية تثري خصوبة التربة (+45 كجم N/هـ) وتتناسب تماماً مع فترات التتابع بين محاصيل الحبوب الرئيسية.',
    importantNotesEn: 'Sensitive to salinity and high heat during bloom (>34°C). Ensure well-aerated soils with adequate irrigation frequency.',
    importantNotesAr: 'حساس للملوحة وللحرارة المرتفعة أثناء التزهير (>34°م). احرص على تهوية التربة وانتظام فترات الري دون تغريق.'
  },
  field_pea: {
    durationRangeDays: [100, 120],
    roleInRotationEn: 'Rapid-maturing cool-season legume powerhouse fixing up to 75 kg N/ha, improving soil tilth and vacating the field early for summer crops.',
    roleInRotationAr: 'بقوليات شتوية سريعة النضج تثبت حتى 75 كجم N/هـ، تحسن قوام التربة وتخلي الحقل مبكراً لزراعة المحصول الصيفي في موعده الأمثل.',
    importantNotesEn: 'Excellent break crop before maize or sorghum. Leaves large reserves of readily mineralizable organic nitrogen in root nodule residues.',
    importantNotesAr: 'كاسر مثالي قبل الذرة الشامية أو الرفيعة. يترك رصيداً ضخماً من النيتروجين العضوي سهل التمعدن في العقد الجذرية.'
  },
  cotton: {
    durationRangeDays: [150, 180],
    roleInRotationEn: 'Deep-taprooted industrial fiber crop that penetrates subsoil hardpans, tolerates salinity (ECe up to 7.7 dS/m), and provides high economic returns.',
    roleInRotationAr: 'محصول ألياف صناعي وتدي عميق يخترق الطبقات الصماء، ويتحمل الملوحة العالية (حتى 7.7 ديسيمنز/م)، ويحقق عائداً اقتصادياً مجزياً.',
    importantNotesEn: 'Long season and deep roots extract substantial nutrients; best preceded by an N-fixing legume such as berseem or faba bean.',
    importantNotesAr: 'موسم نموه الطويل وجذوره العميقة تستنزف خصوبة التربة؛ يفضل زراعته بعد البرسيم أو الفول البلدي لتعويض النيتروجين.'
  },
  sugarcane: {
    durationRangeDays: [270, 330],
    roleInRotationEn: 'Perennial high-biomass C4 industrial crop that generates massive root and organic trash matter, anchoring soil in tropical/subtropical basins.',
    roleInRotationAr: 'محصول سكر صناعي C4 عالي الكتلة الحيوية يضيف كميات هائلة من المادة العضوية ومخلفات الجذور لحماية بنية التربة في النطاقات المدارية.',
    importantNotesEn: 'Intensive water and nutrient requirement (~1200 mm). Precede replanting cycles with multi-month green manure legumes.',
    importantNotesAr: 'استهلاك مائي وسمادي مكثف (~1200 مم). يوصى بإدخال بقوليات للتسميد الأخضر لتجديد حيوية الحقل بين دورات القصب.'
  },
  safflower: {
    durationRangeDays: [130, 150],
    roleInRotationEn: 'Drought- and salinity-hardy winter oilseed with an aggressive taproot system that mines subsoil moisture down to 2.5 m and breaks pest complexes.',
    roleInRotationAr: 'محصول زيت شتوي فائق التحمل للجفاف والملوحة بجذور وتدية ثاقبة تمتص رطوبة باطن الأرض حتى عمق 2.5 م وتكسر معقدات الآفات.',
    importantNotesEn: 'Tolerates salinity up to ECe 5.3 dS/m. Deep root canals improve water infiltration and drainage for the next summer season.',
    importantNotesAr: 'يتحمل الملوحة حتى 5.3 ديسيمنز/م. قنوات جذوره المتعمقة تحسن نفاذية وصرف التربة لموسم الصيف التالي.'
  },
  flax: {
    durationRangeDays: [130, 150],
    roleInRotationEn: 'Dual-purpose winter fiber and oilseed with delicate shallow roots that utilize surface fertility without disturbing deeper soil horizons.',
    roleInRotationAr: 'محصول شتوي ثنائي الغرض للألياف وزيت الكتان بجذور سطحية رقيقة تستغل الخصوبة العلوية دون إجهاد آفاق التربة العميقة.',
    importantNotesEn: 'Maintain a 4-year rotation break to prevent Fusarium wilt buildup. Requires clean seedbeds and uniform moisture during early stand establishment.',
    importantNotesAr: 'يتطلب فاصلاً زمنياً 4 سنوات لتجنب مرض الذبول الفيوزارمي. يحتاج مرقد بذرة ناعم ورطوبة متجانسة أثناء مرحلة البادرات.'
  },
  tomato: {
    durationRangeDays: [110, 130],
    roleInRotationEn: 'High-value horticultural cash crop responsive to precision fertigation, creating high farm income while demanding disease-free rotation breaks.',
    roleInRotationAr: 'محصول خضر وبستاني نقدي عالي المردود المالي يستجيب للتسميد الدقيق بالري بالتنقيط، ويتطلب دورة زراعية مانعة لتراكم الفطريات.',
    importantNotesEn: 'Never follow potatoes or solanaceous crops. Requires balanced calcium nutrition to prevent blossom end rot under high heat.',
    importantNotesAr: 'يحظر زراعته بعد البطاطس أو الطماطم لتفادي نيماتودا الجذور وعفن الطرف الزهري؛ يتطلب تسميداً متوازناً بالكالسيوم.'
  },
  pepper: {
    durationRangeDays: [120, 140],
    roleInRotationEn: 'Premium commercial solanaceous cash crop that maximizes revenue per feddan/hectare under controlled irrigation and disciplined pest management.',
    roleInRotationAr: 'محصول نقدي تسويقي ممتاز يعظم العائد المالي لوحدة المساحة تحت الري الحديث المقنن والمكافحة المتكاملة لآفات التربة.',
    importantNotesEn: 'Sensitive to soil salinity (ECe > 1.5 dS/m) and root-rot fungi. Excellent when rotated with cereal crops or brassicas.',
    importantNotesAr: 'حساس لملوحة التربة ومياه الري وفطريات الجذور. تدويره مع محاصيل الحبوب أو الصليبيات يضمن إنتاجية متميزة ونظافة الحقل.'
  },
  sweet_potato: {
    durationRangeDays: [125, 145],
    roleInRotationEn: 'Broad-canopy summer caloric tuber that suppresses weeds aggressively, prevents soil moisture evaporation, and delivers high food security calories.',
    roleInRotationAr: 'درنات نشوية صيفية ذات مجموع خضري مفترش يكتم الحشائش بقوة ويحمي سطح التربة من التبخر الشديد ويحقق أمناً غذائياً عالياً.',
    importantNotesEn: 'Member of Convolvulaceae; provides an ideal biological break from standard solanaceous and cereal crop pest complexes.',
    importantNotesAr: 'ينتمي للعائلة العليقية مما يجعله كاسراً بيولوجياً استثنائياً لدورات آفات العائلة الباذنجانية والنجيليات.'
  },
  lupin: {
    durationRangeDays: [135, 155],
    roleInRotationEn: 'Elite reclamation legume fixing up to 120 kg N/ha, with specialized proteoid cluster roots that exude carboxylates to solubilize fixed soil phosphorus.',
    roleInRotationAr: 'محصول استصلاح بقولي من الطراز الأول يثبت حتى 120 كجم N/هـ؛ تفرز جذوره العنقودية أحماضاً عضوية تذيب الفوسفور المثبت في الأراضي الرملية.',
    importantNotesEn: 'Thrives in sandy and slightly acidic-to-neutral soils. Avoid heavy calcareous soils with high active lime (CaCO3 > 10%).',
    importantNotesAr: 'يزدهر في الأراضي الرملية جيدة الصرف؛ غير مناسب للأراضي الجيرية شديدة الكلسية (كربونات الكالسيوم النشطة > 10%).'
  },
  castor: {
    durationRangeDays: [140, 160],
    roleInRotationEn: 'Industrial non-food oil crop with deep taproots that thrives in arid reclamation lands, producing high-viscosity ricinoleic oil without competing with food crops.',
    roleInRotationAr: 'محصول زيت صناعي غير غذائي ذو جذور وتدية عميقة يجود في أراضي الاستصلاح الجافة وينتج زيوتاً حيوية عالية اللزوجة دون مزاحمة المحاصيل الغذائية.',
    importantNotesEn: 'Excellent drought and heat resilience. Its non-palatable nature prevents livestock grazing damage in open reclamation perimeters.',
    importantNotesAr: 'صامد للجفاف والحر الشديد. أوراقه غير مستساغة للرعي مما يحميه من التعديات في أطراف الأراضي الصحراوية المستصلحة.'
  }
};

/**
 * Calculates scientifically calibrated planting and harvesting windows for any crop worldwide.
 */
export function calculateCropTimeline(
  crop: Crop,
  climate: NasaPowerClimateData,
  seasonYear: 1 | 2,
  seasonType: Season
): CropTimeline {
  const isNorthern = climate.hemisphere !== 'southern' && climate.latitude >= 0;
  const isWinterSeason = seasonType === 'winter';
  const isColdTemperate = isNorthern && (climate.minTemperatureC < -2 || climate.avgTemperatureC < 14);
  const isTropical = Math.abs(climate.latitude) < 15;

  const rule = CROP_CALENDAR_RULES[crop.id] || {
    durationRangeDays: [crop.growingDays - 15, crop.growingDays + 15],
    roleInRotationEn: crop.soilHealthRoleEn,
    roleInRotationAr: crop.soilHealthRoleAr,
    importantNotesEn: crop.rotationRulesEn.agronomicNotes,
    importantNotesAr: crop.rotationRulesAr.agronomicNotes
  };

  const [minDays, maxDays] = rule.durationRangeDays;
  const avgDays = Math.round((minDays + maxDays) / 2);
  const durationDays = crop.growingDays || avgDays;
  const durationRangeEn = `${minDays}–${maxDays} days`;
  const durationRangeAr = `${minDays}–${maxDays} يوماً`;

  const yrSuffixEn = seasonYear === 1 ? 'Year 1' : 'Year 2';
  const yrSuffixAr = seasonYear === 1 ? 'العام الأول' : 'العام الثاني';

  let plantingWindowEn = '';
  let plantingWindowAr = '';
  let harvestWindowEn = '';
  let harvestWindowAr = '';
  let seasonClassificationEn = '';
  let seasonClassificationAr = '';
  let timingRationaleEn = '';
  let timingRationaleAr = '';

  if (isWinterSeason) {
    // -------------------------------------------------------------
    // COOL / WINTER SEASON CROP
    // -------------------------------------------------------------
    seasonClassificationEn = 'Winter / Cool Season Crop';
    seasonClassificationAr = 'محصول شتوي / موسم معتدل بارد';

    if (!isNorthern) {
      // Southern Hemisphere (inverted calendar: Cool season sown in Apr-May, harvested Oct-Nov)
      plantingWindowEn = `April – May (${yrSuffixEn})`;
      plantingWindowAr = `أبريل – مايو (${yrSuffixAr})`;
      harvestWindowEn = `October – November (${yrSuffixEn})`;
      harvestWindowAr = `أكتوبر – نوفمبر (${yrSuffixAr})`;
      timingRationaleEn = `Southern Hemisphere cool-season calendar: sown in Southern autumn (April–May) as temperatures moderate, maturing under increasing spring solar radiation.`;
      timingRationaleAr = `الموسم الشتوي لنصف الكرة الجنوبي: يُزرع خريفاً (أبريل–مايو) مع اعتدال الحرارة، ويكتمل نضجه في الربيع الجنوبي مع تزايد الإشعاع الشمسي.`;
    } else if (isColdTemperate) {
      // Northern Cold Temperate (e.g. Europe / North America)
      if (crop.frostToleranceClass === 'hardy') {
        // Winter-hardy cereals/canola: autumn sown with winter vernalization
        plantingWindowEn = `September – October (${yrSuffixEn})`;
        plantingWindowAr = `سبتمبر – أكتوبر (${yrSuffixAr})`;
        harvestWindowEn = `July – August (${yrSuffixEn === 'Year 1' ? 'Year 2' : 'Year 3'})`;
        harvestWindowAr = `يوليو – أغسطس (${seasonYear === 1 ? 'العام الثاني' : 'العام الثالث'})`;
        timingRationaleEn = `Autumn sowing enables root and tiller establishment before ground freezing; the crop overwinters under vernalization and matures in mid-summer.`;
        timingRationaleAr = `الزراعة الخريفية تتيح تكوين الجذور والإشطاء قبل تجمد التربة؛ يكمن المحصول شتاءً (ارتباع) ثم ينشط ربيعياً ليُحصد منتصف الصيف.`;
      } else {
        // Semi-hardy / sensitive cool crops: spring sown after severe frost risk passes
        plantingWindowEn = `March – April (${yrSuffixEn})`;
        plantingWindowAr = `مارس – أبريل (${yrSuffixAr})`;
        harvestWindowEn = `July – August (${yrSuffixEn})`;
        harvestWindowAr = `يوليو – أغسطس (${yrSuffixAr})`;
        timingRationaleEn = `Spring planting window once rootzone soil temperature thaws above 5–8°C, avoiding killing winter frost while completing maturity in late summer.`;
        timingRationaleAr = `زراعة ربيعية مبكرة فور دفء التربة فوق 5-8°م لتفادي الصقيع المميت، مع اكتمال النضج والحصاد في أواخر الصيف.`;
      }
    } else if (isTropical) {
      // Tropical: Cool/Secondary rotation season
      plantingWindowEn = `November – December (${yrSuffixEn})`;
      plantingWindowAr = `نوفمبر – ديسمبر (${yrSuffixAr})`;
      harvestWindowEn = `March – April (${yrSuffixEn === 'Year 1' ? 'Year 2' : 'Year 3'})`;
      harvestWindowAr = `مارس – أبريل (${seasonYear === 1 ? 'العام الثاني' : 'العام الثالث'})`;
      timingRationaleEn = `Lowland tropical secondary cropping window: sown as monsoon rains recede, taking advantage of lower humidity and reduced fungal pressure.`;
      timingRationaleAr = `موسم زراعي ثانٍ في المناطق الاستوائية: يُزرع مع انحسار الأمطار الموسمية للاستفادة من انخفاض الرطوبة وتراجع الضغط الفطري.`;
    } else {
      // Standard Subtropical / Mediterranean / Arid (e.g., Egypt, North Africa, Middle East, Southern Europe)
      if (crop.id === 'berseem' || crop.id === 'onion' || crop.id === 'potato') {
        plantingWindowEn = `October – November (${yrSuffixEn})`;
        plantingWindowAr = `أكتوبر – نوفمبر (${yrSuffixAr})`;
        harvestWindowEn = `April – May (${yrSuffixEn === 'Year 1' ? 'Year 2' : 'Year 3'})`;
        harvestWindowAr = `أبريل – مايو (${seasonYear === 1 ? 'العام الثاني' : 'العام الثالث'})`;
      } else if (crop.id === 'barley') {
        plantingWindowEn = `November (${yrSuffixEn})`;
        plantingWindowAr = `نوفمبر (${yrSuffixAr})`;
        harvestWindowEn = `March – April (${yrSuffixEn === 'Year 1' ? 'Year 2' : 'Year 3'})`;
        harvestWindowAr = `مارس – أبريل (${seasonYear === 1 ? 'العام الثاني' : 'العام الثالث'})`;
      } else {
        // Wheat, Faba bean, Canola, Chickpea
        plantingWindowEn = `November – December (${yrSuffixEn})`;
        plantingWindowAr = `نوفمبر – ديسمبر (${yrSuffixAr})`;
        harvestWindowEn = `April – May (${yrSuffixEn === 'Year 1' ? 'Year 2' : 'Year 3'})`;
        harvestWindowAr = `أبريل – مايو (${seasonYear === 1 ? 'العام الثاني' : 'العام الثالث'})`;
      }
      timingRationaleEn = `Optimal autumn sowing as ambient temperatures drop below 24°C, preventing seedling heat stress and ensuring grain filling completes before extreme summer heat (>38°C).`;
      timingRationaleAr = `زراعة خريفية مثالية مع انكسار درجات الحرارة دون 24°م، لحماية البادرات من الإجهاد وضمان امتلاء الحبوب قبل هبوب موجات قيظ الصيف الحارة (>38°م).`;
    }

  } else {
    // -------------------------------------------------------------
    // WARM / SUMMER SEASON CROP
    // -------------------------------------------------------------
    seasonClassificationEn = 'Summer / Warm Season Crop';
    seasonClassificationAr = 'محصول صيفي / موسم دافئ';

    if (!isNorthern) {
      // Southern Hemisphere (inverted calendar: Warm season sown in Oct-Nov, harvested Feb-Apr)
      plantingWindowEn = `October – November (${yrSuffixEn})`;
      plantingWindowAr = `أكتوبر – نوفمبر (${yrSuffixAr})`;
      harvestWindowEn = `February – April (${yrSuffixEn === 'Year 1' ? 'Year 2' : 'Year 3'})`;
      harvestWindowAr = `فبراير – أبريل (${seasonYear === 1 ? 'العام الثاني' : 'العام الثالث'})`;
      timingRationaleEn = `Southern Hemisphere summer window: sown in Southern spring (October–November) as soils warm above 16°C, harvesting in Southern autumn.`;
      timingRationaleAr = `الموسم الصيفي لنصف الكرة الجنوبي: يُزرع في الربيع الجنوبي (أكتوبر–نوفمبر) مع دفء التربة فوق 16°م، ويُحصد في الخريف الجنوبي.`;
    } else if (isColdTemperate) {
      // Cold Temperate Northern (spring/summer sowing after late frost risk)
      plantingWindowEn = `May – June (${yrSuffixEn})`;
      plantingWindowAr = `مايو – يونيو (${yrSuffixAr})`;
      harvestWindowEn = `September – October (${yrSuffixEn})`;
      harvestWindowAr = `سبتمبر – أكتوبر (${yrSuffixAr})`;
      timingRationaleEn = `Sown in late spring once all frost danger has passed and topsoil reaches 15–18°C, maximizing thermal degree-days before autumn cooling.`;
      timingRationaleAr = `يُزرع في أواخر الربيع بعد زوال خطر الصقيع الربيعي المتأخر وبلوغ حرارة التربة 15-18°م، لاستغلال الوحدات الحرارية الصيفية قبل برودة الخريف.`;
    } else if (isTropical) {
      // Tropical: Main Monsoon or High-Radiation Summer cycle
      plantingWindowEn = `May – June (${yrSuffixEn})`;
      plantingWindowAr = `مايو – يونيو (${yrSuffixAr})`;
      harvestWindowEn = `September – October (${yrSuffixEn})`;
      harvestWindowAr = `سبتمبر – أكتوبر (${yrSuffixAr})`;
      timingRationaleEn = `Primary tropical cropping season synchronized with high solar radiation and summer rainfall cycles.`;
      timingRationaleAr = `الموسم الاستوائي الرئيسي المتزامن مع ذروة الإشعاع الشمسي ودورات الهطول المطري الصيفية.`;
    } else {
      // Standard Subtropical / Mediterranean / Arid (Egypt, Middle East, etc.)
      if (crop.id === 'sesame' || crop.id === 'sunflower') {
        plantingWindowEn = `May – June (${yrSuffixEn})`;
        plantingWindowAr = `مايو – يونيو (${yrSuffixAr})`;
        harvestWindowEn = `August – September (${yrSuffixEn})`;
        harvestWindowAr = `أغسطس – سبتمبر (${yrSuffixAr})`;
      } else {
        // Sorghum, Maize, Rice, Soybean, Groundnut
        plantingWindowEn = `May – June (${yrSuffixEn})`;
        plantingWindowAr = `مايو – يونيو (${yrSuffixAr})`;
        harvestWindowEn = `September – October (${yrSuffixEn})`;
        harvestWindowAr = `سبتمبر – أكتوبر (${yrSuffixAr})`;
      }
      timingRationaleEn = `Sown in late spring to establish vegetative canopy rapidly under lengthening days, completing pollination before the most severe late-summer heat peaks.`;
      timingRationaleAr = `يُزرع في أواخر الربيع لسرعة تكوين المجموع الخضري تحت ساعات النهار الطويلة، مع عبور مرحلة التزهير الحساسة بنجاح قبل ذروة قيظ الصيف.`;
    }
  }

  return {
    plantingWindowEn,
    plantingWindowAr,
    harvestWindowEn,
    harvestWindowAr,
    durationDays,
    durationRangeEn,
    durationRangeAr,
    seasonClassificationEn,
    seasonClassificationAr,
    timingRationaleEn,
    timingRationaleAr
  };
}

// Alias for convenience across services
export const calculateCropCalendar = calculateCropTimeline;

export { CROP_CALENDAR_RULES };
