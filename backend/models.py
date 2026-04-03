from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

def generate_short_id():
    chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    import random
    return ''.join(random.choice(chars) for _ in range(6))

class Event(Base):
    __tablename__ = "events"

    id = Column(String(6), primary_key=True, default=generate_short_id)
    name = Column(String(255), nullable=False)
    candle_count = Column(Integer, nullable=False, default=100)
    time_limit_seconds = Column(Integer, nullable=False, default=120)
    mode = Column(String(20), nullable=False, default='dark')
    password_hash = Column(String(255), nullable=True)
    icon_emoji = Column(String(10), nullable=False, default='🎃')
    icon_image_url = Column(Text, nullable=True)
    background_image_url = Column(Text, nullable=True)
    title_color = Column(String(20), nullable=False, default='#ff9500')
    candle_style = Column(String(20), nullable=False, default='simple')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    participants = relationship("Participant", back_populates="event", cascade="all, delete-orphan")
    talks = relationship("Talk", back_populates="event", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "participants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(6), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String(100), nullable=False)
    icon_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="participants")
    talks = relationship("Talk", back_populates="speaker")

class Talk(Base):
    __tablename__ = "talks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(6), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    slot_number = Column(Integer, nullable=False)
    speaker_id = Column(String(36), ForeignKey("participants.id", ondelete="SET NULL"), nullable=True)
    transcript = Column(Text, nullable=True, default='')
    audio_data = Column(LargeBinary, nullable=True)
    audio_mime_type = Column(String(50), nullable=True)
    is_completed = Column(Boolean, nullable=False, default=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    event = relationship("Event", back_populates="talks")
    speaker = relationship("Participant", back_populates="talks")
