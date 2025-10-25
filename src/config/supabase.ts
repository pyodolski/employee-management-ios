import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = 'https://okvrxpjincelvvwnvcts.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdnJ4cGppbmNlbHZ2d252Y3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTM1NzcsImV4cCI6MjA3MDEyOTU3N30.R4QwWmbd8tcuJQu3hU1yuxaGrh18khTg_J_ujo-9Szk';

// SecureStore의 2048 바이트 제한을 우회하기 위한 청크 저장 방식
const CHUNK_SIZE = 2000; // 안전한 크기로 설정

const LargeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    try {
      // 먼저 청크 개수 확인
      const chunkCountStr = await SecureStore.getItemAsync(`${key}_count`);
      if (!chunkCountStr) {
        // 청크가 없으면 일반 저장 방식 시도
        return await SecureStore.getItemAsync(key);
      }

      const chunkCount = parseInt(chunkCountStr, 10);
      let result = '';

      // 모든 청크를 읽어서 합치기
      for (let i = 0; i < chunkCount; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
        if (chunk) {
          result += chunk;
        }
      }

      return result || null;
    } catch (error) {
      console.error('Error getting item from SecureStore:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // 값이 작으면 일반 저장
      if (value.length < CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        // 기존 청크 정보 삭제
        await SecureStore.deleteItemAsync(`${key}_count`);
        return;
      }

      // 큰 값은 청크로 나눠서 저장
      const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
      
      for (let i = 0; i < chunkCount; i++) {
        const chunk = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await SecureStore.setItemAsync(`${key}_${i}`, chunk);
      }

      // 청크 개수 저장
      await SecureStore.setItemAsync(`${key}_count`, chunkCount.toString());
      
      // 기존 일반 저장 값 삭제
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error setting item in SecureStore:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      // 청크 개수 확인
      const chunkCountStr = await SecureStore.getItemAsync(`${key}_count`);
      
      if (chunkCountStr) {
        const chunkCount = parseInt(chunkCountStr, 10);
        
        // 모든 청크 삭제
        for (let i = 0; i < chunkCount; i++) {
          await SecureStore.deleteItemAsync(`${key}_${i}`);
        }
        
        await SecureStore.deleteItemAsync(`${key}_count`);
      }
      
      // 일반 저장 값도 삭제
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from SecureStore:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: LargeSecureStore as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
