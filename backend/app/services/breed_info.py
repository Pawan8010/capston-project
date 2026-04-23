BREED_INFO = {
  "Gir": {
    "milk_yield":    "10–15 litres/day",
    "climate":       "Hot and semi-arid (Gujarat, Rajasthan)",
    "feed":          "Green fodder, dry hay, cotton seed cake",
    "disease_risks": ["FMD", "Mastitis", "Brucellosis"],
    "best_for":      "Milk production in tropical climates",
    "avg_weight_kg": 385,
    "lactation_days": 300
  },
  "Holstein": {
    "milk_yield":    "25–35 litres/day",
    "climate":       "Temperate (cooler regions)",
    "feed":          "High-energy concentrate, maize silage",
    "disease_risks": ["Mastitis", "Milk fever", "Ketosis"],
    "best_for":      "Maximum milk production in cooler climates",
    "avg_weight_kg": 680,
    "lactation_days": 305
  },
  "Jersey": {
    "milk_yield":    "12–20 litres/day",
    "climate":       "Temperate to warm",
    "feed":          "Balanced concentrate + green fodder",
    "disease_risks": ["Milk fever", "Bloat"],
    "best_for":      "High-fat milk, butter production",
    "avg_weight_kg": 410,
    "lactation_days": 300
  },
  "Sahiwal": {
    "milk_yield":    "8–12 litres/day",
    "climate":       "Hot and humid (Punjab, UP)",
    "feed":          "Wheat straw, green fodder, mustard cake",
    "disease_risks": ["Tick fever", "FMD"],
    "best_for":      "Heat-tolerant milk production",
    "avg_weight_kg": 450,
    "lactation_days": 280
  },
  "Red Sindhi": {
    "milk_yield":    "6–10 litres/day",
    "climate":       "Very hot and dry",
    "feed":          "Dry fodder, minimum concentrate",
    "disease_risks": ["Tick fever", "Theileriosis"],
    "best_for":      "Hardy milk breed for harsh conditions",
    "avg_weight_kg": 340,
    "lactation_days": 270
  },
  "Murrah": {
    "milk_yield":    "15–25 litres/day (buffalo)",
    "climate":       "Hot and humid (Haryana, Punjab)",
    "feed":          "Green fodder, dry fodder, concentrate",
    "disease_risks": ["Foot rot", "Mastitis", "HS"],
    "best_for":      "High-fat buffalo milk, ghee production",
    "avg_weight_kg": 550,
    "lactation_days": 290
  }
}

def get_breed_info(breed_name: str) -> dict:
    """
    Returns known information about a breed.
    Returns an empty dict if breed is not in the database.
    """
    return BREED_INFO.get(breed_name, {})
