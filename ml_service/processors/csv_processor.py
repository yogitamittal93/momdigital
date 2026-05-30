import pandas as pd
import os
import logging

logger = logging.getLogger(__name__)

def csv_to_insight_text(csv_path: str) -> list:
    filename = os.path.basename(csv_path).lower()
    try:
        df = pd.read_csv(csv_path, encoding='utf-8', on_bad_lines='skip')
    except UnicodeDecodeError:
        df = pd.read_csv(csv_path, encoding='latin-1', on_bad_lines='skip')

    logger.info(f"CSV loaded: {filename} — {len(df)} rows")

    if 'anganwadi' in filename or 'icds' in filename:
        return convert_anganwadi(df, filename)
    elif 'nfhs' in filename or 'rch' in filename or 'dhs' in filename:
        return convert_nfhs(df, filename)
    elif 'immuniz' in filename or 'vaccine' in filename:
        return convert_immunization(df, filename)
    elif 'nutrition' in filename or 'nin' in filename:
        return convert_nutrition(df, filename)
    else:
        return convert_generic(df, filename)


def convert_anganwadi(df: pd.DataFrame, source: str) -> list:
    insights = []
    for _, row in df.iterrows():
        try:
            state    = row.get('State', row.get('state', 'India'))
            district = row.get('District', row.get('district', ''))
            location = f"{district}, {state}" if district else str(state)

            preg = row.get('Pregnant Women Registered',
                   row.get('pregnant_women', None))
            if pd.notna(preg):
                insights.append({
                    "text": f"In {location}, {int(preg)} pregnant women were "
                            f"registered at Anganwadi centres for maternal "
                            f"nutrition support.",
                    "source": source, "category": "research"
                })

            anaemic = row.get('Anaemic Women', row.get('anaemic', None))
            if pd.notna(anaemic) and pd.notna(preg) and int(preg) > 0:
                pct = round((float(anaemic) / float(preg)) * 100, 1)
                insights.append({
                    "text": f"In {location}, {pct}% of registered pregnant women "
                            f"were found anaemic. Iron and folate supplementation "
                            f"is critical in this region.",
                    "source": source, "category": "research"
                })

            bf = row.get('Breastfeeding Mothers',
                 row.get('breastfeeding', None))
            if pd.notna(bf):
                insights.append({
                    "text": f"In {location}, {int(bf)} mothers were actively "
                            f"breastfeeding and receiving Anganwadi nutrition support.",
                    "source": source, "category": "research"
                })
        except Exception as e:
            logger.warning(f"Skipping row in {source}: {e}")
            continue

    logger.info(f"Anganwadi: generated {len(insights)} insights")
    return insights


def convert_nfhs(df: pd.DataFrame, source: str) -> list:
    insights = []
    for _, row in df.iterrows():
        try:
            state = row.get('State', row.get('state', 'India'))

            bf_hr = row.get('Breastfeeding within 1 hour',
                    row.get('bf_1hr', None))
            if pd.notna(bf_hr):
                insights.append({
                    "text": f"According to NFHS data for {state}, {bf_hr}% of "
                            f"mothers initiated breastfeeding within 1 hour of birth. "
                            f"WHO and IAP recommend immediate breastfeeding within "
                            f"the first hour for colostrum benefits.",
                    "source": source, "category": "research"
                })

            anc4 = row.get('4 or more ANC visits',
                   row.get('anc_4plus', None))
            if pd.notna(anc4):
                insights.append({
                    "text": f"In {state}, {anc4}% of pregnant women received 4 or "
                            f"more antenatal care visits. WHO recommends a minimum "
                            f"of 8 ANC contacts for a healthy pregnancy.",
                    "source": source, "category": "research"
                })

            stunt = row.get('Stunted children',
                    row.get('stunting', None))
            if pd.notna(stunt):
                insights.append({
                    "text": f"In {state}, {stunt}% of children under 5 are stunted. "
                            f"This indicates chronic malnutrition and highlights the "
                            f"importance of complementary feeding after 6 months.",
                    "source": source, "category": "research"
                })
        except Exception as e:
            logger.warning(f"Skipping row in {source}: {e}")
            continue

    logger.info(f"NFHS: generated {len(insights)} insights")
    return insights


