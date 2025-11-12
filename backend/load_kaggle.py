import pandas as pd
from kaggle.api.kaggle_api_extended import KaggleApi
import zipfile, os, glob, schedule, time

api = KaggleApi()
api.authenticate()

# -------------------- Helper Functions -------------------- #

# Standard: 1 = UNHEALTHY, 0 = healthy/normal
def normalize_health_from_code(value):
    """PetFinder style: 1=Healthy, 2=Minor Injury, 3=Serious Injury.
       We convert to 0=healthy, 1=unhealthy."""
    if pd.isna(value):
        return 0
    try:
        v = int(value)
    except:
        return 0
    return 1 if v in (2, 3) else 0  # unhealthy if 2 or 3

def normalize_health_from_text(value):
    """Text intake condition → 1 if unhealthy words detected, else 0."""
    if pd.isna(value):
        return 0
    v = str(value).lower()
    return 1 if any(t in v for t in ['injur', 'sick', 'ill', 'medical']) else 0

def convert_days_to_speed(days):
    if pd.isna(days):
        return 4
    if days <= 0:  return 0
    if days <= 7:  return 1
    if days <= 30: return 2
    if days <= 90: return 3
    return 4

def map_speed_to_status(speed):
    """Binary adoption status from speed bucket."""
    if pd.isna(speed):
        return 0
    return 1 if speed in [0, 1, 2, 3] else 0

def safe_to_datetime(s):
    return pd.to_datetime(s, errors='coerce')

def normalize_type(series):
    s = series.astype(str).str.strip().str.lower()
    return s.replace({'1':'dog', '2':'cat'})

# -------------------- A. Load Core Datasets -------------------- #

