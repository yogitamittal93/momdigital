import pandas as pd
import os
import logging

logger = logging.getLogger(__name__)

def process_dhs_to_insights(dta_path: str, output_folder: str):
    """
    Read DHS file in chunks to handle large files on low-memory machines.
    """
    print(f"Loading {dta_path} in chunks — large file mode...")

    filename = os.path.basename(dta_path).upper()
    insights = []

    try:
        # Read in chunks of 10,000 rows at a time
        reader = pd.read_stata(
            dta_path,
            convert_categoricals=False,
            chunksize=10000,        # ← key fix for memory error
            convert_missing=False   # ← key fix for the bool allocation error
        )

        total_rows = 0
        for chunk in reader:
            total_rows += len(chunk)

            if 'PR' in filename:
                insights.extend(process_pr_file(chunk))
            elif 'IR' in filename:
                insights.extend(process_ir_file(chunk))
            elif 'KR' in filename:
                insights.extend(process_kr_file(chunk))
            elif 'BR' in filename:
                insights.extend(process_br_file(chunk))

            # Deduplicate as we go to keep memory low
            seen = set()
            unique = []
            for item in insights:
                if item['text'] not in seen:
                    seen.add(item['text'])
                    unique.append(item)
            insights = unique

        print(f"Loaded: {total_rows} total rows processed")

    except Exception as e:
        print(f"Error reading file: {e}")
        print("Make sure you are using the .DTA file, not .FRQ/.FRW/.DAT files")
        return None

    # Write insights to text file
    os.makedirs(output_folder, exist_ok=True)
    out_filename = os.path.basename(dta_path).replace('.DTA', '').replace('.dta', '')
    out_path = os.path.join(output_folder, f"{out_filename}_insights.txt")

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(f"# NFHS-5 Data Insights — {out_filename}\n")
        f.write(f"# Source: Demographic and Health Surveys Program, India 2019-21\n\n")
        for insight in insights:
            f.write(insight['text'] + "\n\n")

    print(f"✓ {len(insights)} insights written to {out_path}")
    return out_path

def process_pr_file(df: pd.DataFrame) -> list:
    """Household Member Recode — nutrition, anaemia, BMI"""
    insights = []
    total = len(df)

    try:
        # Anaemia in women (hv103 = slept in household,
        # hv105 = age, hb55 = anaemia level)
        if 'hb55' in df.columns:
            anaemic = df[df['hb55'].isin([1, 2, 3])]
            pct = round(len(anaemic) / total * 100, 1)
            insights.append(
                f"According to NFHS-5 household data, approximately {pct}% of "
                f"surveyed household members showed signs of anaemia. "
                f"Iron-rich foods like spinach, methi, dates, and jaggery are "
                f"strongly recommended for pregnant and lactating women in India."
            )
    except Exception as e:
        logger.warning(f"PR anaemia processing: {e}")

    try:
        # Mosquito net / malaria prevention
        if 'hv227' in df.columns:
            net_users = df[df['hv227'] == 1]
            pct = round(len(net_users) / total * 100, 1)
            insights.append(
                f"NFHS-5 data shows {pct}% of households use mosquito nets. "
                f"Malaria prevention is especially important during pregnancy "
                f"as malaria significantly increases risk of low birth weight."
            )
    except Exception as e:
        logger.warning(f"PR net processing: {e}")

    insights.append(
        "NFHS-5 (National Family Health Survey 2019-21) is India's most comprehensive "
        "household health survey covering over 600,000 households across all states. "
        "It provides ground-level data on maternal nutrition, child health, "
        "immunization coverage, and healthcare access across India."
    )

    return insights


def process_ir_file(df: pd.DataFrame) -> list:
    """Women's Individual Recode — ANC, breastfeeding, nutrition"""
    insights = []

    try:
        # ANC visits (m14_1 = number of ANC visits for last birth)
        if 'm14_1' in df.columns:
            anc_data = df['m14_1'].dropna()
            adequate = anc_data[anc_data >= 4]
            pct = round(len(adequate) / len(anc_data) * 100, 1)
            insights.append(
                f"According to NFHS-5, {pct}% of Indian mothers received 4 or more "
                f"antenatal care visits during their last pregnancy. "
                f"WHO recommends a minimum of 8 ANC contacts. "
                f"Regular ANC visits help detect gestational diabetes, anaemia, "
                f"and hypertension early."
            )
    except Exception as e:
        logger.warning(f"IR ANC processing: {e}")

    try:
        # Breastfeeding initiation within 1 hour (m4_1 or m34)
        bf_col = 'm34' if 'm34' in df.columns else None
        if bf_col:
            bf_data  = df[bf_col].dropna()
            within1h = bf_data[bf_data == 1]
            pct = round(len(within1h) / len(bf_data) * 100, 1)
            insights.append(
                f"NFHS-5 data shows {pct}% of Indian mothers initiated breastfeeding "
                f"within 1 hour of birth. Early breastfeeding provides colostrum — "
                f"the first milk rich in antibodies — which is critical for newborn "
                f"immunity. Both WHO and IAP strongly recommend breastfeeding within "
                f"the first hour of delivery."
            )
    except Exception as e:
        logger.warning(f"IR breastfeeding processing: {e}")

    try:
        # Iron supplementation (v463a or similar)
        if 'v463a' in df.columns:
            iron_data = df['v463a'].dropna()
            took_iron = iron_data[iron_data == 1]
            pct = round(len(took_iron) / len(iron_data) * 100, 1)
            insights.append(
                f"NFHS-5 shows {pct}% of pregnant women took iron supplements "
                f"during pregnancy. NHM provides free IFA (Iron Folic Acid) tablets "
                f"to all pregnant women through Anganwadi and ASHA workers. "
                f"Iron deficiency anaemia affects over 50% of pregnant Indian women."
            )
    except Exception as e:
        logger.warning(f"IR iron processing: {e}")

    return insights


