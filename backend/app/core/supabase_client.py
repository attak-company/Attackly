"""Supabase client wrapper for backend"""
from supabase import create_client, Client
from app.core.config import settings

_supabase: Client = None


def get_supabase() -> Client:
    """Get or create Supabase client singleton"""
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
    return _supabase


def get_service_client() -> Client:
    """Get Supabase client with service_role key (admin)"""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY  # Already using service_role key
    )
