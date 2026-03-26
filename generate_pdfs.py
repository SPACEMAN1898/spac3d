#!/usr/bin/env python3
"""
Generate branded PDF clinical documents for The Adelaide Disc Center.
Applies brand guidelines: Poppins font, navy #0f2a70 / gold #f4c702 palette,
uniform layout, auto-capitalisation of first name + FULL CAPS last name.
"""

import os
from weasyprint import HTML

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(_SCRIPT_DIR, "output")

FONT_DIR = os.path.expanduser("~/.local/share/fonts/poppins")

# ── Brand colours ──────────────────────────────────────────────────────────
NAVY   = "#0f2a70"
GOLD   = "#f4c702"
LIGHT  = "#eef5f5"
WHITE  = "#ffffff"
DARK   = "#263c56"
GREY   = "#87a3aa"

# ── Shared CSS (brandbook: Poppins, navy/gold, clean spacious layout) ─────
BASE_CSS = f"""
@font-face {{
    font-family: 'Poppins';
    src: url('file://{FONT_DIR}/Poppins-Regular.ttf');
    font-weight: 400;
    font-style: normal;
}}
@font-face {{
    font-family: 'Poppins';
    src: url('file://{FONT_DIR}/Poppins-Medium.ttf');
    font-weight: 500;
    font-style: normal;
}}
@font-face {{
    font-family: 'Poppins';
    src: url('file://{FONT_DIR}/Poppins-SemiBold.ttf');
    font-weight: 600;
    font-style: normal;
}}
@font-face {{
    font-family: 'Poppins';
    src: url('file://{FONT_DIR}/Poppins-Bold.ttf');
    font-weight: 700;
    font-style: normal;
}}
@font-face {{
    font-family: 'Poppins';
    src: url('file://{FONT_DIR}/Poppins-Italic.ttf');
    font-weight: 400;
    font-style: italic;
}}

@page {{
    size: A4;
    margin: 0;
}}

* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    font-family: 'Poppins', sans-serif;
    font-size: 9.5pt;
    color: {NAVY};
    line-height: 1.5;
}}

.page {{
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    page-break-after: always;
    position: relative;
}}

.page:last-child {{
    page-break-after: auto;
}}

/* ── Header bar ─────────────────────────────────────────────────────── */
.header {{
    background: {NAVY};
    color: {WHITE};
    padding: 18mm 15mm 5mm 15mm;
    position: relative;
}}

.header::after {{
    content: '';
    display: block;
    height: 3px;
    background: {GOLD};
    margin-top: 12px;
}}

.header-logo {{
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 14pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: {WHITE};
    margin-bottom: 4px;
}}

.header-logo .disc-center {{
    display: block;
    font-size: 13pt;
    letter-spacing: 3px;
    position: relative;
    padding-left: 0;
}}

.header-logo .disc-center::before {{
    content: '– ';
    color: {GOLD};
}}
.header-logo .disc-center::after {{
    content: ' –';
    color: {GOLD};
}}

.header-subtitle {{
    font-size: 10pt;
    font-weight: 500;
    color: {GOLD};
    margin-top: 10px;
    letter-spacing: 1px;
}}

.header-meta {{
    font-size: 8.5pt;
    font-weight: 400;
    color: rgba(255,255,255,0.85);
    margin-top: 6px;
    line-height: 1.6;
}}

/* ── Content area ───────────────────────────────────────────────────── */
.content {{
    padding: 10mm 15mm 15mm 15mm;
}}

/* ── Section headings ───────────────────────────────────────────────── */
.section-title {{
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 11pt;
    color: {NAVY};
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 14px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 2px solid {GOLD};
}}

.section-title-sm {{
    font-weight: 600;
    font-size: 9.5pt;
    color: {NAVY};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 12px;
    margin-bottom: 6px;
}}

/* ── Tables ──────────────────────────────────────────────────────────── */
table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
}}

table.info-table td {{
    padding: 4px 8px;
    vertical-align: top;
    font-size: 9pt;
}}

table.info-table td.label {{
    font-weight: 600;
    color: {NAVY};
    width: 48%;
    white-space: nowrap;
}}

table.info-table td.value {{
    font-weight: 400;
    color: {DARK};
}}

table.data-table {{
    border: 1px solid {NAVY};
    margin-top: 6px;
}}

table.data-table th {{
    background: {NAVY};
    color: {WHITE};
    font-weight: 600;
    font-size: 8.5pt;
    padding: 5px 8px;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}

table.data-table td {{
    padding: 4px 8px;
    font-size: 9pt;
    border-bottom: 1px solid #dde4e8;
    color: {DARK};
}}

table.data-table tr:nth-child(even) td {{
    background: {LIGHT};
}}

/* ── Score boxes ─────────────────────────────────────────────────────── */
.score-row {{
    display: flex;
    gap: 12px;
    margin: 10px 0;
    flex-wrap: wrap;
}}

.score-box {{
    background: {LIGHT};
    border-left: 3px solid {GOLD};
    padding: 8px 14px;
    flex: 1;
    min-width: 120px;
}}

.score-box .score-label {{
    font-size: 7.5pt;
    font-weight: 600;
    color: {GREY};
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}

.score-box .score-value {{
    font-size: 16pt;
    font-weight: 700;
    color: {NAVY};
    margin-top: 2px;
}}

.score-box .score-sub {{
    font-size: 7.5pt;
    color: {DARK};
    font-weight: 400;
}}

/* ── Metric cards ────────────────────────────────────────────────────── */
.metrics-grid {{
    display: flex;
    gap: 10px;
    margin: 10px 0;
    flex-wrap: wrap;
}}

.metric-card {{
    flex: 1;
    min-width: 100px;
    text-align: center;
    background: {WHITE};
    border: 1px solid {NAVY};
    border-radius: 4px;
    padding: 8px 6px;
}}

.metric-card .metric-label {{
    font-size: 7pt;
    font-weight: 600;
    color: {GREY};
    text-transform: uppercase;
}}

.metric-card .metric-value {{
    font-size: 18pt;
    font-weight: 700;
    color: {NAVY};
}}

.metric-card .metric-sub {{
    font-size: 7pt;
    color: {DARK};
    font-style: italic;
}}

/* ── Explanations / paragraphs ───────────────────────────────────────── */
p {{
    margin-bottom: 6px;
    font-size: 9pt;
    color: {DARK};
}}

p strong {{
    color: {NAVY};
}}

.explanation-block {{
    background: {LIGHT};
    padding: 8px 12px;
    margin: 6px 0;
    border-left: 3px solid {NAVY};
    font-size: 8.5pt;
}}

.explanation-block .exp-label {{
    font-weight: 600;
    color: {NAVY};
    font-size: 8.5pt;
    text-transform: uppercase;
    margin-bottom: 2px;
}}

/* ── Footer ──────────────────────────────────────────────────────────── */
.footer {{
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: {NAVY};
    color: rgba(255,255,255,0.7);
    font-size: 7pt;
    padding: 6px 15mm;
    text-align: center;
}}

.footer .gold-line {{
    height: 2px;
    background: {GOLD};
    margin-bottom: 4px;
}}

/* ── Consent section ─────────────────────────────────────────────────── */
.consent-item {{
    padding: 4px 0;
    border-bottom: 1px solid #e0e5ea;
    font-size: 8.5pt;
}}

.consent-item .consent-label {{
    font-weight: 500;
    color: {NAVY};
}}

.consent-item .consent-value {{
    color: {DARK};
    font-style: italic;
}}

/* ── QA row for questionnaires ───────────────────────────────────────── */
.qa-row {{
    display: flex;
    padding: 5px 0;
    border-bottom: 1px solid #e8ecef;
}}

.qa-row .qa-q {{
    flex: 1;
    font-size: 8.5pt;
    color: {DARK};
    padding-right: 10px;
}}

.qa-row .qa-a {{
    width: 50px;
    text-align: center;
    font-weight: 700;
    color: {NAVY};
    font-size: 11pt;
}}

/* ── Category badges ─────────────────────────────────────────────────── */
.badge {{
    display: inline-block;
    padding: 3px 10px;
    border-radius: 3px;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}

.badge-yellow {{
    background: {GOLD};
    color: {NAVY};
}}

.badge-navy {{
    background: {NAVY};
    color: {WHITE};
}}

.badge-green {{
    background: #2e7d32;
    color: {WHITE};
}}

/* ── Signature ───────────────────────────────────────────────────────── */
.signature-block {{
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px solid {NAVY};
    font-size: 8.5pt;
}}

/* ── Welcome text ────────────────────────────────────────────────────── */
.welcome-text {{
    font-size: 9pt;
    color: {DARK};
    line-height: 1.6;
    margin-bottom: 10px;
}}
"""


