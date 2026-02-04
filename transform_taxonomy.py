import json
import os

def transform_taxonomy(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    new_taxonomy = []

    for pilier in data:
        # Pilier -> Category
        category = {
            "name": pilier.get("pilier", "Unknown Pillar"),
            "description": pilier.get("description", ""),
            "sub_categories": []
        }

        branches = pilier.get("branches", {})
        for branche_name, branche_data in branches.items():
            # Branche -> Sub-Category
            sub_category = {
                "name": branche_name,
                "description": branche_data.get("description", ""),
                "sub_sub_categories": []
            }

            sous_branches = branche_data.get("sous_branches", {}) if "sous_branches" in branche_data else branche_data.get("niveaux", {}) # Sometimes branches go straight to levels? Need to check.
            
            # Check structure consistency. 
            # In existing file: Pilier -> branches -> sous_branches -> niveaux -> variantes
            # But sometimes might skip? Let's look at the file content I viewed earlier.
            # Pilier 4 -> Intérêts -> Sports -> Sports Individuels -> Variantes.
            # It seems consistent: Branches -> Sous-Branches -> Niveaux -> Variantes.
            
            # Wait, looking at file view:
            # "branches": { "Mode & Maroquinerie": { "sous_branches": { "Sacs": { "niveaux": { "Types": ... } } } } }
            
            # If "niveaux" is directly under "branches" without "sous_branches", we need to handle it.
            # But the user asked for strict "Category, Sub, Sub-Sub...".
            # I will traverse strictly.
            
            if "sous_branches" in branche_data:
                for sous_branche_name, sous_branche_data in branche_data["sous_branches"].items():
                    # Sous-Branche -> Sub-Sub-Category
                    sub_sub_category = {
                        "name": sous_branche_name,
                        "description": sous_branche_data.get("description", ""),
                        "sub_sub_sub_categories": []
                    }
                    
                    niveaux = sous_branche_data.get("niveaux", {})
                    for niveau_name, niveau_data in niveaux.items():
                        # Niveau -> Sub-Sub-Sub-Category
                        sub_sub_sub_category = {
                            "name": niveau_name,
                            "description": niveau_data.get("description", ""),
                            "sub_sub_sub_sub_categories": niveau_data.get("variantes", [])
                        }
                        sub_sub_category["sub_sub_sub_categories"].append(sub_sub_sub_category)
                    
                    sub_category["sub_sub_categories"].append(sub_sub_category)

            category["sub_categories"].append(sub_category)
        
        new_taxonomy.append(category)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(new_taxonomy, f, ensure_ascii=False, indent=2)
    
    print(f"Transformed taxonomy saved to {output_file}")

if __name__ == "__main__":
    transform_taxonomy("Taxonomie_v2_hierarchique.json", "Taxonomie_v3_structured.json")
