from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Event schemas
class EventBase(BaseModel):
    name: str
    candle_count: int = 100
    time_limit_seconds: int = 120
    mode: str = 'dark'
    icon_emoji: str = '🎃'
    icon_image_url: Optional[str] = None
    background_image_url: Optional[str] = None
    title_color: str = '#ff9500'
    candle_style: str = 'simple'

class EventCreate(EventBase):
    password: Optional[str] = None

class EventUpdate(BaseModel):
    name: Optional[str] = None
    candle_count: Optional[int] = None
    time_limit_seconds: Optional[int] = None
    mode: Optional[str] = None
    icon_emoji: Optional[str] = None
    icon_image_url: Optional[str] = None
    background_image_url: Optional[str] = None
    title_color: Optional[str] = None
    candle_style: Optional[str] = None

class EventResponse(EventBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Participant schemas
class ParticipantBase(BaseModel):
    nickname: str
    icon_index: int = 0

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantResponse(ParticipantBase):
    id: str
    event_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Talk schemas
class TalkBase(BaseModel):
    slot_number: int
    speaker_id: Optional[str] = None
    transcript: Optional[str] = ''
    is_completed: bool = False

class TalkCreate(TalkBase):
    audio_base64: Optional[str] = None
    audio_mime_type: Optional[str] = None

class TalkUpdate(BaseModel):
    speaker_id: Optional[str] = None
    transcript: Optional[str] = None
    is_completed: Optional[bool] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    audio_base64: Optional[str] = None
    audio_mime_type: Optional[str] = None

class TalkResponse(TalkBase):
    id: str
    event_id: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    has_audio: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Full event with relations
class EventFull(EventResponse):
    participants: List[ParticipantResponse] = []
    talks: List[TalkResponse] = []

    class Config:
        from_attributes = True
