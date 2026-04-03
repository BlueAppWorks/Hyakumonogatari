from sqlalchemy.orm import Session
from sqlalchemy import and_
import models
import schemas
from typing import Optional
import hashlib
import base64
import threading
from database import SessionLocal

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

# Events
def create_event(db: Session, event: schemas.EventCreate) -> models.Event:
    password_hash = hash_password(event.password) if event.password else None
    db_event = models.Event(
        name=event.name,
        candle_count=event.candle_count,
        time_limit_seconds=event.time_limit_seconds,
        mode=event.mode,
        password_hash=password_hash,
        icon_emoji=event.icon_emoji,
        icon_image_url=event.icon_image_url,
        background_image_url=event.background_image_url,
        title_color=event.title_color,
        candle_style=event.candle_style,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_event(db: Session, event_id: str) -> Optional[models.Event]:
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Event).order_by(models.Event.created_at.desc()).offset(skip).limit(limit).all()

def update_event(db: Session, event_id: str, event: schemas.EventUpdate) -> Optional[models.Event]:
    db_event = get_event(db, event_id)
    if not db_event:
        return None

    update_data = event.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)

    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: str) -> bool:
    db_event = get_event(db, event_id)
    if not db_event:
        return False
    db.delete(db_event)
    db.commit()
    return True

# Participants
def create_participant(db: Session, event_id: str, participant: schemas.ParticipantCreate) -> models.Participant:
    db_participant = models.Participant(
        event_id=event_id,
        nickname=participant.nickname,
        icon_index=participant.icon_index,
    )
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)
    return db_participant

def get_participants(db: Session, event_id: str):
    return db.query(models.Participant).filter(models.Participant.event_id == event_id).all()

def delete_participant(db: Session, participant_id: str) -> bool:
    db_participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
    if not db_participant:
        return False
    db.delete(db_participant)
    db.commit()
    return True

# Talks
def create_or_update_talk(db: Session, event_id: str, talk: schemas.TalkCreate) -> models.Talk:
    db_talk = db.query(models.Talk).filter(
        and_(models.Talk.event_id == event_id, models.Talk.slot_number == talk.slot_number)
    ).first()

    # Decode audio if provided
    audio_data = None
    if talk.audio_base64:
        audio_data = base64.b64decode(talk.audio_base64)

    if db_talk:
        db_talk.speaker_id = talk.speaker_id
        db_talk.transcript = talk.transcript
        db_talk.is_completed = talk.is_completed
        if audio_data:
            db_talk.audio_data = audio_data
            db_talk.audio_mime_type = talk.audio_mime_type
    else:
        db_talk = models.Talk(
            event_id=event_id,
            slot_number=talk.slot_number,
            speaker_id=talk.speaker_id,
            transcript=talk.transcript,
            is_completed=talk.is_completed,
            audio_data=audio_data,
            audio_mime_type=talk.audio_mime_type,
        )
        db.add(db_talk)

    db.commit()
    db.refresh(db_talk)

    # Transcribe audio in background if present and no transcript yet
    if audio_data and not db_talk.transcript:
        talk_id = db_talk.id
        mime_type = talk.audio_mime_type or "audio/webm"
        thread = threading.Thread(
            target=transcribe_in_background,
            args=(talk_id, audio_data, mime_type)
        )
        thread.start()

    return db_talk


def transcribe_in_background(talk_id: str, audio_data: bytes, mime_type: str):
    """Run transcription in background thread"""
    from transcribe import transcribe_audio

    print(f"[Background] Transcribing talk {talk_id}...")
    try:
        transcript = transcribe_audio(audio_data, mime_type)

        # Update database with new session
        db = SessionLocal()
        try:
            db_talk = db.query(models.Talk).filter(models.Talk.id == talk_id).first()
            if db_talk:
                db_talk.transcript = transcript
                db.commit()
                print(f"[Background] Transcription complete: {transcript[:80]}..." if len(transcript) > 80 else f"[Background] Transcription complete: {transcript}")
        finally:
            db.close()
    except Exception as e:
        print(f"[Background] Transcription failed: {e}")

def update_talk(db: Session, talk_id: str, talk: schemas.TalkUpdate) -> Optional[models.Talk]:
    db_talk = db.query(models.Talk).filter(models.Talk.id == talk_id).first()
    if not db_talk:
        return None

    update_data = talk.model_dump(exclude_unset=True)

    # Handle audio separately
    if 'audio_base64' in update_data:
        audio_base64 = update_data.pop('audio_base64')
        if audio_base64:
            db_talk.audio_data = base64.b64decode(audio_base64)

    for key, value in update_data.items():
        setattr(db_talk, key, value)

    db.commit()
    db.refresh(db_talk)
    return db_talk

def get_talk(db: Session, talk_id: str) -> Optional[models.Talk]:
    return db.query(models.Talk).filter(models.Talk.id == talk_id).first()

def get_talk_by_slot(db: Session, event_id: str, slot_number: int) -> Optional[models.Talk]:
    return db.query(models.Talk).filter(
        and_(models.Talk.event_id == event_id, models.Talk.slot_number == slot_number)
    ).first()

def get_talks(db: Session, event_id: str):
    return db.query(models.Talk).filter(models.Talk.event_id == event_id).order_by(models.Talk.slot_number).all()

def reset_talks(db: Session, event_id: str) -> bool:
    db.query(models.Talk).filter(models.Talk.event_id == event_id).delete()
    db.commit()
    return True