def load_core_datasets():
    print("Loading base datasets...")

    # ---- Dataset 1
    d1 = 'rabieelkharoua/predict-pet-adoption-status-dataset'
    api.dataset_download_files(d1, path='.', quiet=True)
    with zipfile.ZipFile('predict-pet-adoption-status-dataset.zip') as z:
        with z.open('pet_adoption_data.csv') as f:
            df_1 = pd.read_csv(f)
    df_1_renamed = df_1.rename(columns={
        'PetType':'Type','AgeMonths':'Age','Breed':'Breed',
        'HealthCondition':'Health','AdoptionLikelihood':'Adoption_Status'
    })[['Type','Age','Breed','Health','Color','Adoption_Status']]
    # Make Health consistent (text or code? assume numeric-like here; flip if needed)
    df_1_renamed['Health'] = normalize_health_from_code(df_1_renamed['Health'])
    print(f"Dataset1 rows: {len(df_1_renamed)}")
    df_1_renamed.to_csv("dataset1_cats.csv", index=False)

    # ---- Dataset 2
    d2 = 'chaudharisanika/pet-adoption-records-with-animal-and-adopter-data'
    api.dataset_download_files(d2, path='.', quiet=True)
    with zipfile.ZipFile('pet-adoption-records-with-animal-and-adopter-data.zip') as z:
        with z.open('pet_adoption_center.csv') as f:
            df_2 = pd.read_csv(f)

    df_2['arrival_date'] = safe_to_datetime(df_2['arrival_date'])
    df_2['adoption_date'] = safe_to_datetime(df_2['adoption_date'])
    df_2['days_until_adoption'] = (df_2['adoption_date'] - df_2['arrival_date']).dt.days
    df_2.loc[df_2['adopted'] == 0, 'days_until_adoption'] = None
    df_2['AdoptionSpeed'] = df_2['days_until_adoption'].apply(convert_days_to_speed)
    df_2['AgeMonths'] = (df_2['age_years'] * 12).round(0)
    df_2['Adoption_Status'] = df_2['AdoptionSpeed'].apply(map_speed_to_status)

    df_2_renamed = df_2.rename(columns={'species':'Type','breed':'Breed','color':'Color'})[
        ['Type','AgeMonths','Color','Breed','Adoption_Status','AdoptionSpeed']
    ].rename(columns={'AgeMonths':'Age'})
    # No explicit health column → fill with 0 (healthy)
    df_2_renamed['Health'] = 0
    print(f"Dataset2 rows: {len(df_2_renamed)}")
    df_2_renamed.to_csv("dataset2_cats.csv", index=False)

    # ---- Dataset 3 (PetFinder comp) – optional if local files exist
    df_3_renamed = pd.DataFrame()
    try:
        df_3 = pd.read_csv("data/train.csv")
        df_3['Adoption_Status'] = df_3['AdoptionSpeed'].apply(map_speed_to_status)

        breed_df = pd.read_csv("data/BreedLabels.csv")
        df_3 = df_3.merge(breed_df, how='left', left_on='Breed1', right_on='BreedID')
        df_3.rename(columns={'BreedName':'Breed'}, inplace=True)
        df_3.drop(['Breed1','BreedID'], axis=1, errors='ignore', inplace=True)

        color_df = pd.read_csv("data/ColorLabels.csv")
        df_3 = df_3.merge(color_df, how='left', left_on='Color1', right_on='ColorID')
        df_3.rename(columns={'ColorName':'Color'}, inplace=True)
        df_3.drop(['ColorID'], axis=1, errors='ignore', inplace=True)

        # Normalize health from PetFinder code
        df_3['Health'] = df_3['Health'].apply(normalize_health_from_code)

        # Standard columns
        keep = ['Type','Age','Breed','Color','Health','Adoption_Status','AdoptionSpeed']
        df_3_renamed = df_3[[c for c in keep if c in df_3.columns]].copy()
        print(f"Dataset3 rows: {len(df_3_renamed)}")
        df_3_renamed.to_csv("dataset3_cats.csv", index=False)
    except FileNotFoundError:
        print("PetFinder competition files not found in ./data; skipping Dataset 3.")

    # ---- Dataset 4
    d4 = 'thedevastator/analyzing-adoption-trends-at-the-bloomington-ani'
    api.dataset_download_files(d4, path='.', quiet=True)
    with zipfile.ZipFile('analyzing-adoption-trends-at-the-bloomington-ani.zip') as z:
        csv_file = [f for f in z.namelist() if f.endswith('.csv')][0]
        with z.open(csv_file) as f:
            df_4 = pd.read_csv(f)

    df_4 = df_4[df_4['speciesname'].str.lower() == 'cat'].copy()
    df_4['intake_date'] = safe_to_datetime(df_4['intakedate'])
    df_4['outcome_date'] = safe_to_datetime(df_4['movementdate'])
    df_4['days_until_outcome'] = (df_4['outcome_date'] - df_4['intake_date']).dt.days
    df_4['AdoptionSpeed'] = df_4['days_until_outcome'].apply(convert_days_to_speed)

    df_4_renamed = df_4.rename(columns={
        'speciesname':'Type',
        'breedname':'Breed',
        'basecolour':'Color',
        'intakereason':'IntakeReason',
        'returnedreason':'ReturnReason',
    })
    df_4_renamed['Adopted'] = 1
    cols_to_keep = ['Type','Breed','Color','IntakeReason','ReturnReason']
    df_4_renamed = df_4_renamed[[c for c in cols_to_keep if c in df_4_renamed.columns]]
    # No explicit health → 0
    df_4_renamed['Health'] = 0
    print(f"Dataset4 rows: {len(df_4_renamed)}")
    df_4_renamed.to_csv("dataset4_cats.csv", index=False)

    # ---- Dataset 5
    d5 = 'jackdaoud/animal-shelter-analytics'
    api.dataset_download_files(d5, path='.', quiet=True)
    with zipfile.ZipFile('animal-shelter-analytics.zip') as z:
        csv_file = [f for f in z.namelist() if f.endswith('.csv')][0]
        with z.open(csv_file) as f:
            df_5 = pd.read_csv(f)

    df_5 = df_5[df_5['Animal Type'].str.lower() == 'cat'].copy()
    df_5['Health'] = df_5['Intake Condition'].apply(normalize_health_from_text)
    df_5['IntakeReason'] = df_5['Intake Type'].astype(str).str.title()
    df_5_renamed = df_5.rename(columns={'Animal Type':'Type','Breed':'Breed','Color':'Color'})
    cols_to_keep = ['Type','Breed','Color','IntakeReason','Health']
    df_5_renamed = df_5_renamed[[c for c in cols_to_keep if c in df_5_renamed.columns]]
    print(f"Dataset5 rows: {len(df_5_renamed)}")
    df_5_renamed.to_csv("dataset5_cats.csv", index=False)

    # ---- Combine
    frames = [df_1_renamed, df_2_renamed, df_3_renamed, df_4_renamed, df_5_renamed]
    frames = [f for f in frames if not f.empty]
    combined = pd.concat(frames, ignore_index=True)

    # Standardize core cols & dtypes
    for col in ['Type','Age','Breed','Color','Health','Adoption_Status','AdoptionSpeed']:
        if col not in combined.columns:
            combined[col] = pd.NA

    combined['Type'] = normalize_type(combined['Type'])
    for col in ['Age','AdoptionSpeed','Adoption_Status','Health']:
        combined[col] = pd.to_numeric(combined[col], errors='coerce')

    print("Combined columns:", list(combined.columns))
    return combined

