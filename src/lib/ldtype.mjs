// Тип schema.org для компании по нише (ItemList рейтинга и карточка): свой тип вместо общего LocalBusiness.
// Порядок: ld в конфиге ниши (nishi.mjs) → точная ниша здесь → категория → LocalBusiness.
const NICHE = {
  'eda/kofeyni': 'CafeOrCoffeeShop', 'eda/kafe': 'CafeOrCoffeeShop', 'eda/restorany': 'Restaurant', 'eda/pekarni': 'Bakery',
  'eda/burgernye': 'FastFoodRestaurant', 'eda/gruzinskaya-kukhnya': 'Restaurant', 'eda/dostavka-sushi': 'Restaurant', 'eda/dostavka-pitstsy': 'Restaurant',
  'otdykh/gostinitsy': 'Hotel', 'otdykh/bazy-otdykha': 'LodgingBusiness', 'otdykh/bani': 'HealthAndBeautyBusiness', 'otdykh/sauny': 'HealthAndBeautyBusiness',
  'otdykh/kinoteatry': 'MovieTheater', 'otdykh/karaoke': 'EntertainmentBusiness', 'otdykh/kvesty': 'EntertainmentBusiness',
  'zdorove/stomatologii': 'Dentist', 'zdorove/implantatsiya-zubov': 'Dentist', 'zdorove/detskie-stomatologii': 'Dentist',
  'zdorove/oftalmologii': 'MedicalClinic', 'zdorove/mrt': 'DiagnosticLab', 'zdorove/laboratorii': 'DiagnosticLab',
  'krasota/barbershopy': 'HairSalon', 'krasota/parikmakherskie': 'HairSalon', 'krasota/manikyur': 'NailSalon', 'krasota/spa-salony': 'DaySpa',
  'krasota/tatu-salony': 'TattooParlor', 'krasota/solyarii': 'TanningSalon',
  'sport/basseyny': 'PublicSwimmingPool', 'sport/fitnes-kluby': 'ExerciseGym', 'sport/trenazhernye-zaly': 'ExerciseGym', 'sport/tennis': 'TennisComplex',
  'dom/okna': 'HomeAndConstructionBusiness', 'dom/dveri': 'HomeGoodsStore', 'dom/vkhodnye-dveri': 'HomeGoodsStore', 'dom/kukhni-na-zakaz': 'FurnitureStore',
  'dom/mebel-na-zakaz': 'FurnitureStore', 'dom/santekhnicheskie-raboty': 'Plumber', 'dom/elektromontazh': 'Electrician', 'dom/vskrytie-zamkov': 'Locksmith',
  'dom/konditsionery': 'HVACBusiness', 'dom/gruzoperevozki': 'MovingCompany', 'dom/remont-kvartir': 'GeneralContractor',
  'uslugi/yuristy': 'LegalService', 'uslugi/notariusy': 'Notary', 'uslugi/agentstva-nedvizhimosti': 'RealEstateAgent', 'uslugi/khimchistki': 'DryCleaningOrLaundry',
  'uslugi/strakhovanie': 'InsuranceAgency', 'uslugi/fotostudii': 'ProfessionalService',
  'deti/chastnye-detskie-sady': 'ChildCare', 'prazdniki/banketnye-zaly': 'EventVenue', 'prazdniki/keytering': 'FoodEstablishment',
  'prazdniki/vozdushnye-shary': 'Store', 'pitomtsy/vetkliniki': 'VeterinaryCare', 'pitomtsy/zoomagaziny': 'PetStore',
};
const CAT = {
  eda: 'FoodEstablishment', otdykh: 'EntertainmentBusiness', zdorove: 'MedicalClinic', krasota: 'BeautySalon', sport: 'SportsActivityLocation',
  dom: 'HomeAndConstructionBusiness', 'remont-tekhniki': 'LocalBusiness', uslugi: 'ProfessionalService', deti: 'EducationalOrganization',
  prazdniki: 'LocalBusiness', pitomtsy: 'LocalBusiness',
};
export const ldType = (key, cfg = {}) => cfg.ld || NICHE[key] || CAT[key.split('/')[0]] || 'LocalBusiness';
