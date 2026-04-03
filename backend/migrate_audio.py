"""Migration script to add audio columns to talks table"""
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load .env from script directory
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

DATABASE_URL = (
    f"postgresql://{os.getenv('DATABASE_USER')}:{os.getenv('DATABASE_PASSWORD')}"
    f"@{os.getenv('DATABASE_HOST')}:{os.getenv('DATABASE_PORT')}/{os.getenv('DATABASE_NAME')}"
)
print("Connecting to database...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check if columns exist
    result = conn.execute(text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'talks' AND column_name IN ('audio_data', 'audio_mime_type')
    """))
    existing_cols = [row[0] for row in result.fetchall()]

    if 'audio_data' not in existing_cols:
        print("Adding audio_data column...")
        conn.execute(text("ALTER TABLE talks ADD COLUMN audio_data BYTEA"))
        conn.commit()
        print("Done!")
    else:
        print("audio_data column already exists")

    if 'audio_mime_type' not in existing_cols:
        print("Adding audio_mime_type column...")
        conn.execute(text("ALTER TABLE talks ADD COLUMN audio_mime_type VARCHAR(50)"))
        conn.commit()
        print("Done!")
    else:
        print("audio_mime_type column already exists")

print("Migration complete!")
