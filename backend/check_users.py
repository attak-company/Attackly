from supabase import create_client
from app.core.config import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# 查詢所有用戶
response = supabase.table('users').select('*').execute()
print('All users in database:')
for user in response.data:
    print(f'Email: {user.get("email")}, ID: {user.get("id")}')
