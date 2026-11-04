import {
  experimental_generateVideo,
  generateImage,
  generateText,
  Output,
} from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const AI_MODELS = {
  text: 'google/gemini-3.8-flash',
  image: 'google/gemini-nano-banana-2.1',
  imageEdit: 'google/gemini-3.1-flash-image-preview',
  video: 'google/veo-3.1-lite-generate-001',
} as const;

type LegacyPart = {
  text?: string;
  inlineData?: { data?: string; mimeType?: string };
};

type LegacyRequest = {
  model?: string;
  contents?: string | { parts?: LegacyPart[] } | Array<{ parts?: LegacyPart[] }>;
  config?: {
    responseMimeType?: string;
    responseSchema?: unknown;
    imageConfig?: { aspectRatio?: string };
  };
};

function normalizeModel(model?: string, hasImageInput = false): string {
  if (hasImageInput) return AI_MODELS.imageEdit;
  if (!model) return AI_MODELS.text;
  return model.includes('/') ? model : `google/${model}`;
}

function getParts(contents: LegacyRequest['contents']): LegacyPart[] {
  const blocks = Array.isArray(contents) ? contents : contents ? [contents] : [];
  return blocks.flatMap((block) =>
    typeof block === 'string' ? [{ text: block }] : Array.isArray(block.parts) ? block.parts : []
  );
}

function toDataUrl(data: string, mediaType: string): string {
  const base64 = data.replace(/^data:[^;]+;base64,/, '');
  return `data:${mediaType};base64,${base64}`;
}

export async function generateGatewayContent(
  request: LegacyRequest,
  timeoutMs = 45_000
): Promise<any> {
  const parts = getParts(request.contents);
  const text = parts.map((part) => part.text).filter(Boolean).join('\n');
  const imageParts = parts.filter((part) => part.inlineData?.mimeType?.startsWith('image/'));
  const hasImageInput = imageParts.length > 0;

  if (request.config?.imageConfig && !hasImageInput) {
    const { image } = await generateImage({
      model: gateway.imageModel(AI_MODELS.image),
      prompt: text,
      aspectRatio: (request.config.imageConfig.aspectRatio || '1:1') as `${number}:${number}`,
      abortSignal: AbortSignal.timeout(timeoutMs),
    });

    return {
      text: '',
      candidates: [{ content: { parts: [{ inlineData: { data: image.base64, mimeType: image.mediaType } }] } }],
    };
  }

  const content: any[] = [];
  for (const part of parts) {
    if (part.text) {
      content.push({ type: 'text', text: part.text });
    } else if (part.inlineData?.data && part.inlineData.mimeType) {
      content.push({
        type: 'file',
        data: Buffer.from(part.inlineData.data, 'base64'),
        mediaType: part.inlineData.mimeType,
      });
    }
  }

  const schemaInstruction = request.config?.responseSchema
    ? `\n\nReturn JSON matching this schema exactly:\n${JSON.stringify(request.config.responseSchema)}`
    : '';
  if (schemaInstruction && content[0]?.type === 'text') {
    content[0] = { ...content[0], text: `${content[0].text}${schemaInstruction}` };
  }

  const result = await generateText({
    model: gateway(normalizeModel(request.model, hasImageInput)),
    messages: [{ role: 'user', content }],
    ...(request.config?.responseMimeType === 'application/json' ? { output: Output.json() } : {}),
    abortSignal: AbortSignal.timeout(timeoutMs),
    maxOutputTokens: 8000,
  });

  const generatedImages = result.files
    .filter((file) => file.mediaType.startsWith('image/'))
    .map((file) => ({ inlineData: { data: file.base64.replace(/^data:[^;]+;base64,/, ''), mimeType: file.mediaType } }));
  const responseText = result.output === undefined ? result.text : JSON.stringify(result.output);

  return {
    text: responseText,
    candidates: [{ content: { parts: generatedImages }, groundingMetadata: { groundingChunks: [] } }],
  };
}

export async function generateGatewayVideo(
  prompt: string,
  options: { imageBase64?: string; mimeType?: string; aspectRatio?: string } = {},
  timeoutMs = 90_000
): Promise<{ data: string; mediaType: string }> {
  const image = options.imageBase64?.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  const { video } = await experimental_generateVideo({
    model: gateway.videoModel(AI_MODELS.video),
    prompt: image
      ? { image: Buffer.from(image, 'base64'), text: prompt }
      : prompt,
    aspectRatio: options.aspectRatio === '16:9' ? '16:9' : '9:16',
    duration: 6,
    poll: { timeoutMs },
    abortSignal: AbortSignal.timeout(timeoutMs + 5_000),
  });

  return { data: video.base64.replace(/^data:[^;]+;base64,/, ''), mediaType: 'video/mp4' };
}

export const gatewayClient = {
  models: {
    generateContent: generateGatewayContent,
    generateVideos: async (request: any) => {
      const image = request.image?.imageBytes;
      const generated = await generateGatewayVideo(request.prompt || 'Clinical research animation', {
        imageBase64: typeof image === 'string' ? image : undefined,
        mimeType: request.image?.mimeType,
        aspectRatio: request.config?.aspectRatio,
      });
      return {
        done: true,
        response: {
          generatedVideos: [{ video: { uri: toDataUrl(generated.data, generated.mediaType) } }],
        },
      };
    },
  },
  operations: {
    getVideosOperation: async ({ operation }: { operation: unknown }) => operation,
  },
};
