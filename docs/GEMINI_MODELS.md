# Gemini API Models Reference

## Official Documentation
Source: https://ai.google.dev/gemini-api/docs/models/gemini
Last Updated: November 27, 2025

## Supported Models for generateContent API

### Recommended for Production

#### Gemini 2.5 Flash (Recommended - Fast & Cheap)
```
gemini-2.5-flash
```
- **Best for**: Most use cases, fast response, low cost
- **Input**: Text, images, video, audio
- **Output**: Text only
- **Context**: 1M tokens
- **Output limit**: 65K tokens
- **Cost**: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens

#### Gemini 2.5 Pro (More Capable)
```
gemini-2.5-pro
```
- **Best for**: Complex analysis, deeper reasoning
- **Input**: Audio, images, video, text, PDF
- **Output**: Text only
- **Context**: 1M tokens
- **Output limit**: 65K tokens
- **Cost**: Higher than Flash

### Legacy Models (Still Supported)

#### Gemini 1.5 Flash
```
gemini-1.5-flash
```
- Deprecated in favor of 2.5 Flash
- Still functional but not recommended

#### Gemini 1.5 Pro
```
gemini-1.5-pro
```
- Deprecated in favor of 2.5 Pro
- Still functional but not recommended

### Model Version Patterns

Google uses these suffixes:

1. **Stable** (e.g., `gemini-2.5-flash`)
   - Production-ready
   - Doesn't change
   - Recommended for apps

2. **Latest** (e.g., `gemini-flash-latest`)
   - Auto-updates to newest stable/preview
   - Hot-swapped with 2-week notice
   - Use with caution

3. **Preview** (e.g., `gemini-2.5-flash-preview-09-2025`)
   - May have new features
   - Can be used in production
   - Deprecated with 2+ weeks notice

## What NOT To Use

❌ `gemini-1.5-flash-latest` - This is not a real model name
❌ `gemini-1.5-pro-latest` - This is not a real model name
❌ `gemini-flash` - Too generic, not a real model name

## For Our Application

We should use in dropdown:
1. `gemini-2.5-flash` - Default
2. `gemini-2.5-pro` - For better quality
3. `gemini-1.5-flash` - Legacy option
4. `gemini-1.5-pro` - Legacy option

**Default**: `gemini-2.5-flash` (best balance of speed, quality, and cost)
