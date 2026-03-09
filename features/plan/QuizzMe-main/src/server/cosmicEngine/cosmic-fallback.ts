import { Body, Ecliptic, GeoVector } from 'astronomy-engine';

export async function createMockEngine() {
    return {
        calculateProfile: async (input: { year: number; month: number; day: number; hour: number; minute: number }) => {
            const dateStr = `${input.year}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')}T${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')}:00Z`;
            const date = new Date(dateStr);
            
            // Calculate Sun
            const sunVec = GeoVector(Body.Sun, date, false);
            const sunLon = Ecliptic(sunVec).elon;
            const sunSign = getSignFromLon(sunLon);
            
            // Calculate Moon
            const moonVec = GeoVector(Body.Moon, date, false);
            const moonLon = Ecliptic(moonVec).elon;
            const moonSign = getSignFromLon(moonLon);
            
             // Chinese Year calculation (Simplified Li Chun)
            const isAfterFeb4 = (input.month > 2) || (input.month === 2 && input.day >= 4);
            const chineseYear = isAfterFeb4 ? input.year : input.year - 1;
            
            const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
            const animal = animals[(chineseYear - 1984 + 1200) % 12];
            
            const elements = ["Wood", "Wood", "Fire", "Fire", "Earth", "Earth", "Metal", "Metal", "Water", "Water"];
            const element = elements[(chineseYear - 1984 + 1200) % 10];
            
            return {
                western: {
                    sun: { sign: sunSign, longitude: sunLon },
                    moon: { sign: moonSign, longitude: moonLon },
                    ascendant: { sign: "Libra", longitude: 180 }
                },
                bazi: {
                    year: {
                        animal: animal,
                        element: element,
                        pillar: `${element} ${animal}`
                    }
                },
                validation: {
                    status: "ok",
                    issues: []
                }
            };
        }
    }
}

function getSignFromLon(lon: number) {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    return signs[Math.floor(lon / 30) % 12];
}