# -------------------- B. Load Latest Kaggle Dataset -------------------- #

def load_latest_kaggle_dataset():
    print("\nSearching for latest 'cat adoption' dataset...")
    datasets = api.dataset_list(search="cat adoption", sort_by="hottest")
    if not datasets:
        print("No datasets returned for query; skipping latest dataset.")
        return pd.DataFrame()

    latest_dataset = max(datasets, key=lambda d: d.last_updated)
    print(f"Found: {latest_dataset.title} ({latest_dataset.ref})")
    api.dataset_download_files(latest_dataset.ref, path='.', quiet=True)

    zip_name = latest_dataset.ref.split('/')[-1] + '.zip'
    if not os.path.exists(zip_name):
        # Some clients save as <slug>.zip regardless of ref path
        candidates = [f for f in os.listdir('.') if f.endswith('.zip')]
        zip_name = max(candidates, key=os.path.getmtime)

    with zipfile.ZipFile(zip_name, 'r') as zip_ref:
        zip_ref.extractall('.')

    # Prefer CSVs that look relevant
    csv_files = [f for f in glob.glob("*.csv") if any(k in f.lower() for k in ['cat','adopt','pet','shelter'])]
    if not csv_files:
        csv_files = glob.glob("*.csv")

    print("Detected CSVs:", csv_files)
    if not csv_files:
        print("No CSVs found in latest dataset, skipping.")
        return pd.DataFrame()

    df_new = pd.read_csv(csv_files[0])

    # Map column names where possible
    colmap = {}
    for c in df_new.columns:
        lc = c.lower()
        if lc in ['type','species']:             colmap[c] = 'Type'
        elif lc in ['breed','breedname']:        colmap[c] = 'Breed'
        elif lc in ['age','agemonths','age_months','ageyears','age_years']: colmap[c] = 'Age'
        elif lc in ['health','intake condition']: colmap[c] = 'Health'
        elif lc in ['adoption_status','adopted']: colmap[c] = 'Adoption_Status'

    df_new = df_new.rename(columns=colmap)
    keep = [c for c in ['Type','Age','Breed','Health','Adoption_Status','AdoptionSpeed','Color'] if c in df_new.columns]
    df_new = df_new[keep].copy()

    # Normalize fields
    if 'Type' in df_new: df_new['Type'] = normalize_type(df_new['Type'])
    if 'Health' in df_new:
        # Try numeric then text
        if pd.api.types.is_numeric_dtype(df_new['Health']):
            df_new['Health'] = df_new['Health'].apply(normalize_health_from_code)
        else:
            df_new['Health'] = df_new['Health'].apply(normalize_health_from_text)

    if 'Adoption_Status' in df_new and df_new['Adoption_Status'].dtype != 'int64':
        # Some datasets use True/False or Y/N
        df_new['Adoption_Status'] = df_new['Adoption_Status'].astype(str).str.lower().map(
            {'1':1,'true':1,'yes':1,'y':1,'0':0,'false':0,'no':0,'n':0}
        ).fillna(0).astype(int)

    print("Normalized columns:", df_new.columns.tolist())
    return df_new

# -------------------- Combine Both -------------------- #

def refresh_all_data():
    df_base = load_core_datasets()
    df_latest = load_latest_kaggle_dataset()
    combined_all = pd.concat([df_base, df_latest], ignore_index=True) if not df_latest.empty else df_base
    cats_only = combined_all[normalize_type(combined_all['Type']) == 'cat'].copy()
    cats_only.to_csv("combined_adoption_data_cats.csv", index=False)
    print("\ncombined_adoption_data_cats.csv updated successfully! Rows:", len(cats_only))

    # Clean up downloaded zips to keep the folder tidy
    for f in glob.glob("*.zip"):
        try:
            os.remove(f)
        except:
            pass

# -------------------- Scheduler -------------------- #

if __name__ == "__main__":
    refresh_all_data()
    schedule.every().monday.at("10:00").do(refresh_all_data)
    print("Auto-refresh scheduled every Monday at 10:00 AM...")
    while True:
        schedule.run_pending()
        time.sleep(60)
