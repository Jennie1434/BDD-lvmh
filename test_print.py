import gspread
from google.oauth2.service_account import Credentials
import pandas as pd
import time
from datetime import datetime
import re

# ===========================
# CONFIGURATION
# ===========================

SPREADSHEET_NAME = "Data_LVMH"
SOURCE_SHEET = "client_transcriptions"
TARGET_SHEET = "client_transcriptions_clean"
CREDENTIALS_FILE = "credentials.json"

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]
print('HELLO WORLD')
