import { GoogleGenAI } from "@google/genai";
import { MODEL_ANALYSIS, MODEL_IMAGE_GEN, MODEL_ANALYSIS_FALLBACK, MODEL_IMAGE_GEN_FALLBACK, TIMEOUT_DURATION } from "../constants";
import { ImageResolution } from "../types";

// Helper to get client with current key
const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in your environment variables (or .env.local for local development).");
  }
  return new GoogleGenAI({ apiKey });
};

// Timeout Helper
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((reason) => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};

export const analyzeSketch = async (
  base64Image: string,
  userNotes: string,
  mode: 'CONCEPT' | 'DETAIL',
  styleMode: 'A' | 'B' | 'C' | 'NONE'
): Promise<string> => {
  const ai = getClient();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  // Construct Style Instruction based on selection
  let styleInstruction = "";
  if (styleMode === 'NONE') {
    styleInstruction = `
              **STYLE LIST Integration:**
              * **Priority 2 (Active):** No specific STYLE LIST selected. You MUST refer to general learning data (Web) for design vocabulary.`;
  } else {
    const definitions = {
      A: `**STYLE LIST [A]: Silent Minimalism (침묵의 미니멀리즘)**
          - Philosophy: 장식을 배제하고 기하학적 순수성을 강조. '형태'보다는 빛이 닿는 '면'의 질감에 집중.
          - Materials: Exposed Aggregate Concrete, Vals Quartzite, Frameless Low-Iron Glass.
          - Atmosphere: Soft Diffused Light, Overcast, Soft Shadows, Mass Emphasis.`,
      B: `**STYLE LIST [B]: Organic Biophilia (유기적 바이오필리아)**
          - Philosophy: 직선보다는 자연스러운 흐름, 차가운 금속보다는 숨 쉬는 나무와 흙의 물성 강조.
          - Materials: Weathered Cedar Slats, CLT, Corten Steel, Ivy/Moss details.
          - Atmosphere: Golden Hour, Dappled Light, 3500K Warmth, Patina.`,
      C: `**STYLE LIST [C]: Raw Industrialism (로우 인더스트리얼)**
          - Philosophy: 구조체(뼈대)를 숨기지 않고 드러냄. 세월의 흔적과 공업적 미학을 현대적으로 재해석.
          - Materials: Reclaimed Red Brick, Dark Grey Clinker Brick, Blackened Steel I-Beams, Zinc Panels.
          - Atmosphere: Volumetric Fog, God Rays, Blue Hour, Micro-roughness.`
    };

    styleInstruction = `
              **STYLE LIST Integration (스타일 리스트 통합):**
              * **Priority 1:** You MUST refer to the following specific guide for STYLE [${styleMode}]:
              ${definitions[styleMode as keyof typeof definitions]}
              
              * **CRITICAL EXCEPTION:** If User Mode Preference is [DETAIL], you MUST IGNORE the 'Optical' lens specification (e.g., 50mm, 35mm, 24mm) from the Style List above. Instead, strictly follow the [Layer 2] instruction to maintain the original sketch's viewpoint.
              
              * **Priority 2:** Only if the definitions above are inapplicable, refer to general web data.`;
  }

  try {
    const generate = async (modelName: string) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64
              }
            },
            {
              text: `
              Analyze this architectural sketch using the "4-Layer Blueprint Realization" method.
              
              User Context: "${userNotes || 'None'}"
              User Mode Preference: ${mode}
              Selected Style List: ${styleMode}

              ${styleInstruction}

              Produce a report in the following strict Markdown format:

              # 🏗️ Blueprint Realization Report v3.0

              ## 1. Metacognitive Analysis (메타인지 분석)
              * **Diagnosis:** [${mode}] / [STYLE: ${styleMode}]
                  * *Reasoning:* (Evaluation of sketch completion and clarity)
              * **Design Strategy:** [Active Shaping / Passive Preservation]
              * **Sensory-Technical Translation (감각-기술 번역):**
                  * *Abstract:* (User's abstract intent, e.g., "Cozy", "Grand")
                  * *→ Tech Spec:* (Translated physical/optical values, e.g., "3200K Warm Light", "Low-angle 16mm Lens")

              ## 2. Spatial & Logic Decoding (공간 및 논리 해독)
              * **Geometry (Layer 1 Input):** [Main structural lines/forms to preserve]
              * **Materiality (Layer 3 Input):** [Specific brand/material names replacing hatching]
              * **Space Hierarchy:** [Foreground/Mid/Background analysis]
              * **Context Inference:** [Urban/Nature/Industrial based on building typology]

              ## 3. Final Execution Prompt (최종 실행 프롬프트)
              \`\`\`
              /imagine prompt:
              [Layer 1: Core Subject & Geometry (Sanctuary)]
              (Strict description of architectural massing, lines, and form based on ${mode} analysis)
              ::
              [Layer 2: Optical Physics Specs (Simulation)]
               ${mode === 'DETAIL'
                  ? 'STRICT TILT-SHIFT & PERSPECTIVE CONTROL REQUIRED. 1. FIRST, APPLY "Tilt-Shift Lens" to geometrically correct vertical lines (Make them strictly parallel). 2. SECOND, based on the corrected verticals, maintain the EXACT viewpoint and camera angle of the original sketch. 3. DO NOT DISTORT the composition. Asymmetrical Composition, Negative Space, Wide Angle View, Rule of Thirds. (PHOTOGRAPHIC SPECS: Shot on Fujifilm GFX 100S, f/11 aperture, Deep Focus, ISO 100, 8K Resolution, Hyper-realistic Architectural Photography, Subtle Film Grain, Slight Motion Blur, Micro-Dust/Dirty Lens Effect)'
                  : 'Shot on Fujifilm GFX 100S, Tilt-Shift Lens (Mandatory), Perspective Control (Vertical lines strictly parallel), f/11 aperture, Deep Focus (Pan-focus), ISO 100, Hyper-realistic Architectural Photography, Subtle Film Grain, Slight Motion Blur, Micro-Dust/Dirty Lens Effect'
                }
              ::
              [Layer 3: Material, Atmosphere & Entropy (POSI-GAP)]
              Facade strictly clad in [Specific Brand/Material Name], [Weathering/Patina Details], Volumetric Fog, Diffused Soft Light, [Time of Day/Weather], [Context Inference Result], Quiet Confidence, God Rays
              ::
              [Layer 4: Semantic Constraints & Exclusion]
              --no (cars, pedestrians, bokeh, depth of field, distortion, keystoning, ornamental details, cartoonish, illustration, text, signature, vertical convergence, tilted lines, leaning buildings)
              --style raw --v 6.0
              \`\`\`

              ## 4. Reality Check (사실주의 검증)
              * **Imperfection Injection:** [Applied entropy elements]
              * **Optical Verification:** [Tilt-Shift and Focus confirmation]

              ## 5. Iterative Refinement (가변 옵션 제안)
              *This result implies the following variations:*
              * **Option A (Time/Weather Shift):** [Proposal]
              * **Option B (Material Variation):** [Proposal]
            `
            }
          ]
        },
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
    };

    let response;
    try {
      // Primary Attempt
      response = await withTimeout(generate(MODEL_ANALYSIS), TIMEOUT_DURATION);
    } catch (error: any) {
      console.warn(`Analysis failed (Error: ${error.message}). Retrying with fallback model: ${MODEL_ANALYSIS_FALLBACK}`);
      // Fallback Attempt
      response = await generate(MODEL_ANALYSIS_FALLBACK);
    }

    return response.text || "A hyper-realistic architectural photograph of a modern building based on the provided sketch.";
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Failed to analyze sketch.");
  }
};

