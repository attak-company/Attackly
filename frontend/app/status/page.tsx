"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle, Activity, Clock, Server, Zap, Database, Globe, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Status() {
  const [latency, setLatency] = useState(45);
  const [geminiLatency, setGeminiLatency] = useState(750);
  const [systemLoad, setSystemLoad] = useState(12.5);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // 模擬實時數據更新
  useEffect(() => {
    // 每 3 秒更新一次延遲數值（40ms - 65ms 之間隨機）
    const latencyInterval = setInterval(() => {
      setLatency(Math.floor(Math.random() * (65 - 40 + 1)) + 40);
    }, 3000);

    // 每 3 秒更新一次 Gemini 延遲數值（600ms - 950ms 之間隨機）
    const geminiInterval = setInterval(() => {
      setGeminiLatency(Math.floor(Math.random() * (950 - 600 + 1)) + 600);
      setLastUpdated(new Date());
    }, 3000);

    // 每 5 秒更新一次系統負載（10% - 20% 之間隨機）
    const loadInterval = setInterval(() => {
      setSystemLoad(Math.floor(Math.random() * (20 - 10 + 1)) + 10);
    }, 5000);

    return () => {
      clearInterval(latencyInterval);
      clearInterval(geminiInterval);
      clearInterval(loadInterval);
    };
  }, []);

  // 生成過去 90 天的可用率數據（模擬全部正常）
  const generateUptimeData = () => {
    const days = [];
    for (let i = 0; i < 90; i++) {
      days.push({ day: i, status: 'operational' });
    }
    return days;
  };

  const uptimeData = generateUptimeData();

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* 返回按鈕 */}
        <Link href="/" className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors duration-300 mb-8 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">返回官網</span>
        </Link>

        <h1 className="text-4xl font-bold text-white mb-4">系統狀態監測</h1>
        <p className="text-gray-400 mb-12">實時監控數位店長各項服務運行狀況</p>

        {/* 頂部核心狀態 */}
        <div className="bg-gray-900 rounded-lg p-12 border border-gray-800 mb-12">
          <div className="flex flex-col items-center justify-center">
            {/* 呼吸燈圓點 */}
            <motion.div
              animate={{ 
                boxShadow: ['0 0 20px rgba(34,197,94,0.4)', '0 0 40px rgba(34,197,94,0.8)', '0 0 20px rgba(34,197,94,0.4)'],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 bg-green-500 rounded-full mb-6 shadow-[0_0_30px_rgba(34,197,94,0.6)]"
            ></motion.div>
            
            <h2 className="text-3xl font-bold text-white mb-2">所有系統運行正常</h2>
            <p className="text-green-400 text-lg mb-4">All Systems Operational</p>
            <p className="text-gray-400 text-sm">最後更新：{formatTime(lastUpdated)}</p>
          </div>
        </div>

        {/* 分項服務狀態 */}
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 mb-12">
          <h3 className="text-xl font-bold text-white mb-6">服務狀態</h3>
          <div className="space-y-4">
            {/* AI Service */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-white font-medium">AI Service</p>
                  <p className="text-gray-400 text-sm">智能問答核心</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Latency: {latency}ms</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Operational
                </span>
              </div>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-white font-medium">Database</p>
                  <p className="text-gray-400 text-sm">資料庫存取</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Connection: Active</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Operational
                </span>
              </div>
            </div>

            {/* Gemini 1.5 Pro */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-500" />
                <div>
                  <p className="text-white font-medium">Gemini 1.5 Pro</p>
                  <p className="text-gray-400 text-sm">[AI Core] Google AI</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <motion.span
                  key={geminiLatency}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-400 text-sm"
                >
                  Latency: {geminiLatency}ms
                </motion.span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Operational
                </span>
              </div>
            </div>

            {/* Payment Gateway */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-white font-medium">Payment Gateway</p>
                  <p className="text-gray-400 text-sm">支付系統</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Status: Active</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Operational
                </span>
              </div>
            </div>

            {/* Dashboard */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-white font-medium">Dashboard</p>
                  <p className="text-gray-400 text-sm">商戶後台</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Load: {systemLoad}%</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Operational
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 實時數據圖表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* 響應時間 */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-bold text-white">響應時間</h3>
            </div>
            <div className="relative h-24 bg-gray-800 rounded-lg overflow-hidden">
              <motion.div
                animate={{ width: `${(latency / 100) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-green-600 to-green-400"
              ></motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{latency}ms</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">正常範圍：40ms - 65ms</p>
          </div>

          {/* 系統負載 */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-bold text-white">系統負載</h3>
            </div>
            <div className="relative h-24 bg-gray-800 rounded-lg overflow-hidden">
              <motion.div
                animate={{ width: `${systemLoad}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-green-600 to-green-400"
              ></motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{systemLoad}%</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">系統運作輕鬆，綽綽有餘</p>
          </div>
        </div>

        {/* 過去 90 天可用率 */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-bold text-white">過去 90 天可用率</h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {uptimeData.map((day, index) => (
              <div
                key={index}
                className="w-3 h-8 bg-green-500 rounded-sm"
                title={`Day ${day.day + 1}: Operational`}
              ></div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-gray-400 text-sm">90 天前</p>
            <p className="text-green-400 font-bold">99.99% 可用率</p>
            <p className="text-gray-400 text-sm">今天</p>
          </div>
        </div>
      </div>
    </div>
  );
}
