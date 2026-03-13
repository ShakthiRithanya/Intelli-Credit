"""
database.py — Database-agnostic persistence layer (SQLite/PostgreSQL) for Intelli-Credit.
"""

import sqlite3
import os
import json
from datetime import datetime

# Optional: PostgreSQL support
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

# ─── Configuration ───────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL")
IS_POSTGRES = DATABASE_URL and (DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"))

# Fallback for SQLite
RENDER_DISK_PATH = "/opt/render/project/src/data"
DATA_DIR = RENDER_DISK_PATH if os.path.exists(RENDER_DISK_PATH) else os.path.join(os.path.dirname(__file__), '..', 'data')
SQLITE_PATH = os.path.join(DATA_DIR, 'intellicredit.db')

# ─── Schema ───────────────────────────────────────────────────────────────────
# Postgres uses SERIAL for auto-increment, SQLite uses AUTOINCREMENT
SCHEMA_SQLITE = """
CREATE TABLE IF NOT EXISTS applications (
    application_id      TEXT PRIMARY KEY,
    company_id          TEXT NOT NULL,
    company_name        TEXT NOT NULL,
    sector              TEXT,
    gstin               TEXT,
    requested_amount    REAL,
    loan_purpose        TEXT,
    contact_email       TEXT,
    ai_risk_class       TEXT,
    ai_confidence       REAL,
    ai_sanctioned_amount REAL,
    ai_interest_rate    REAL,
    ai_summary          TEXT,
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

SCHEMA_POSTGRES = """
CREATE TABLE IF NOT EXISTS applications (
    application_id      TEXT PRIMARY KEY,
    company_id          TEXT NOT NULL,
    company_name        TEXT NOT NULL,
    sector              TEXT,
    gstin               TEXT,
    requested_amount    DOUBLE PRECISION,
    loan_purpose        TEXT,
    contact_email       TEXT,
    ai_risk_class       TEXT,
    ai_confidence       DOUBLE PRECISION,
    ai_sanctioned_amount DOUBLE PRECISION,
    ai_interest_rate    DOUBLE PRECISION,
    ai_summary          TEXT,
    status              TEXT DEFAULT 'under_review',
    officer_decision    TEXT,
    officer_notes       TEXT,
    final_sanctioned    DOUBLE PRECISION,
    final_rate          DOUBLE PRECISION,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
    id          SERIAL PRIMARY KEY,
    app_id      TEXT,
    action      TEXT,
    actor       TEXT,
    detail      TEXT,
    ts          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"""

# ─── Connection Utilities ─────────────────────────────────────────────────────

def get_conn():
    if IS_POSTGRES:
        if not POSTGRES_AVAILABLE:
            raise ImportError("psycopg2-binary is required for PostgreSQL support.")
        
        # Handle Render's internal/external URL swap if needed
        # (Usually Render gives postgres:// but psycopg2 prefers postgresql://)
        url = DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        
        conn = psycopg2.connect(url, cursor_factory=RealDictCursor)
        conn.autocommit = True
        return conn
    else:
        os.makedirs(os.path.dirname(SQLITE_PATH), exist_ok=True)
        conn = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

def q_mark():
    """Returns the parameter placeholder for the current DB."""
    return "%s" if IS_POSTGRES else "?"

def init_db():
    conn = get_conn()
    if IS_POSTGRES:
        with conn.cursor() as cur:
            cur.execute(SCHEMA_POSTGRES)
    else:
        conn.executescript(SCHEMA_SQLITE)
    conn.commit()
    conn.close()

# ─── Application CRUD ─────────────────────────────────────────────────────────

def create_application(app_id: str, data: dict):
    conn = get_conn()
    m = q_mark()
    sql = f"""
        INSERT INTO applications
            (application_id, company_id, company_name, sector, gstin,
             requested_amount, loan_purpose, contact_email, status, created_at, updated_at)
        VALUES ({m}, {m}, {m}, {m}, {m}, {m}, {m}, {m}, 'under_review', {m}, {m})
    """
    ts = datetime.utcnow().isoformat()
    params = (
        app_id,
        data['company_id'],
        data['company_name'],
        data.get('sector', ''),
        data.get('gstin', ''),
        data.get('requested_amount', 0),
        data.get('loan_purpose', ''),
        data.get('contact_email', ''),
        ts, ts
    )
    
    if IS_POSTGRES:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            cur.execute(f"INSERT INTO audit_log (app_id, action, actor) VALUES ({m}, {m}, {m})", (app_id, 'created', 'borrower'))
    else:
        conn.execute(sql, params)
        conn.execute(f"INSERT INTO audit_log (app_id, action, actor) VALUES ({m}, {m}, {m})", (app_id, 'created', 'borrower'))
        conn.commit()
    conn.close()

def update_ai_score(app_id: str, risk_class: str, confidence: float,
                    sanctioned: float, rate: float, summary: str):
    conn = get_conn()
    m = q_mark()
    sql = f"""
        UPDATE applications SET
            ai_risk_class={m}, ai_confidence={m}, ai_sanctioned_amount={m},
            ai_interest_rate={m}, ai_summary={m}, updated_at={m}
        WHERE application_id={m}
    """
    params = (risk_class, confidence, sanctioned, rate, summary, datetime.utcnow().isoformat(), app_id)
    
    if IS_POSTGRES:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            cur.execute(f"INSERT INTO audit_log (app_id, action, actor, detail) VALUES ({m},{m},{m},{m})",
                         (app_id, 'ai_scored', 'engine', risk_class))
    else:
        conn.execute(sql, params)
        conn.execute(f"INSERT INTO audit_log (app_id, action, actor, detail) VALUES ({m},{m},{m},{m})",
                     (app_id, 'ai_scored', 'engine', risk_class))
        conn.commit()
    conn.close()

def officer_decide(app_id: str, decision: str, notes: str,
                   final_sanctioned: float, final_rate: float):
    status = 'approved' if decision == 'approve' else ('rejected' if decision == 'reject' else 'pending_review')
    conn = get_conn()
    m = q_mark()
    sql = f"""
        UPDATE applications SET
            status={m}, officer_decision={m}, officer_notes={m},
            final_sanctioned={m}, final_rate={m}, updated_at={m}
        WHERE application_id={m}
    """
    params = (status, decision, notes, final_sanctioned, final_rate, datetime.utcnow().isoformat(), app_id)
    
    if IS_POSTGRES:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            cur.execute(f"INSERT INTO audit_log (app_id, action, actor, detail) VALUES ({m},{m},{m},{m})",
                         (app_id, f'officer_{decision}', 'officer', notes))
    else:
        conn.execute(sql, params)
        conn.execute(f"INSERT INTO audit_log (app_id, action, actor, detail) VALUES ({m},{m},{m},{m})",
                     (app_id, f'officer_{decision}', 'officer', notes))
        conn.commit()
    conn.close()

def get_application(app_id: str):
    conn = get_conn()
    m = q_mark()
    sql = f"SELECT * FROM applications WHERE application_id={m}"
    
    if IS_POSTGRES:
        with conn.cursor() as cur:
            cur.execute(sql, (app_id,))
            row = cur.fetchone()
    else:
        row = conn.execute(sql, (app_id,)).fetchone()
    
    conn.close()
    return dict(row) if row else None

def get_all_applications(status_filter: str = None):
    conn = get_conn()
    m = q_mark()
    if status_filter:
        sql = f"SELECT * FROM applications WHERE status={m} ORDER BY created_at DESC"
        params = (status_filter,)
    else:
        sql = "SELECT * FROM applications ORDER BY created_at DESC"
        params = ()

    if IS_POSTGRES:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
    else:
        rows = conn.execute(sql, params).fetchall()

    conn.close()
    return [dict(r) for r in rows]

def borrower_accept(app_id: str):
    conn = get_conn()
    m = q_mark()
    ts = datetime.utcnow().isoformat()
    sql = f"UPDATE applications SET status='accepted', updated_at={m} WHERE application_id={m}"
    
    if IS_POSTGRES:
        with conn.cursor() as cur:
            cur.execute(sql, (ts, app_id))
            cur.execute(f"INSERT INTO audit_log (app_id, action, actor) VALUES ({m},{m},{m})", (app_id, 'borrower_accepted', 'borrower'))
    else:
        conn.execute(sql, (ts, app_id))
        conn.execute(f"INSERT INTO audit_log (app_id, action, actor) VALUES ({m},{m},{m})", (app_id, 'borrower_accepted', 'borrower'))
        conn.commit()
    conn.close()

def borrower_review_request(app_id: str):
    conn = get_conn()
    m = q_mark()
    ts = datetime.utcnow().isoformat()
    sql = f"UPDATE applications SET status='review_requested', updated_at={m} WHERE application_id={m}"
    
    if IS_POSTGRES:
        with conn.cursor() as cur:
            cur.execute(sql, (ts, app_id))
            cur.execute(f"INSERT INTO audit_log (app_id, action, actor) VALUES ({m},{m},{m})", (app_id, 'review_requested', 'borrower'))
    else:
        conn.execute(sql, (ts, app_id))
        conn.execute(f"INSERT INTO audit_log (app_id, action, actor) VALUES ({m},{m},{m})", (app_id, 'review_requested', 'borrower'))
        conn.commit()
    conn.close()
