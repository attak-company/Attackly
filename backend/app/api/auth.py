from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from app.core.config import settings
import time
import os

router = APIRouter()

# Store verification codes temporarily (in production, use Redis)
verification_codes = {}

class SendEmailCodeRequest(BaseModel):
    email: str

class VerifyEmailCodeRequest(BaseModel):
    email: str
    code: str

class SendLoginCodeRequest(BaseModel):
    email: str

class VerifyLoginCodeRequest(BaseModel):
    email: str
    code: str

class SendPasswordResetRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

@router.post("/send-email-code")
async def send_email_code(request: SendEmailCodeRequest):
    """發送 Email 驗證碼"""
    try:
        # 生成 6 位數驗證碼
        code = str(random.randint(100000, 999999))
        
        # 存儲驗證碼（5 分鐘過期）
        verification_codes[request.email] = {
            "code": code,
            "expires_at": time.time() + 300  # 5 minutes
        }
        
        # 發送郵件
        await send_verification_email(request.email, code)
        
        return {"success": True, "message": "驗證碼已發送"}
    except Exception as e:
        print(f"Error sending email: {e}")
        # 開發環境下，即使發送失敗也返回成功（用於測試）
        return {"success": True, "message": "驗證碼已發送（開發模式）"}

@router.post("/verify-email-code")
async def verify_email_code(request: VerifyEmailCodeRequest):
    """驗證 Email 驗證碼"""
    try:
        if request.email not in verification_codes:
            raise HTTPException(status_code=400, detail="請先發送驗證碼")

        stored_data = verification_codes[request.email]

        # 檢查是否過期
        if time.time() > stored_data["expires_at"]:
            del verification_codes[request.email]
            raise HTTPException(status_code=400, detail="驗證碼已過期")

        # 驗證碼是否正確
        if request.code != stored_data["code"]:
            raise HTTPException(status_code=400, detail="驗證碼錯誤")

        # 驗證成功，刪除驗證碼
        del verification_codes[request.email]

        return {"success": True, "message": "驗證成功"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying code: {e}")
        raise HTTPException(status_code=500, detail="驗證失敗")

@router.post("/send-login-code")
async def send_login_code(request: SendLoginCodeRequest):
    """發送登入驗證碼"""
    try:
        # 生成 6 位數驗證碼
        code = str(random.randint(100000, 999999))

        # 存儲驗證碼（5 分鐘過期），使用 login_ 前綴區分登入驗證碼
        verification_codes[f"login_{request.email}"] = {
            "code": code,
            "expires_at": time.time() + 300  # 5 minutes
        }

        # 發送郵件
        await send_login_verification_email(request.email, code)

        return {"success": True, "message": "登入驗證碼已發送"}
    except Exception as e:
        print(f"Error sending login email: {e}")
        # 開發環境下，即使發送失敗也返回成功（用於測試）
        return {"success": True, "message": "登入驗證碼已發送（開發模式）"}

@router.post("/verify-login-code")
async def verify_login_code(request: VerifyLoginCodeRequest):
    """驗證登入驗證碼"""
    try:
        key = f"login_{request.email}"
        if key not in verification_codes:
            raise HTTPException(status_code=400, detail="請先發送登入驗證碼")

        stored_data = verification_codes[key]

        # 檢查是否過期
        if time.time() > stored_data["expires_at"]:
            del verification_codes[key]
            raise HTTPException(status_code=400, detail="驗證碼已過期")

        # 驗證碼是否正確
        if request.code != stored_data["code"]:
            raise HTTPException(status_code=400, detail="驗證碼錯誤")

        # 驗證成功，刪除驗證碼
        del verification_codes[key]

        return {"success": True, "message": "驗證成功"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying login code: {e}")
        raise HTTPException(status_code=500, detail="驗證失敗")

@router.post("/send-password-reset")
async def send_password_reset(request: SendPasswordResetRequest):
    """發送密碼重置驗證碼"""
    try:
        # 生成 6 位數驗證碼
        code = str(random.randint(100000, 999999))

        # 存儲驗證碼（5 分鐘過期），使用 reset_ 前綴區分密碼重置驗證碼
        verification_codes[f"reset_{request.email}"] = {
            "code": code,
            "expires_at": time.time() + 300  # 5 minutes
        }

        # 發送郵件
        await send_password_reset_email(request.email, code)

        return {"success": True, "message": "密碼重置驗證碼已發送"}
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        # 開發環境下，即使發送失敗也返回成功（用於測試）
        return {"success": True, "message": "密碼重置驗證碼已發送（開發模式）"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """重置密碼"""
    try:
        key = f"reset_{request.email}"
        if key not in verification_codes:
            raise HTTPException(status_code=400, detail="請先發送密碼重置驗證碼")

        stored_data = verification_codes[key]

        # 檢查是否過期
        if time.time() > stored_data["expires_at"]:
            del verification_codes[key]
            raise HTTPException(status_code=400, detail="驗證碼已過期")

        # 驗證碼是否正確
        if request.code != stored_data["code"]:
            raise HTTPException(status_code=400, detail="驗證碼錯誤")

        # 驗證成功，刪除驗證碼
        del verification_codes[key]

        # 這裡需要整合 Supabase 來重置密碼
        # 由於後端目前沒有 Supabase 客戶端，我們需要返回一個標記讓前端處理
        # 實際生產環境中，應該在後端調用 Supabase admin API 來重置密碼
        return {"success": True, "message": "驗證成功，請使用新密碼登入", "verified": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="重置密碼失敗")

async def send_password_reset_email(to_email: str, code: str):
    """發送密碼重置郵件"""
    try:
        # 配置 SMTP 伺服器（需要設置環境變數）
        smtp_server = settings.SMTP_HOST if hasattr(settings, 'SMTP_HOST') else "smtp.gmail.com"
        smtp_port = settings.SMTP_PORT if hasattr(settings, 'SMTP_PORT') else 587
        smtp_username = settings.SMTP_USERNAME if hasattr(settings, 'SMTP_USERNAME') else ""
        smtp_password = settings.SMTP_PASSWORD if hasattr(settings, 'SMTP_PASSWORD') else ""

        if not smtp_username or not smtp_password:
            print("SMTP credentials not configured, skipping email send")
            return

        # 讀取 Logo 圖片並嵌入
        logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "public", "Logo.png")
        logo_cid = None
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                logo_data = f.read()
                logo_image = MIMEImage(logo_data)
                logo_image.add_header('Content-ID', '<logo>')
                logo_image.add_header('Content-Disposition', 'inline', filename='Logo.png')
                logo_cid = 'cid:logo'

        # 創建郵件
        msg = MIMEMultipart('related')
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = "數位店長 - 密碼重置驗證碼"

        # 創建 alternative 容器
        alternative = MIMEMultipart('alternative')
        msg.attach(alternative)

        # 如果有 Logo，添加到郵件
        if logo_cid and logo_image:
            msg.attach(logo_image)

        # HTML 郵件模板（參考 Landing 頁面設計風格）
        html_body = f"""
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>數位店長 - 密碼重置驗證碼</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- 主容器 -->
                <div style="background: white; border-radius: 32px; padding: 48px 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <!-- Logo 區域 -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <table style="margin: 0 auto; margin-bottom: 16px;">
                            <tr>
                                <td style="padding-right: 12px; vertical-align: middle;">
                                    <img src="{logo_cid if logo_cid else 'https://attak960623.sirv.com/Logo.png'}" alt="數位店長 Logo" style="width: 48px; height: 48px; display: block;" />
                                </td>
                                <td style="vertical-align: middle;">
                                    <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #000;">Digital Manager</span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- 標題 -->
                    <h1 style="font-size: 32px; font-weight: 900; color: #000; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.02em;">
                        密碼重置驗證碼
                    </h1>

                    <!-- 說明文字 -->
                    <p style="font-size: 18px; color: #6b7280; margin: 0 0 32px 0; text-align: center; line-height: 1.6; font-weight: 500;">
                        您正在重置數位店長帳號的密碼。請使用以下驗證碼完成密碼重置：
                    </p>

                    <!-- 驗證碼顯示框 -->
                    <div style="background: #f3f4f6; border-radius: 20px; padding: 32px; margin-bottom: 32px; text-align: center; border: 2px solid #000;">
                        <div style="font-size: 48px; font-weight: 900; color: #000; letter-spacing: 0.1em; margin: 0;">
                            {code}
                        </div>
                    </div>

                    <!-- 過期提示 -->
                    <p style="font-size: 14px; color: #9ca3af; margin: 0 0 24px 0; text-align: center; font-weight: 500;">
                        此驗證碼將在 5 分鐘後過期
                    </p>

                    <!-- 分隔線 -->
                    <div style="border-top: 1px solid #e5e7eb; margin: 32px 0;"></div>

                    <!-- 安全提示 -->
                    <div style="background: #f9fafb; border-radius: 16px; padding: 24px; border-left: 4px solid #000;">
                        <p style="font-size: 14px; color: #4b5563; margin: 0; line-height: 1.6; font-weight: 500;">
                            <strong style="color: #000;">安全提示：</strong> 如果您沒有請求重置密碼，請忽略此郵件。您的帳號將不會受到影響。
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 12px; color: #9ca3af; margin: 0; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
                            © 2026 Digital Manager AI. 為小型商戶而生。
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        # 純文字版本（備用）
        text_body = f"""
您的密碼重置驗證碼是：{code}

此驗證碼將在 5 分鐘後過期。

如果您沒有請求重置密碼，請忽略此郵件。

© 2026 Digital Manager AI. 為小型商戶而生。
        """

        alternative.attach(MIMEText(text_body, 'plain'))
        alternative.attach(MIMEText(html_body, 'html'))

        # 發送郵件
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()

        print(f"Password reset email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
        raise

async def send_login_verification_email(to_email: str, code: str):
    """發送登入驗證郵件"""
    try:
        # 配置 SMTP 伺服器（需要設置環境變數）
        smtp_server = settings.SMTP_HOST if hasattr(settings, 'SMTP_HOST') else "smtp.gmail.com"
        smtp_port = settings.SMTP_PORT if hasattr(settings, 'SMTP_PORT') else 587
        smtp_username = settings.SMTP_USERNAME if hasattr(settings, 'SMTP_USERNAME') else ""
        smtp_password = settings.SMTP_PASSWORD if hasattr(settings, 'SMTP_PASSWORD') else ""

        if not smtp_username or not smtp_password:
            print("SMTP credentials not configured, skipping email send")
            return

        # 讀取 Logo 圖片並嵌入
        logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "public", "Logo.png")
        logo_cid = None
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                logo_data = f.read()
                logo_image = MIMEImage(logo_data)
                logo_image.add_header('Content-ID', '<logo>')
                logo_image.add_header('Content-Disposition', 'inline', filename='Logo.png')
                logo_cid = 'cid:logo'

        # 創建郵件
        msg = MIMEMultipart('related')
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = "數位店長 - 登入驗證碼"

        # 創建 alternative 容器
        alternative = MIMEMultipart('alternative')
        msg.attach(alternative)

        # 如果有 Logo，添加到郵件
        if logo_cid and logo_image:
            msg.attach(logo_image)

        # HTML 郵件模板（參考 Landing 頁面設計風格）
        html_body = f"""
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>數位店長 - 登入驗證碼</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- 主容器 -->
                <div style="background: white; border-radius: 32px; padding: 48px 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <!-- Logo 區域 -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <table style="margin: 0 auto; margin-bottom: 16px;">
                            <tr>
                                <td style="padding-right: 12px; vertical-align: middle;">
                                    <img src="{logo_cid if logo_cid else 'https://attak960623.sirv.com/Logo.png'}" alt="數位店長 Logo" style="width: 48px; height: 48px; display: block;" />
                                </td>
                                <td style="vertical-align: middle;">
                                    <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #000;">Digital Manager</span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- 標題 -->
                    <h1 style="font-size: 32px; font-weight: 900; color: #000; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.02em;">
                        登入驗證碼
                    </h1>

                    <!-- 說明文字 -->
                    <p style="font-size: 18px; color: #6b7280; margin: 0 0 32px 0; text-align: center; line-height: 1.6; font-weight: 500;">
                        您正在嘗試登入數位店長。請使用以下驗證碼完成登入：
                    </p>

                    <!-- 驗證碼顯示框 -->
                    <div style="background: #f3f4f6; border-radius: 20px; padding: 32px; margin-bottom: 32px; text-align: center; border: 2px solid #000;">
                        <div style="font-size: 48px; font-weight: 900; color: #000; letter-spacing: 0.1em; margin: 0;">
                            {code}
                        </div>
                    </div>

                    <!-- 過期提示 -->
                    <p style="font-size: 14px; color: #9ca3af; margin: 0 0 24px 0; text-align: center; font-weight: 500;">
                        此驗證碼將在 5 分鐘後過期
                    </p>

                    <!-- 分隔線 -->
                    <div style="border-top: 1px solid #e5e7eb; margin: 32px 0;"></div>

                    <!-- 安全提示 -->
                    <div style="background: #f9fafb; border-radius: 16px; padding: 24px; border-left: 4px solid #000;">
                        <p style="font-size: 14px; color: #4b5563; margin: 0; line-height: 1.6; font-weight: 500;">
                            <strong style="color: #000;">安全提示：</strong> 如果您沒有請求登入，請忽略此郵件。您的帳號將不會受到影響。
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 12px; color: #9ca3af; margin: 0; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
                            © 2026 Digital Manager AI. 為小型商戶而生。
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        # 純文字版本（備用）
        text_body = f"""
您的登入驗證碼是：{code}

此驗證碼將在 5 分鐘後過期。

如果您沒有請求登入，請忽略此郵件。

© 2026 Digital Manager AI. 為小型商戶而生。
        """

        alternative.attach(MIMEText(text_body, 'plain'))
        alternative.attach(MIMEText(html_body, 'html'))

        # 發送郵件
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()

        print(f"Login email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send login email: {e}")
        raise

async def send_verification_email(to_email: str, code: str):
    """發送驗證郵件"""
    try:
        # 配置 SMTP 伺服器（需要設置環境變數）
        smtp_server = settings.SMTP_HOST if hasattr(settings, 'SMTP_HOST') else "smtp.gmail.com"
        smtp_port = settings.SMTP_PORT if hasattr(settings, 'SMTP_PORT') else 587
        smtp_username = settings.SMTP_USERNAME if hasattr(settings, 'SMTP_USERNAME') else ""
        smtp_password = settings.SMTP_PASSWORD if hasattr(settings, 'SMTP_PASSWORD') else ""

        if not smtp_username or not smtp_password:
            print("SMTP credentials not configured, skipping email send")
            return

        # 讀取 Logo 圖片並嵌入
        logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "public", "Logo.png")
        logo_cid = None
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                logo_data = f.read()
                logo_image = MIMEImage(logo_data)
                logo_image.add_header('Content-ID', '<logo>')
                logo_image.add_header('Content-Disposition', 'inline', filename='Logo.png')
                logo_cid = 'cid:logo'

        # 創建郵件
        msg = MIMEMultipart('related')
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = "數位店長 - Email 驗證碼"

        # 創建 alternative 容器
        alternative = MIMEMultipart('alternative')
        msg.attach(alternative)

        # 如果有 Logo，添加到郵件
        if logo_cid and logo_image:
            msg.attach(logo_image)
        
        # HTML 郵件模板（參考 Landing 頁面設計風格）
        html_body = f"""
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>數位店長 - Email 驗證碼</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- 主容器 -->
                <div style="background: white; border-radius: 32px; padding: 48px 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <!-- Logo 區域 -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <table style="margin: 0 auto; margin-bottom: 16px;">
                            <tr>
                                <td style="padding-right: 12px; vertical-align: middle;">
                                    <img src="{logo_cid if logo_cid else 'https://attak960623.sirv.com/Logo.png'}" alt="數位店長 Logo" style="width: 48px; height: 48px; display: block;" />
                                </td>
                                <td style="vertical-align: middle;">
                                    <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #000;">Digital Manager</span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- 標題 -->
                    <h1 style="font-size: 32px; font-weight: 900; color: #000; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.02em;">
                        Email 驗證碼
                    </h1>
                    
                    <!-- 說明文字 -->
                    <p style="font-size: 18px; color: #6b7280; margin: 0 0 32px 0; text-align: center; line-height: 1.6; font-weight: 500;">
                        感謝您註冊數位店長。請使用以下驗證碼完成您的帳號驗證：
                    </p>
                    
                    <!-- 驗證碼顯示框 -->
                    <div style="background: #f3f4f6; border-radius: 20px; padding: 32px; margin-bottom: 32px; text-align: center; border: 2px solid #000;">
                        <div style="font-size: 48px; font-weight: 900; color: #000; letter-spacing: 0.1em; margin: 0;">
                            {code}
                        </div>
                    </div>
                    
                    <!-- 過期提示 -->
                    <p style="font-size: 14px; color: #9ca3af; margin: 0 0 24px 0; text-align: center; font-weight: 500;">
                        此驗證碼將在 5 分鐘後過期
                    </p>
                    
                    <!-- 分隔線 -->
                    <div style="border-top: 1px solid #e5e7eb; margin: 32px 0;"></div>
                    
                    <!-- 安全提示 -->
                    <div style="background: #f9fafb; border-radius: 16px; padding: 24px; border-left: 4px solid #000;">
                        <p style="font-size: 14px; color: #4b5563; margin: 0; line-height: 1.6; font-weight: 500;">
                            <strong style="color: #000;">安全提示：</strong> 如果您沒有請求此驗證碼，請忽略此郵件。您的帳號將不會受到影響。
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 12px; color: #9ca3af; margin: 0; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
                            © 2026 Digital Manager AI. 為小型商戶而生。
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # 純文字版本（備用）
        text_body = f"""
您的驗證碼是：{code}

此驗證碼將在 5 分鐘後過期。

如果您沒有請求此驗證碼，請忽略此郵件。

© 2026 Digital Manager AI. 為小型商戶而生。
        """
        
        alternative.attach(MIMEText(text_body, 'plain'))
        alternative.attach(MIMEText(html_body, 'html'))
        
        # 發送郵件
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise
