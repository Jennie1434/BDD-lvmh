import pandas as pd
import logging

def rank_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Step 3: Rank data by importance (LVMH General Classification).
    Ordering rules:
    1. VIP Tags
    2. Complaints (Requires immediate action)
    3. Category Priority (e.g., Jewelry/Leather Goods > Perfume)
    4. Date of interaction (Recent first)
    """
    logging.info("Starting data ranking...")

    # Define Category Weights
    category_weights = {
        "High Jewelry": 5,
        "Leather Goods": 4,
        "Ready-to-Wear": 3,
        "Perfume": 2,
        "General": 1,
        "Uncategorized": 0
    }

    def calculate_score(row):
        score = 0
        # Priority for VIPs
        if "Tags" in row and "VIP" in row["Tags"]:
            score += 10
        # Priority for Complaints (Risk management)
        if "Tags" in row and "Complaint" in row["Tags"]:
            score += 20 
        
        # Category weight
        cat = row.get("Category", "General")
        score += category_weights.get(cat, 1)

        return score

    df['Priority_Score'] = df.apply(calculate_score, axis=1)
    
    # Sort by Score (Descending) and then by Date if available
    sort_cols = ['Priority_Score']
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        sort_cols.append('date')
        ascending_order = [False, False]
    else:
        ascending_order = [False]

    df_sorted = df.sort_values(by=sort_cols, ascending=ascending_order)
    
    logging.info("Data ranking complete.")
    return df_sorted