def process_kr_file(df: pd.DataFrame) -> list:
    """Children's Recode — immunization, feeding, growth"""
    insights = []

    try:
        # BCG vaccination (h2)
        if 'h2' in df.columns:
            bcg_data = df['h2'].dropna()
            vaccinated = bcg_data[bcg_data.isin([1, 2, 3])]
            pct = round(len(vaccinated) / len(bcg_data) * 100, 1)
            insights.append(
                f"NFHS-5 data shows {pct}% of Indian children received BCG vaccine. "
                f"BCG is given at birth and protects against tuberculosis. "
                f"It is the first vaccine in the IAP immunization schedule "
                f"and should be given before the baby leaves the hospital."
            )
    except Exception as e:
        logger.warning(f"KR BCG processing: {e}")

    try:
        # Diarrhoea treatment (h11)
        if 'h11' in df.columns:
            diarr_data = df['h11'].dropna()
            had_diarr  = diarr_data[diarr_data == 1]
            pct = round(len(had_diarr) / len(diarr_data) * 100, 1)
            insights.append(
                f"According to NFHS-5, {pct}% of children under 5 had diarrhoea "
                f"in the 2 weeks before the survey. "
                f"ORS (Oral Rehydration Solution) and zinc supplementation are the "
                f"first-line treatment. Breastfeeding should continue during diarrhoea. "
                f"Ayurveda recommends pomegranate juice and buttermilk with cumin "
                f"for mild diarrhoea in older infants."
            )
    except Exception as e:
        logger.warning(f"KR diarrhoea processing: {e}")

    try:
        # Complementary feeding (v409 or m4)
        if 'v409' in df.columns:
            cf_data  = df['v409'].dropna()
            cf_start = cf_data[cf_data == 1]
            pct = round(len(cf_start) / len(cf_data) * 100, 1)
            insights.append(
                f"NFHS-5 shows {pct}% of children received complementary foods "
                f"at the appropriate age (6 months). "
                f"WHO recommends exclusive breastfeeding for 6 months followed by "
                f"introduction of soft, mashed home foods. "
                f"First foods for Indian babies include mashed dal-rice (khichdi), "
                f"mashed banana, and soft-cooked vegetables."
            )
    except Exception as e:
        logger.warning(f"KR complementary feeding processing: {e}")

    return insights


def process_br_file(df: pd.DataFrame) -> list:
    """Births Recode — delivery, postnatal care"""
    insights = []

    try:
        # Institutional delivery (m15)
        if 'm15' in df.columns:
            del_data  = df['m15'].dropna()
            inst_del  = del_data[del_data.isin([20, 21, 22, 23, 26])]
            pct = round(len(inst_del) / len(del_data) * 100, 1)
            insights.append(
                f"NFHS-5 shows {pct}% of births in India were institutional deliveries. "
                f"Institutional delivery ensures skilled birth attendance, "
                f"emergency obstetric care access, and immediate newborn care "
                f"including BCG vaccination and early breastfeeding support."
            )
    except Exception as e:
        logger.warning(f"BR delivery processing: {e}")

    try:
        # Postnatal check within 2 days (m50 or m55)
        pnc_col = 'm55_1' if 'm55_1' in df.columns else ('m50' if 'm50' in df.columns else None)
        if pnc_col:
            pnc_data  = df[pnc_col].dropna()
            within2d  = pnc_data[pnc_data == 1]
            pct = round(len(within2d) / len(pnc_data) * 100, 1)
            insights.append(
                f"NFHS-5 data shows {pct}% of mothers received a postnatal check "
                f"within 2 days of delivery. "
                f"WHO recommends postnatal contact within 24 hours for all mothers. "
                f"Postpartum checks monitor bleeding, infection, breastfeeding, "
                f"and signs of postpartum depression."
            )
    except Exception as e:
        logger.warning(f"BR PNC processing: {e}")

    return insights