def convert_immunization(df: pd.DataFrame, source: str) -> list:
    insights = []
    for _, row in df.iterrows():
        try:
            state = row.get('State', row.get('state', 'India'))
            bcg   = row.get('BCG', row.get('bcg_coverage', None))
            dpt3  = row.get('DPT3', row.get('dpt3_coverage', None))
            mcv   = row.get('Measles', row.get('measles_coverage', None))

            if pd.notna(bcg):
                insights.append({
                    "text": f"In {state}, BCG vaccine coverage is {bcg}%. "
                            f"BCG is given at birth to protect against tuberculosis.",
                    "source": source, "category": "mbbs"
                })
            if pd.notna(dpt3):
                insights.append({
                    "text": f"In {state}, DPT3 coverage is {dpt3}%. "
                            f"DPT is given at 6, 10, and 14 weeks.",
                    "source": source, "category": "mbbs"
                })
            if pd.notna(mcv):
                insights.append({
                    "text": f"In {state}, Measles vaccine coverage is {mcv}%. "
                            f"Measles vaccine is given at 9 months and 15-18 months.",
                    "source": source, "category": "mbbs"
                })
        except Exception as e:
            logger.warning(f"Skipping row in {source}: {e}")
            continue

    logger.info(f"Immunization: generated {len(insights)} insights")
    return insights


def convert_nutrition(df: pd.DataFrame, source: str) -> list:
    insights = []
    for _, row in df.iterrows():
        try:
            food = row.get('Food', row.get('food_name',
                   row.get('Item', str(row.iloc[0]))))

            energy  = row.get('Energy(kcal)', row.get('energy', None))
            protein = row.get('Protein(g)', row.get('protein', None))
            iron    = row.get('Iron(mg)', row.get('iron', None))
            calcium = row.get('Calcium(mg)', row.get('calcium', None))
            folate  = row.get('Folate(mcg)', row.get('folate', None))

            parts = [f"{food} is a nutritious Indian food."]
            if pd.notna(energy):  parts.append(f"It provides {energy} kcal per 100g.")
            if pd.notna(protein): parts.append(f"Protein: {protein}g per 100g.")
            if pd.notna(iron):    parts.append(f"Iron: {iron}mg per 100g.")
            if pd.notna(calcium): parts.append(f"Calcium: {calcium}mg per 100g.")
            if pd.notna(folate):  parts.append(f"Folate: {folate}mcg per 100g.")

            if len(parts) > 1:
                insights.append({
                    "text": ' '.join(parts),
                    "source": source, "category": "nutrition"
                })
        except Exception as e:
            logger.warning(f"Skipping row in {source}: {e}")
            continue

    logger.info(f"Nutrition: generated {len(insights)} insights")
    return insights


def convert_generic(df: pd.DataFrame, source: str) -> list:
    insights = []
    for _, row in df.iterrows():
        try:
            parts = [f"{col}: {row[col]}"
                     for col in df.columns
                     if pd.notna(row[col]) and str(row[col]).strip()]
            if parts:
                insights.append({
                    "text": ' | '.join(parts),
                    "source": source, "category": "research"
                })
        except Exception as e:
            logger.warning(f"Skipping row: {e}")
            continue
    return insights


def ingest_csv_folder(folder_path: str) -> list:
    all_insights = []
    if not os.path.exists(folder_path):
        logger.warning(f"CSV folder not found: {folder_path}")
        return all_insights

    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.csv'):
            path = os.path.join(folder_path, filename)
            logger.info(f"Processing CSV: {filename}")
            insights = csv_to_insight_text(path)
            all_insights.extend(insights)

    logger.info(f"Total CSV insights: {len(all_insights)}")
    return all_insights