def wrap_html(body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>{BASE_CSS}</style>
</head>
<body>
{body_html}
</body>
</html>"""


def header_block(subtitle: str, name: str = "Nick WEILAND", dob: str = "31/10/1998", date: str = "26/03/2026", extra_meta: str = "") -> str:
    meta_lines = f"<strong>Name:</strong> {name} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Date of Birth:</strong> {dob} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Date:</strong> {date}"
    if extra_meta:
        meta_lines += f" &nbsp;&nbsp;|&nbsp;&nbsp; {extra_meta}"
    return f"""<div class="header">
    <div class="header-logo">
        The Adelaide
        <span class="disc-center">Disc Center</span>
    </div>
    <div class="header-subtitle">{subtitle}</div>
    <div class="header-meta">{meta_lines}</div>
</div>"""


def footer_block(page_num: str = "") -> str:
    pn = f" &nbsp;|&nbsp; {page_num}" if page_num else ""
    return f"""<div class="footer">
    <div class="gold-line"></div>
    The Adelaide Disc Center &nbsp;|&nbsp; Ph: 0403 831 243 &nbsp;|&nbsp; admin@theadelaidedisccenter.com.au{pn}
</div>"""


def to_pdf(html_str: str, filename: str) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, filename)
    HTML(string=html_str).write_pdf(out_path)
    print(f"  ✓ {out_path}")


# ════════════════════════════════════════════════════════════════════════════
# 1. IC: CHIRO (Initial Consultation)
# ════════════════════════════════════════════════════════════════════════════
def gen_ic_chiro():
    page1 = f"""<div class="page">
{header_block("Initial Consultation: Chiropractic")}
<div class="content">

<div class="welcome-text">
<p><strong>Welcome &amp; Introduction</strong></p>
<p>Welcome to our practice, and thank you for taking the first step towards your wellness journey with us. We're dedicated to providing you with personalised care, and this questionnaire is a crucial part of understanding your unique health needs.</p>
<p>While the form may seem long, every question has a purpose and your responses will help us tailor our approach to ensure the best possible outcomes for you.</p>
<p>We appreciate your time, effort and patience in filling out this form. <strong>Thank you.</strong></p>
</div>

<div class="section-title">Identifying Information</div>
<table class="info-table">
<tr><td class="label">Title</td><td class="value">Mr</td></tr>
<tr><td class="label">First Names</td><td class="value">Nick</td></tr>
<tr><td class="label">Last Name</td><td class="value">WEILAND</td></tr>
<tr><td class="label">Date of Birth</td><td class="value">31/10/1998</td></tr>
<tr><td class="label">Contact Number (Mobile)</td><td class="value">0477 016 988</td></tr>
<tr><td class="label">Address</td><td class="value">J</td></tr>
<tr><td class="label">Email</td><td class="value">nick@weiland.com.au</td></tr>
</table>

<div class="section-title">Work or Study Demands</div>
<table class="info-table">
<tr><td class="label">Occupation</td><td class="value">Student</td></tr>
<tr><td class="label">Work Cover Claim</td><td class="value">No</td></tr>
<tr><td class="label">Work/Study Status</td><td class="value">Work (Full Time)</td></tr>
<tr><td class="label">Work/Study Involves</td><td class="value">Extended sitting</td></tr>
<tr><td class="label">Hours per Week</td><td class="value">5</td></tr>
<tr><td class="label">Days per Week</td><td class="value">6</td></tr>
<tr><td class="label">Commute Time per Day</td><td class="value">30 minutes</td></tr>
<tr><td class="label">Hours on PC per Day</td><td class="value">4–6</td></tr>
</table>

<div class="section-title">Hobbies</div>
<table class="info-table">
<tr><td class="label">Hobbies</td><td class="value">Other</td></tr>
</table>

<div class="section-title">Medications &amp; Family History</div>
<table class="info-table">
<tr><td class="label">Family History</td><td class="value">Not that I am aware of</td></tr>
<tr><td class="label">Smoke</td><td class="value">No</td></tr>
<tr><td class="label">Alcohol</td><td class="value">No</td></tr>
<tr><td class="label">Coffee</td><td class="value">No</td></tr>
<tr><td class="label">Water Intake</td><td class="value">2L per day</td></tr>
<tr><td class="label">Soft Drinks / Fruit Juice</td><td class="value">No</td></tr>
<tr><td class="label">Motor Vehicle Accident</td><td class="value">No</td></tr>
</table>

</div>
{footer_block("Page 1 of 3")}
</div>"""

    page2 = f"""<div class="page">
{header_block("Initial Consultation: Chiropractic")}
<div class="content">

<div class="section-title">What Brings You in Today?</div>
<table class="info-table">
<tr><td class="label">Complaint 1 (Main Issue)</td><td class="value">Neck</td></tr>
<tr><td class="label">Complaint 2</td><td class="value">Pain</td></tr>
<tr><td class="label">Suspected Cause</td><td class="value">Posture</td></tr>
<tr><td class="label">Sensation</td><td class="value">Sharp, Shooting</td></tr>
<tr><td class="label">Aggravating Factors</td><td class="value">Sitting, Standing</td></tr>
<tr><td class="label">Relieving Factors</td><td class="value">Massage</td></tr>
<tr><td class="label">Pain Worse</td><td class="value">During the night</td></tr>
<tr><td class="label">Pain Trend</td><td class="value">Not sure</td></tr>
<tr><td class="label">Severity (0–10)</td><td class="value"><strong>7</strong></td></tr>
</table>

<div class="section-title">Consent to Therapy</div>

<div class="consent-item">
    <span class="consent-label">Moist Heat Therapy:</span>
    <span class="consent-value">Acknowledged – informed of risks and benefits</span>
</div>
<div class="consent-item">
    <span class="consent-label">Non-Surgical Spinal Decompression (NSSD):</span>
    <span class="consent-value">Acknowledged – informed of risks and benefits</span>
</div>
<div class="consent-item">
    <span class="consent-label">Cryotherapy:</span>
    <span class="consent-value">Acknowledged – informed of risks and benefits</span>
</div>
<div class="consent-item">
    <span class="consent-label">PBM / LLLT / Cold Laser Therapy:</span>
    <span class="consent-value">Acknowledged – informed of risks and benefits</span>
</div>
<div class="consent-item">
    <span class="consent-label">Chiropractic Care:</span>
    <span class="consent-value">Acknowledged – informed of risks and benefits</span>
</div>

</div>
{footer_block("Page 2 of 3")}
</div>"""

    page3 = f"""<div class="page">
{header_block("Initial Consultation: Chiropractic")}
<div class="content">

<div class="section-title">Thank You &amp; Acceptance</div>

<p>Thank you for taking the time to complete this initial questionnaire. I realise there are many questions, some of which may seem obscure. Please rest assured that each question has a specific purpose. My goal is to provide every patient with the highest standard of care possible, and the information you've provided is invaluable in assisting with this process.</p>

<p style="margin-top: 12px;">Kind Regards,<br/><strong>TADC Team</strong></p>

<div class="signature-block">
    <p><strong>Patient Confirmation (Full Name):</strong> Nick WEILAND</p>
</div>

</div>
{footer_block("Page 3 of 3")}
</div>"""

    to_pdf(wrap_html(page1 + page2 + page3), "IC_CHIRO_Nick_WEILAND_20260326.pdf")


# ════════════════════════════════════════════════════════════════════════════
# 2. NSSD: STANDARD
# ════════════════════════════════════════════════════════════════════════════
def gen_nssd_standard():
    body = f"""<div class="page">
{header_block("NSSD: Standard Treatment Session")}
<div class="content">

<div class="section-title">NSSD Patient Information</div>
<table class="info-table">
<tr><td class="label">Preferred Name</td><td class="value">Nick</td></tr>
<tr><td class="label">NSSD Type</td><td class="value">Lx (Lumbar – Lower Back)</td></tr>
<tr><td class="label">Checklist</td><td class="value">Safety, 5 min, Lx</td></tr>
<tr><td class="label">Moist Heat</td><td class="value">Moist Heat: Lumbar</td></tr>
<tr><td class="label">Patient Weight</td><td class="value">76 Kg</td></tr>
<tr><td class="label">NSSD Pre-checks</td><td class="value">No issues</td></tr>
</table>

<div class="section-title">Treatment Parameters</div>
<table class="info-table">
<tr><td class="label">NSSD Region</td><td class="value">Lumbar</td></tr>
<tr><td class="label">NSSD Program</td><td class="value">P2</td></tr>
<tr><td class="label">Target Segment</td><td class="value">L5/S1</td></tr>
<tr><td class="label">Treatment Angle</td><td class="value">0 Degrees</td></tr>
<tr><td class="label">Treatment Time</td><td class="value">25 Minutes</td></tr>
<tr><td class="label">Max Treatment Force</td><td class="value">20 Kg</td></tr>
<tr><td class="label">Cryotherapy Settings</td><td class="value">6 min, Lx brace</td></tr>
</table>

<div class="section-title">Outcome Measures</div>
<div class="score-row">
    <div class="score-box">
        <div class="score-label">BMQ #1</div>
        <div class="score-value">25</div>
    </div>
    <div class="score-box">
        <div class="score-label">ODI #1</div>
        <div class="score-value">25</div>
        <div class="score-sub">25%</div>
    </div>
</div>

<div class="section-title">Session Notes</div>
<table class="info-table">
<tr><td class="label">NSSD Response</td><td class="value">The Same (No Difference)</td></tr>
<tr><td class="label">General Session Notes</td><td class="value">Good</td></tr>
<tr><td class="label">NSSD Graph Printed &amp; Given</td><td class="value">Yes</td></tr>
<tr><td class="label">All Relevant Info Collected</td><td class="value">Yes</td></tr>
<tr><td class="label">Acceptance</td><td class="value">Confirmed</td></tr>
</table>

<div class="section-title">Care Plan</div>
<table class="info-table">
<tr><td class="label">Phase of Care</td><td class="value">1</td></tr>
<tr><td class="label">Frequency of Care</td><td class="value">3x week</td></tr>
</table>

</div>
{footer_block()}
</div>"""
    to_pdf(wrap_html(body), "Nick_WEILAND_NSSD_STANDARD.pdf")


# ════════════════════════════════════════════════════════════════════════════
# 3. Bournemouth Back Questionnaire
# ════════════════════════════════════════════════════════════════════════════
def gen_bmq_back():
    qs = [
        ("Q1", "Over the past week, how intense has your pain been?", "8"),
        ("Q2", "Over the past week, how much has your pain affected your everyday activities?", "5"),
        ("Q3", "Over the past week, how much has your pain affected your ability to carry out your work or housework?", "6"),
        ("Q4", "Over the past week, how much has your pain affected you socially (going out, etc)?", "4"),
        ("Q5", "Over the past week, how anxious (uptight, tense, irritable) have you felt?", "6"),
        ("Q6", "Over the past week, how depressed (downhearted, sad) have you felt?", "7"),
        ("Q7", "Over the past week, how much have you felt that your pain will last forever?", "8"),
    ]

    qa_html = ""
    for qn, qt, ans in qs:
        qa_html += f"""<div class="qa-row">
    <div class="qa-q"><strong>{qn}:</strong> {qt}</div>
    <div class="qa-a">{ans}</div>
</div>
"""

    body = f"""<div class="page">
{header_block("Bournemouth Back Questionnaire")}
<div class="content">

<div class="score-row">
    <div class="score-box">
        <div class="score-label">Score</div>
        <div class="score-value">44</div>
        <div class="score-sub">out of 70</div>
    </div>
    <div class="score-box">
        <div class="score-label">Percentage</div>
        <div class="score-value">63%</div>
    </div>
    <div class="score-box">
        <div class="score-label">Total Questions</div>
        <div class="score-value">7</div>
    </div>
</div>

<div class="section-title">Responses</div>
{qa_html}

</div>
{footer_block()}
</div>"""
    to_pdf(wrap_html(body), "Nick_WEILAND_bmq_back.pdf")


# ════════════════════════════════════════════════════════════════════════════
# 4. NSSD Assessment (CliniTrack)
# ════════════════════════════════════════════════════════════════════════════
def gen_nssd_assessment():
    body = f"""<div class="page">
{header_block("CliniTrack: Assess – NSSD Assessment", extra_meta="<strong>PT ID:</strong> 1642554783682275182")}
<div class="content">

<div class="score-row">
    <div class="score-box">
        <div class="score-label">Safety Status</div>
        <div class="score-value"><span class="badge badge-yellow">Yellow</span></div>
    </div>
    <div class="score-box">
        <div class="score-label">Category</div>
        <div class="score-value">Five</div>
    </div>
</div>

<div class="section-title">Assessment Outcome</div>
<table class="info-table">
<tr><td class="label">Pathway Decision</td><td class="value">Hold – further assessment before decompression</td></tr>
<tr><td class="label">Visit Recommendation</td><td class="value">Recommended Action: Detailed Clinical Evaluation</td></tr>
</table>

<div class="section-title">Category Interpretation</div>
<div class="explanation-block">
<div class="exp-label">Further Clinical Assessment Required</div>
<p>Your assessment results indicate that the information currently available does not clearly support immediate classification as a suitable candidate for spinal decompression therapy.</p>
<p>This may occur when symptom patterns, clinical indicators, imaging findings or safety screening responses suggest the need for additional clinical evaluation before treatment decisions are made.</p>
<p>Further assessment may include a detailed physical examination, imaging review or consideration of other potential causes of symptoms.</p>
</div>

<div class="section-title">Overall Interpretation</div>
<p>Additional clinical assessment is recommended before determining whether Non-Surgical Spinal Decompression therapy is appropriate.</p>
<p style="font-style: italic; font-size: 8pt; margin-top: 8px;">This screening tool is not a diagnostic instrument and cannot replace a full clinical evaluation.</p>

<div class="section-title">How We Assessed</div>

<div class="section-title-sm">Safety Status</div>
<p>Your assessment identified caution factors that should be clarified or monitored during any decompression program.</p>

<div class="section-title-sm">Disc Confidence</div>
<p>Your assessment does not currently support a clearly disc-dominant presentation. The strongest competing signal is <strong>Dominant competing pattern: SI joint (score 3)</strong>. Further examination, correlation with imaging, and/or alternative management should be considered before committing to a decompression program.</p>

</div>
{footer_block()}
</div>"""
    to_pdf(wrap_html(body), "Nick_WEILAND_NSSD_Assessment.pdf")


# ════════════════════════════════════════════════════════════════════════════
# 5/6/7. Progress Reports (Weeks 4, 8, 12) – reusable template
# ════════════════════════════════════════════════════════════════════════════
def gen_progress_report(week, rts_val, rts_desc, csi_val, csi_desc,
                         avg_b, avg_c, worst_b, worst_c,
                         odi_b, odi_c, bdq_b, bdq_c,
                         sit_b, sit_c, stand_b, stand_c,
                         walk_b, walk_c, stiff_b, stiff_c,
                         pgic, pgic_score,
                         pain_pct, pain_cls, odi_pct, odi_cls,
                         bdq_pct, bdq_cls, func_score, func_cls,
                         pain_summary, disability_summary,
                         functional_summary, patient_perception,
                         clinician_summary, patient_explanation,
                         recommended_action, filename):

    def change_val(b, c):
        try:
            ib, ic = int(b), int(c)
            if ib > ic:
                return f"+{ib - ic}"
            if ic > ib:
                return f"-{ic - ib}"
            return "0"
        except ValueError:
            return "Improved"

    page1 = f"""<div class="page">
{header_block(f"CliniTrack: Progress Clinical Report – Week {week}", date="26/03/2026")}
<div class="content">

<div class="score-row">
    <div class="score-box">
        <div class="score-label">RTS (Recovery Trajectory Score)</div>
        <div class="score-value">{rts_val}</div>
        <div class="score-sub">{rts_desc}</div>
    </div>
    <div class="score-box">
        <div class="score-label">CSI (Clinical Significance Index)</div>
        <div class="score-value">{csi_val}</div>
        <div class="score-sub">{csi_desc}</div>
    </div>
</div>

<div class="section-title">Baseline vs Current Comparison</div>
<table class="data-table">
<tr><th>Measure</th><th>Baseline</th><th>Current</th><th>Change</th></tr>
<tr><td>Average Pain Last Week</td><td>{avg_b}</td><td>{avg_c}</td><td>{change_val(avg_b, avg_c)}</td></tr>
<tr><td>Worst Pain Last Week</td><td>{worst_b}</td><td>{worst_c}</td><td>{change_val(worst_b, worst_c)}</td></tr>
<tr><td>ODI</td><td>{odi_b}</td><td>{odi_c}</td><td>{change_val(odi_b, odi_c)}</td></tr>
<tr><td>BDQ</td><td>{bdq_b}</td><td>{bdq_c}</td><td>{change_val(bdq_b, bdq_c)}</td></tr>
<tr><td>Sitting Tolerance</td><td>{sit_b}</td><td>{sit_c}</td><td>Improved</td></tr>
<tr><td>Standing Tolerance</td><td>{stand_b}</td><td>{stand_c}</td><td>Improved</td></tr>
<tr><td>Walking Tolerance</td><td>{walk_b}</td><td>{walk_c}</td><td>Improved</td></tr>
<tr><td>Morning Stiffness</td><td>{stiff_b}</td><td>{stiff_c}</td><td>Improved</td></tr>
<tr><td>PGIC</td><td>–</td><td>{pgic}</td><td>Score {pgic_score}</td></tr>
</table>

<div class="section-title">Outcome Summary</div>
<div class="metrics-grid">
    <div class="metric-card">
        <div class="metric-label">Pain</div>
        <div class="metric-value">{pain_pct}</div>
        <div class="metric-sub">{pain_cls}</div>
    </div>
    <div class="metric-card">
        <div class="metric-label">ODI</div>
        <div class="metric-value">{odi_pct}</div>
        <div class="metric-sub">{odi_cls}</div>
    </div>
    <div class="metric-card">
        <div class="metric-label">BDQ</div>
        <div class="metric-value">{bdq_pct}</div>
        <div class="metric-sub">{bdq_cls}</div>
    </div>
    <div class="metric-card">
        <div class="metric-label">Function</div>
        <div class="metric-value">{func_score}</div>
        <div class="metric-sub">{func_cls}</div>
    </div>
</div>

</div>
{footer_block("Page 1 of 2")}
</div>"""

    page2 = f"""<div class="page">
{header_block(f"CliniTrack: Progress Clinical Report – Week {week}", date="26/03/2026")}
<div class="content">

<div class="section-title">Clinical Explanations</div>

<div class="explanation-block">
    <div class="exp-label">Pain Summary</div>
    <p>{pain_summary}</p>
</div>

<div class="explanation-block">
    <div class="exp-label">Disability Summary</div>
    <p>{disability_summary}</p>
</div>

<div class="explanation-block">
    <div class="exp-label">Functional Summary</div>
    <p>{functional_summary}</p>
</div>

<div class="explanation-block">
    <div class="exp-label">Patient Perception</div>
    <p>{patient_perception}</p>
</div>

<div class="explanation-block">
    <div class="exp-label">Clinician Summary</div>
    <p>{clinician_summary}</p>
</div>

<div class="section-title">Patient Explanation</div>
<p>{patient_explanation}</p>

<div class="section-title">Recommended Action</div>
<p><strong>{recommended_action}</strong></p>

</div>
{footer_block("Page 2 of 2")}
</div>"""

    to_pdf(wrap_html(page1 + page2), filename)


# ════════════════════════════════════════════════════════════════════════════
# 8. Oswestry Back Disability Index
# ════════════════════════════════════════════════════════════════════════════
def gen_ows_back():
    qs = [
        ("Q1", "Over the past week, how intense has your pain been?", "2"),
        ("Q2", "Over the past week, how much has pain affected personal care?", "3"),
        ("Q3", "Over the past week, how much has pain affected lifting?", "2"),
        ("Q4", "Over the past week, how much has pain affected walking?", "3"),
        ("Q5", "Over the past week, how much has pain affected sitting?", "4"),
        ("Q6", "Over the past week, how much has pain affected standing?", "2"),
        ("Q7", "Over the past week, how much has pain affected sleeping?", "3"),
        ("Q8", "Over the past week, how much has pain affected social life?", "4"),
        ("Q9", "Over the past week, how much has pain affected travelling?", "2"),
        ("Q10", "Over the past week, how has pain changed overall function?", "3"),
    ]

    qa_html = ""
    for qn, qt, ans in qs:
        qa_html += f"""<div class="qa-row">
    <div class="qa-q"><strong>{qn}:</strong> {qt}</div>
    <div class="qa-a">{ans}</div>
</div>
"""

    body = f"""<div class="page">
{header_block("Oswestry Back Disability Index")}
<div class="content">

<div class="score-row">
    <div class="score-box">
        <div class="score-label">Score</div>
        <div class="score-value">28</div>
        <div class="score-sub">out of 50</div>
    </div>
    <div class="score-box">
        <div class="score-label">Percentage</div>
        <div class="score-value">56%</div>
    </div>
    <div class="score-box">
        <div class="score-label">Total Questions</div>
        <div class="score-value">10</div>
    </div>
</div>

<div class="section-title">Responses</div>
{qa_html}

</div>
{footer_block()}
</div>"""
    to_pdf(wrap_html(body), "Nick_WEILAND_ows_back.pdf")


# ════════════════════════════════════════════════════════════════════════════
# MAIN – Generate all PDFs
# ════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("Generating branded PDFs...")

    gen_ic_chiro()
    gen_nssd_standard()
    gen_bmq_back()
    gen_nssd_assessment()

    gen_progress_report(
        week=4, rts_val=8, rts_desc="Moderate improvement",
        csi_val=6, csi_desc="Moderate improvement",
        avg_b="9", avg_c="5", worst_b="10", worst_c="6",
        odi_b="25", odi_c="15", bdq_b="25", bdq_c="16",
        sit_b="10–30 min", sit_c="30–60 min",
        stand_b="10–30 min", stand_c="30–60 min",
        walk_b="10–30 min", walk_c="30–60 min",
        stiff_b="30–60 min", stiff_c="10–30 min",
        pgic="Slightly improved", pgic_score="5",
        pain_pct="44.4%", pain_cls="clinically meaningful",
        odi_pct="40.0%", odi_cls="clinically meaningful",
        bdq_pct="36.0%", bdq_cls="partial",
        func_score="4/4", func_cls="improving",
        pain_summary="Pain has improved in a meaningful way, although further gains are still possible. Continue care and monitor the trend.",
        disability_summary="At least one disability measure has improved meaningfully. The overall direction is positive, but continued monitoring is appropriate.",
        functional_summary="Sitting, standing, walking, and morning stiffness all suggest strong functional recovery. This is one of the clearest signs that the patient is improving.",
        patient_perception="The patient notices only slight improvement. This may still be acceptable early on, but progress should continue to be monitored.",
        clinician_summary="The patient is improving in a meaningful way, although recovery is still underway. Continue care and monitor progress at the next review.",
        patient_explanation="You are making steady progress. There is clear improvement, even though recovery is still continuing. Staying consistent with the plan should help build on these gains.",
        recommended_action="Modify treatment emphasis and monitor more closely.",
        filename="Nick_WEILAND_Progress_report_4.pdf"
    )

    gen_progress_report(
        week=8, rts_val=9, rts_desc="Strong recovery trajectory",
        csi_val=8, csi_desc="Good outcome",
        avg_b="9", avg_c="4", worst_b="10", worst_c="5",
        odi_b="25", odi_c="9", bdq_b="25", bdq_c="8",
        sit_b="10–30 min", sit_c=">60 min",
        stand_b="10–30 min", stand_c=">60 min",
        walk_b="10–30 min", walk_c=">60 min",
        stiff_b="30–60 min", stiff_c="10–30 min",
        pgic="Slightly improved", pgic_score="5",
        pain_pct="55.6%", pain_cls="clinically meaningful",
        odi_pct="64.0%", odi_cls="clinically meaningful",
        bdq_pct="68.0%", bdq_cls="clinically meaningful",
        func_score="4/4", func_cls="improving",
        pain_summary="Pain has improved strongly and exceeds the threshold usually considered clinically meaningful. This supports continuing the current treatment direction.",
        disability_summary="Disability scores show clear and clinically important improvement. The patient is coping better functionally and psychosocially.",
        functional_summary="Sitting, standing, walking, and morning stiffness all suggest strong functional recovery. This is one of the clearest signs that the patient is improving.",
        patient_perception="The patient notices only slight improvement. This may still be acceptable early on, but progress should continue to be monitored.",
        clinician_summary="The patient is showing a strong and clinically meaningful response to care. Pain, disability, function and patient-rated improvement all support continuing the current plan.",
        patient_explanation="Your results are very encouraging. Pain is down, daily function has improved, and your back is coping much better with normal activities. These changes suggest that treatment is helping and that you should stay the course.",
        recommended_action="Continue care and re-check at the next scheduled progress exam.",
        filename="Nick_WEILAND_Progress_report_8.pdf"
    )

    gen_progress_report(
        week=12, rts_val=12, rts_desc="Strong recovery trajectory",
        csi_val=12, csi_desc="Excellent outcome",
        avg_b="9", avg_c="1", worst_b="10", worst_c="2",
        odi_b="25", odi_c="4", bdq_b="25", bdq_c="3",
        sit_b="10–30 min", sit_c=">60 min",
        stand_b="10–30 min", stand_c=">60 min",
        walk_b="10–30 min", walk_c=">60 min",
        stiff_b="30–60 min", stiff_c="<10 min",
        pgic="Very much improved", pgic_score="7",
        pain_pct="88.9%", pain_cls="clinically meaningful",
        odi_pct="84.0%", odi_cls="clinically meaningful",
        bdq_pct="88.0%", bdq_cls="clinically meaningful",
        func_score="4/4", func_cls="improving",
        pain_summary="Pain has improved strongly and exceeds the threshold usually considered clinically meaningful. This supports continuing the current treatment direction.",
        disability_summary="Disability scores show clear and clinically important improvement. The patient is coping better functionally and psychosocially.",
        functional_summary="Sitting, standing, walking, and morning stiffness all suggest strong functional recovery. This is one of the clearest signs that the patient is improving.",
        patient_perception="The patient feels very much improved, which strongly supports the validity of the measured changes.",
        clinician_summary="The patient is showing a strong and clinically meaningful response to care. Pain, disability, function and patient-rated improvement all support continuing the current plan.",
        patient_explanation="Your results are very encouraging. Pain is down, daily function has improved, and your back is coping much better with normal activities. These changes suggest that treatment is helping and that you should stay the course.",
        recommended_action="Continue current care plan. Reinforce progress and compliance.",
        filename="Nick_WEILAND_Progress_report_12.pdf"
    )

    gen_ows_back()

    print(f"\nAll 8 PDFs generated in {OUTPUT_DIR}/")
