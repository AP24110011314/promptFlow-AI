from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    is_custom: Optional[bool] = True

class CategoryResponse(CategoryBase):
    id: int
    is_custom: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
