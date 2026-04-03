from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import crud
from database import engine, get_db

def talk_to_response(talk: models.Talk) -> dict:
    """Convert Talk model to response dict with has_audio field"""
    return {
        "id": talk.id,
        "event_id": talk.event_id,
        "slot_number": talk.slot_number,
        "speaker_id": talk.speaker_id,
        "transcript": talk.transcript,
        "is_completed": talk.is_completed,
        "started_at": talk.started_at,
        "completed_at": talk.completed_at,
        "has_audio": talk.audio_data is not None,
        "created_at": talk.created_at,
        "updated_at": talk.updated_at,
    }

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="百物語 API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Events
@app.post("/events", response_model=schemas.EventResponse)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    return crud.create_event(db, event)

@app.get("/events", response_model=List[schemas.EventResponse])
def list_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_events(db, skip, limit)

@app.get("/events/{event_id}")
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    # Build response with has_audio for talks
    return {
        "id": event.id,
        "name": event.name,
        "candle_count": event.candle_count,
        "time_limit_seconds": event.time_limit_seconds,
        "mode": event.mode,
        "icon_emoji": event.icon_emoji,
        "icon_image_url": event.icon_image_url,
        "background_image_url": event.background_image_url,
        "title_color": event.title_color,
        "candle_style": event.candle_style,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
        "participants": event.participants,
        "talks": [talk_to_response(t) for t in event.talks],
    }

@app.patch("/events/{event_id}", response_model=schemas.EventResponse)
def update_event(event_id: str, event: schemas.EventUpdate, db: Session = Depends(get_db)):
    updated = crud.update_event(db, event_id, event)
    if not updated:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated

@app.delete("/events/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db)):
    if not crud.delete_event(db, event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "deleted"}

# Participants
@app.post("/events/{event_id}/participants", response_model=schemas.ParticipantResponse)
def create_participant(event_id: str, participant: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return crud.create_participant(db, event_id, participant)

@app.get("/events/{event_id}/participants", response_model=List[schemas.ParticipantResponse])
def list_participants(event_id: str, db: Session = Depends(get_db)):
    return crud.get_participants(db, event_id)

@app.delete("/participants/{participant_id}")
def delete_participant(participant_id: str, db: Session = Depends(get_db)):
    if not crud.delete_participant(db, participant_id):
        raise HTTPException(status_code=404, detail="Participant not found")
    return {"status": "deleted"}

# Talks
@app.post("/events/{event_id}/talks", response_model=schemas.TalkResponse)
def create_or_update_talk(event_id: str, talk: schemas.TalkCreate, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db_talk = crud.create_or_update_talk(db, event_id, talk)
    return talk_to_response(db_talk)

@app.get("/events/{event_id}/talks", response_model=List[schemas.TalkResponse])
def list_talks(event_id: str, db: Session = Depends(get_db)):
    talks = crud.get_talks(db, event_id)
    return [talk_to_response(t) for t in talks]

@app.patch("/talks/{talk_id}", response_model=schemas.TalkResponse)
def update_talk(talk_id: str, talk: schemas.TalkUpdate, db: Session = Depends(get_db)):
    updated = crud.update_talk(db, talk_id, talk)
    if not updated:
        raise HTTPException(status_code=404, detail="Talk not found")
    return talk_to_response(updated)

@app.delete("/events/{event_id}/talks")
def reset_talks(event_id: str, db: Session = Depends(get_db)):
    crud.reset_talks(db, event_id)
    return {"status": "reset"}

# Get single talk by slot number
@app.get("/events/{event_id}/talks/{slot_number}", response_model=schemas.TalkResponse)
def get_talk_by_slot(event_id: str, slot_number: int, db: Session = Depends(get_db)):
    talk = crud.get_talk_by_slot(db, event_id, slot_number)
    if not talk:
        raise HTTPException(status_code=404, detail="Talk not found")
    return talk_to_response(talk)

# Audio streaming
@app.get("/events/{event_id}/talks/{slot_number}/audio")
def get_talk_audio(event_id: str, slot_number: int, db: Session = Depends(get_db)):
    talk = crud.get_talk_by_slot(db, event_id, slot_number)
    if not talk:
        raise HTTPException(status_code=404, detail="Talk not found")
    if not talk.audio_data:
        raise HTTPException(status_code=404, detail="No audio for this talk")
    return Response(
        content=talk.audio_data,
        media_type=talk.audio_mime_type or "audio/webm",
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
