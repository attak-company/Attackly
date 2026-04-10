import hashlib
import hmac
import base64
import binascii
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from app.core.config import settings


class NewebPayService:
    """藍星金流服務類"""
    
    def __init__(self):
        self.merchant_id = settings.NEWEBPAY_MERCHANT_ID
        self.hash_key = settings.NEWEBPAY_HASH_KEY
        self.hash_iv = settings.NEWEBPAY_HASH_IV
        self.env = settings.NEWEBPAY_ENV
        
        # 根據環境設置 API 網址
        if self.env == "production":
            self.gateway_url = "https://core.newebpay.com/MPG/mpg_gateway"
            self.period_url = "https://core.newebpay.com/MPG/period"
        else:
            self.gateway_url = "https://ccore.newebpay.com/MPG/mpg_gateway"
            self.period_url = "https://ccore.newebpay.com/MPG/period"
    
    def _create_aes_encrypt(self, trade_info: dict) -> str:
        """使用 AES 加密交易資料"""
        # 將字典轉換為 URL 參數字串
        trade_info_str = "&".join([f"{k}={v}" for k, v in sorted(trade_info.items())])
        
        # AES 加密
        cipher = AES.new(
            self.hash_key.encode('utf-8'),
            AES.MODE_CBC,
            self.hash_iv.encode('utf-8')
        )
        encrypted = cipher.encrypt(pad(trade_info_str.encode('utf-8'), AES.block_size))
        
        # Base64 編碼
        return base64.b64encode(encrypted).decode('utf-8')
    
    def _create_sha256_encrypt(self, trade_info: str) -> str:
        """使用 SHA256 加密交易資料"""
        # HashKey + TradeInfo + HashIV
        hash_data = f"HashKey={self.hash_key}&{trade_info}&HashIV={self.hash_iv}"
        
        # SHA256 加密並轉為大寫
        sha256_hash = hashlib.sha256(hash_data.encode('utf-8')).hexdigest().upper()
        
        return sha256_hash
    
    def _create_aes_decrypt(self, trade_info: str) -> dict:
        """使用 AES 解密交易資料"""
        try:
            # Base64 解碼
            encrypted_bytes = base64.b64decode(trade_info)
            
            # AES 解密
            cipher = AES.new(
                self.hash_key.encode('utf-8'),
                AES.MODE_CBC,
                self.hash_iv.encode('utf-8')
            )
            decrypted = cipher.decrypt(encrypted_bytes)
            decrypted = unpad(decrypted, AES.block_size)
            
            # 將字串轉換為字典
            trade_info_str = decrypted.decode('utf-8')
            trade_info_dict = {}
            for item in trade_info_str.split('&'):
                key, value = item.split('=')
                trade_info_dict[key] = value
            
            return trade_info_dict
        except Exception as e:
            print(f"Error decrypting trade info: {e}")
            return {}
    
    def create_payment_params(
        self,
        merchant_order_no: str,
        amount: int,
        item_desc: str,
        email: str,
        return_url: str,
        notify_url: str,
        client_back_url: str = None
    ) -> dict:
        """創建支付參數"""
        import time
        
        # 交易資料
        trade_info = {
            "MerchantID": self.merchant_id,
            "MerchantOrderNo": merchant_order_no,
            "Amt": amount,
            "ItemDesc": item_desc,
            "Email": email,
            "TimeStamp": str(int(time.time())),
            "URL": return_url,
            "NotifyURL": notify_url,
        }
        
        # 如果有客戶返回 URL
        if client_back_url:
            trade_info["ClientBackURL"] = client_back_url
        
        # AES 加密
        trade_info_encrypted = self._create_aes_encrypt(trade_info)
        
        # SHA256 加密
        trade_sha = self._create_sha256_encrypt(trade_info_encrypted)
        
        return {
            "MerchantID": self.merchant_id,
            "TradeInfo": trade_info_encrypted,
            "TradeSha": trade_sha,
            "Version": "1.6",
            "PayGateWay": self.gateway_url
        }
    
    def create_period_params(
        self,
        merchant_order_no: str,
        amount: int,
        item_desc: str,
        email: str,
        period_type: str,
        frequency: int,
        exec_times: int,
        return_url: str,
        notify_url: str
    ) -> dict:
        """創建定期定額付款參數"""
        import time
        
        # 交易資料
        trade_info = {
            "MerchantID": self.merchant_id,
            "MerchantOrderNo": merchant_order_no,
            "Amt": amount,
            "ItemDesc": item_desc,
            "Email": email,
            "TimeStamp": str(int(time.time())),
            "URL": return_url,
            "NotifyURL": notify_url,
            "PeriodType": period_type,  # Y: 年, M: 月, D: 日
            "Frequency": str(frequency),  # 每隔多少期
            "ExecTimes": str(exec_times),  # 執行次數
        }
        
        # AES 加密
        trade_info_encrypted = self._create_aes_encrypt(trade_info)
        
        # SHA256 加密
        trade_sha = self._create_sha256_encrypt(trade_info_encrypted)
        
        return {
            "MerchantID": self.merchant_id,
            "TradeInfo": trade_info_encrypted,
            "TradeSha": trade_sha,
            "Version": "1.6",
            "PayGateWay": self.period_url
        }
    
    def verify_callback(self, trade_info: str, trade_sha: str) -> bool:
        """驗證回調資料的正確性"""
        # 使用相同的加密方式生成 SHA256
        calculated_sha = self._create_sha256_encrypt(trade_info)
        
        return calculated_sha == trade_sha
    
    def decrypt_callback(self, trade_info: str) -> dict:
        """解密回調資料"""
        return self._create_aes_decrypt(trade_info)


newebpay_service = NewebPayService()
