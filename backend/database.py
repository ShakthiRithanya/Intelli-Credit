"""
database.py — SQLite-backed persistence layer for Intelli-Credit.
All borrower applications are stored here and visible to both portals.
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'intellicredit.db')

# ─── Schema ───────────────────────────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS applications (
    application_id      TEXT PRIMARY KEY,
    company_id          TEXT NOT NULL,
    company_name        TEXT NOT NULL,
    sector              TEXT,
    gstin               TEXT,
    requested_amount    REAL,
    loan_purpose        TEXT,
    contact_email       TEXT,

    -- AI-derived fields (filled once scoring runs)
    ai_risk_class       TEXT,
    ai_confidence       REAL,
    ai_sanctioned_amount REAL,
    ai_interest_rate    REAL,
    ai_summary          TEXT,

    -- Officer decision fields
    status              TEXT DEFAULT 'under_review',
    officer_decision    TEXT,
    officer_notes       TEXT,
    final_sanctioned    REAL,
    final_rate          REAL,

    created_at          TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id      TEXT,
    action      TEXT,
    actor       TEXT,
    detail      TEXT,
    ts          TEXT DEFAULT CURRENT_TIMESTAMP
);
"""


def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row          # returns dict-like rows
    return conn


def init_db():
    conn = get_conn()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


# ─── Application CRUD ─────────────────────────────────────────────────────────
def create_application(app_id: str, data: dict):
    conn = get_conn()
    conn.execute("""
        INSERT INTO applications
            (application_id, company_id, company_name, sector, gstin,
             requested_amount, loan_purpose, contact_email, status, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?, 'under_review', ?, ?)
    """, (
        app_id,
        data['company_id'],
        data['company_name'],
        data.get('sector', ''),
        data.get('gstin', ''),
        data.get('requested_amount', 0),
        data.get('loan_purpose', ''),
        data.get('contact_email', ''),
        datetime.utcnow().isoformat(),
        datetime.utcnow().isoformat(),
    ))
    # Audit
    conn.execute("INSERT INTO audit_log (app_id, action, actor) VALUES (?,?,?)",
                 (app_id, 'created', 'borrower'))
    conn.commit()
    conn.close()


def update_ai_score(app_id: str, risk_class: str, confidence: float,
                    sanctioned: float, rate: float, summary: str):
    conn = get_conn()
    conn.execute("""
        UPDATE applications SET
            ai_risk_class=?, ai_confidence=?, ai_sanctioned_amount=?,
            ai_interest_rate=?, ai_summary=?, updated_at=?
        WHERE application_id=?
    """, (risk_class, confidence, sanctioned, rate, summary,
          datetime.utcnow().isoformat(), app_id))
    conn.execute("INSERT INTO audit_log (app_id, action, actor, detail) VALUES (?,?,?,?)",
                 (app_id, 'ai_scored', 'engine', risk_class))
    conn.commit()
    conn.close()


def officer_decide(app_id: str, decision: str, notes: str,
                   final_sanctioned: float, final_rate: float):
    status = 'approved' if decision == 'approve' else ('rejected' if decision == 'reject' else 'pending_review')
    conn = get_conn()
    conn.execute("""
        UPDATE applications SET
            status=?, officer_decision=?, officer_notes=?,
            final_sanctioned=?, final_rate=?, updated_at=?
        WHERE application_id=?
    """, (status, decision, notes, final_sanctioned, final_rate,
          datetime.utcnow().isoformat(), app_id))
    conn.execute("INSERT INTO audit_log (app_id, action, actor, detail) VALUES (?,?,?,?)",
                 (app_id, f'officer_{decision}', 'officer', notes))
    conn.commit()
    conn.close()


def get_application(app_id: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM applications WHERE application_id=?", (app_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_applications(status_filter: str = None):
    conn = get_conn()
    if status_filter:
        rows = conn.execute("SELECT * FROM applications WHERE status=? ORDER BY created_at DESC", (status_filter,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM applications ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def borrower_accept(app_id: str):
    conn = get_conn()
    conn.execute("UPDATE applications SET status='accepted', updated_at=? WHERE application_id=?",
                 (datetime.utcnow().isoformat(), app_id))
    conn.execute("INSERT INTO audit_log (app_id, action, actor) VALUES (?,?,?)",
                 (app_id, 'borrower_accepted', 'borrower'))
    conn.commit()
    conn.close()


def borrower_review_request(app_id: str):
    conn = get_conn()
    conn.execute("UPDATE applications SET status='review_requested', updated_at=? WHERE application_id=?",
                 (datetime.utcnow().isoformat(), app_id))
    conn.execute("INSERT INTO audit_log (app_id, action, actor) VALUES (?,?,?)",
                 (app_id, 'review_requested', 'borrower'))
    conn.commit()
    conn.close()
