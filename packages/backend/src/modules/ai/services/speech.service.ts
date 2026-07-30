import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SpeechToTextResult {
  text: string;
  language: string;
  confidence: number;
  segments?: { start: number; end: number; text: string }[];
}

export interface TextToSpeechResult {
  audio: Buffer;
  mimeType: string;
  durationMs: number;
}

@Injectable()
export class SpeechService {
  private readonly logger = new Logger(SpeechService.name);

  constructor(private config: ConfigService) {}

  async speechToText(audio: Buffer, language?: 'ar' | 'en'): Promise<SpeechToTextResult> {
    const provider = this.config.get<string>('AI_SPEECH_PROVIDER', 'openai');
    return provider === 'azure'
      ? this.azureSpeechToText(audio, language)
      : this.openaiSpeechToText(audio, language);
  }

  async textToSpeech(text: string, language?: 'ar' | 'en'): Promise<TextToSpeechResult> {
    const provider = this.config.get<string>('AI_SPEECH_PROVIDER', 'openai');
    return provider === 'azure'
      ? this.azureTextToSpeech(text, language)
      : this.openaiTextToSpeech(text, language);
  }

  private async openaiSpeechToText(audio: Buffer, language?: 'ar' | 'en'): Promise<SpeechToTextResult> {
    try {
      const apiKey = this.config.get<string>('OPENAI_API_KEY');
      const formData = new FormData();
      const blob = new Blob([audio], { type: 'audio/webm' });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', language === 'ar' ? 'ar' : 'en');
      formData.append('response_format', 'verbose_json');

      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        maxBodyLength: Infinity,
      });

      return {
        text: response.data.text,
        language: response.data.language || language || 'en',
        confidence: 0.95,
        segments: response.data.segments?.map((s: any) => ({
          start: s.start, end: s.end, text: s.text,
        })) || [],
      };
    } catch (error: any) {
      this.logger.error(`OpenAI STT error: ${error.message}`);
      return { text: '', language: language || 'en', confidence: 0 };
    }
  }

  private async openaiTextToSpeech(text: string, _language?: 'ar' | 'en'): Promise<TextToSpeechResult> {
    try {
      const apiKey = this.config.get<string>('OPENAI_API_KEY');
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          input: text,
          voice: 'alloy',
          response_format: 'mp3',
        },
        {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          responseType: 'arraybuffer',
        },
      );
      return {
        audio: Buffer.from(response.data),
        mimeType: 'audio/mpeg',
        durationMs: Math.ceil(text.length / 15 * 1000),
      };
    } catch (error: any) {
      this.logger.error(`OpenAI TTS error: ${error.message}`);
      return { audio: Buffer.from([]), mimeType: 'audio/mpeg', durationMs: 0 };
    }
  }

  private async azureSpeechToText(audio: Buffer, language?: 'ar' | 'en'): Promise<SpeechToTextResult> {
    try {
      const key = this.config.get<string>('AZURE_SPEECH_KEY');
      const region = this.config.get<string>('AZURE_SPEECH_REGION', 'eastus');
      const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language === 'ar' ? 'ar-SA' : 'en-US'}&format=detailed`;

      const response = await axios.post(url, audio, {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          'Accept': 'application/json',
        },
      });
      return {
        text: response.data.DisplayText || '',
        language: language || 'en',
        confidence: response.data.NBest?.[0]?.Confidence || 0,
        segments: response.data.NBest?.[0]?.Display?.split('.').map((s: string) => ({
          start: 0, end: 0, text: s.trim(),
        })) || [],
      };
    } catch (error: any) {
      this.logger.error(`Azure STT error: ${error.message}`);
      return this.openaiSpeechToText(audio, language);
    }
  }

  private async azureTextToSpeech(text: string, language?: 'ar' | 'en'): Promise<TextToSpeechResult> {
    try {
      const key = this.config.get<string>('AZURE_SPEECH_KEY');
      const region = this.config.get<string>('AZURE_SPEECH_REGION', 'eastus');
      const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      const voice = language === 'ar' ? 'ar-SA-ZariyahNeural' : 'en-US-JennyNeural';
      const ssml = `<speak version='1.0' xml:lang='${language === 'ar' ? 'ar-SA' : 'en-US'}'><voice name='${voice}'>${text}</voice></speak>`;

      const response = await axios.post(url, ssml, {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        responseType: 'arraybuffer',
      });
      return {
        audio: Buffer.from(response.data),
        mimeType: 'audio/mpeg',
        durationMs: Math.ceil(text.length / 15 * 1000),
      };
    } catch (error: any) {
      this.logger.error(`Azure TTS error: ${error.message}`);
      return this.openaiTextToSpeech(text, language);
    }
  }
}