export const generateBlueprintImage = async (
  base64Image: string,
  prompt: string,
  resolution: ImageResolution,
  aspectRatio: string = "4:3"
): Promise<string> => {
  const ai = getClient();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  try {
    const generate = async (modelName: string) => {
      // Configuration based on model type (Imagen vs Gemini)
      // For gemini-2.0-flash-exp / gemini-2.5-flash-image / imagen-3
      // We should use standard generation config, typically 'aspectRatio' or 'sampleCount'.
      // Strict resolution strings like '1024x1024' are often rejected by newer endpoints.

      const generationConfig: any = {
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      };

      // Apply aspect ratio if supported
      // Note: Some models might prefer '1:1' string, others might take width/height.
      // Safest bet for 'gemini-2.5-flash-image' or 'imagen' via GenAI SDK is usually specific params.
      // But standard 'generationConfig' for text/multimodal models doesn't always have 'imageConfig'.
      // Let's force 'imageConfig' structure but with aspectRatio string which is safer.

      return await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              text: "STRICTLY MAINTAIN THE EXACT FRAMING AND PROPORTIONS OF THE INPUT IMAGE. DO NOT ZOOM IN. DO NOT CROP. RENDER THE FULL VIEW.\n\n" + prompt
            },
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64
              }
            }
          ]
        },
        config: {
          // @ts-ignore - SDK types might be outdated for preview features
          generationConfig: {
            ...generationConfig,
            // Some models accept 'aspectRatio' directly here
            aspectRatio: aspectRatio
          }
        }
      });
    };

    let response;
    try {
      // Primary Attempt
      response = await withTimeout(generate(MODEL_IMAGE_GEN), TIMEOUT_DURATION);
    } catch (error: any) {
      console.warn(`Image generation failed (Error: ${error.message}). Retrying with fallback model: ${MODEL_IMAGE_GEN_FALLBACK}`);
      // Fallback Attempt
      response = await generate(MODEL_IMAGE_GEN_FALLBACK);
    }

    const parts = response.candidates?.[0]?.content?.parts;

    // DEBUG LOGGING
    console.log("DEBUG: Full Generation Response", JSON.stringify(response, null, 2));

    if (!parts) throw new Error("No content generated");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Generation Error:", error);
    throw new Error("Failed to generate visualization.");
  }
};
