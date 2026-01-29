import pandas as pd
import hashlib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def hash_data(value: str) -> str:
    """Hashes a string using SHA-256 for GDPR pseudo-anonymization."""
    if not isinstance(value, str):
        value = str(value)
    return hashlib.sha256(value.encode()).hexdigest()

def clean_and_anonymize(df: pd.DataFrame, pii_columns: list = None) -> pd.DataFrame:
    """
    Step 1: Clean data and anonymize PII.
    - Removes rows with critical missing values.
    - Hashes PII columns (GDPR).
    - Standardizes text formats.
    """
    if pii_columns is None:
        pii_columns = ['email', 'phone', 'full_name', 'address']

    logging.info(f"Starting cleaning process. Initial shape: {df.shape}")

    # 1. Remove rows where all data is missing
    df = df.dropna(how='all')

    # 2. Anonymization (GDPR)
    # We replace raw PII with hashes to allow matching without exposing clear text
    # Or we can drop them if not needed for uniqueness. 
    # Here, we assume we need to track unique users, so we hash.
    for col in pii_columns:
        if col in df.columns:
            logging.info(f"Anonymizing column: {col}")
            df[f'{col}_hash'] = df[col].apply(lambda x: hash_data(x) if pd.notnull(x) else x)
            # Drop the original clear-text column to ensure confidentiality
            df = df.drop(columns=[col])

    # 3. Handle specific 'null' values/junk
    # Replacing common placeholder text with actual NaN or removing
    junk_values = ["null", "n/a", "undefined", "none"]
    df = df.replace(junk_values, pd.NA)

    # 4. Filter out rows that don't have enough valid data (Arbitrary rule: at least 3 non-null columns)
    df = df.dropna(thresh=3)

    logging.info(f"Cleaning complete. Final shape: {df.shape}")
    return df
