import { createClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 檢查用戶是否已存在於 users 表
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      let isNewUser = false;

      if (userError || !existingUser) {
        // 用戶不存在，創建用戶資料
        isNewUser = true;
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            last_name: '',
            first_name: '',
            username: data.user.email?.split('@')[0] || '',
          });

        if (insertError) {
          console.error('Error creating user:', insertError);
        }

        // 創建 merchant 資料
        const { error: merchantError } = await supabase
          .from('merchants')
          .insert({
            id: data.user.id,
            name: data.user.email?.split('@')[0] || '',
          });

        if (merchantError) {
          console.error('Error creating merchant:', merchantError);
        }
      }

      // 如果是新用戶，跳轉到方案選擇頁面
      if (isNewUser) {
        return NextResponse.redirect(`${origin}/select-plan`);
      }

      // 檢查用戶是否已選擇方案
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      // 如果沒有訂閱記錄，跳轉到方案選擇頁面
      if (subscriptionError || !subscription) {
        return NextResponse.redirect(`${origin}/select-plan`);
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${next}`);
}
