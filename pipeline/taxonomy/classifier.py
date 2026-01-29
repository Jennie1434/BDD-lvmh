import pandas as pd
import logging

# Mock Taxonomy Rules (This would normally come from the 'taxonomie' branch)
TAXONOMY_RULES = {
    "Categories": {
        "Leather Goods": ["bag", "wallet", "leather", "purse", "canvas"],
        "jewelry": ["ring", "necklace", "gold", "silver", "diamond"],
        "Perfume": ["scent", "fragrance", "cologne", "edp", "edt"],
        "Ready-to-Wear": ["dress", "shirt", "coat", "jacket", "size"]
    },
    "Tags": {
        "VIP": ["high spender", "frequent", "loyal", "vip"],
        "Complaint": ["issue", "problem", "broken", "return", "refund"],
        "Gift": ["birthday", "anniversary", "spouse", "present"]
    }
}

def apply_taxonomy(df: pd.DataFrame, text_column: str = 'description') -> pd.DataFrame:
    """
    Step 2: Classify data based on taxonomy rules.
    Adds 'Category' and 'Tags' columns.
    """
    logging.info("Starting taxonomy classification...")

    if text_column not in df.columns:
        logging.warning(f"Column '{text_column}' not found. Skipping classification.")
        return df

    def get_category(text):
        if not isinstance(text, str): return "Uncategorized"
        text = text.lower()
        for cat, keywords in TAXONOMY_RULES["Categories"].items():
            if any(k in text for k in keywords):
                return cat
        return "General"

    def get_tags(text):
        if not isinstance(text, str): return []
        text = text.lower()
        tags = []
        for tag, keywords in TAXONOMY_RULES["Tags"].items():
            if any(k in text for k in keywords):
                tags.append(tag)
        return tags

    df['Category'] = df[text_column].apply(get_category)
    df['Tags'] = df[text_column].apply(get_tags)
    
    logging.info("Taxonomy classification complete.")
    return df
