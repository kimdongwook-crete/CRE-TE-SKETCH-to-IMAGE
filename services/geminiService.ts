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
      A: `
# David Chipperfield
------------------------------------
**활용:** User Sketch -> David Chipperfield Style Rendering
**원칙:** Propositional Definition, Positive Absolute, Contextual Anchoring

## 1. General Requirements
### 1.1 Persona & Tone
* **Role:** Architectural Material Specialist & Heritage Conservation Architect.
* **Mood:** Silence, Timelessness, Solidity.

### 1.2 Sketch Interpretation Logic
* **Line Weight:** Thick lines = Structural columns or Wall thickness.
* **Vertical Lines:** Simple verticals = Deep Fins or Colonnade.
* **Blank Space:** White space = Solid Wall (Not void).

## 2. Material & Finish Schedule (Force Apply)
| Code | Location | Specification | Reference |
| --- | --- | --- | --- |
| **MAT-01** | **Main Facade** | **Pale Beige Brick** (Long format) | *Kolumba Brick (Petersen Tegl)* |
| **MAT-02** | **Structure** | **Sandblasted Precast Concrete** | *James-Simon-Galerie Columns* |
| **MAT-03** | **Accent** | **Terrazzo / Travertine** | *Neues Museum Staircase* |
| **MAT-04** | **Glazing** | **Low-Iron Clear Glass** (No Tint) | *Amorepacific HQ Transparency* |

## 3. Tectonics & Geometric Logic
### 3.1 Grounding
* **Constraint:** **NO PILOTIS.**
* **Rule:** Building must sit heavily on the ground (Podium).

### 3.2 Depth of Facade
* **Rule:** Deep Set Recess (Windows recessed 450mm ~ 600mm).
* **Effect:** Reveal physical thickness. Eliminate "lightness".

### 3.3 Rhythm & Repetition
* **Rule:** Strict Equidistance for vertical elements. Correct irregular lines to Classical Proportion.

## 4. Lighting & Environment
* **Type:** **Diffuse Overcast Light**.
* **Shadow:** Soft, highlighting texture.
* **Sky:** Desaturated Grey Sky. No blue.

## 5. Winning Strategy Prompt (Master Prompt)
\`\`\`
# Role & Context
Act as a world-class architectural visualization expert specializing in David Chipperfield's work. 
Convert the input sketch into a photorealistic rendering by strictly adhering to the following "David Chipperfield Style Specification". 

# 1. Reference Logic (Masterpiece Mapping)
Synthesize the architectural DNA from the following sources:
* ** Facade Rhythm**: Interpret vertical sketch lines as the deep-set aluminum/concrete fins of **[Amorepacific HQ]**. 
* **Materiality**: Apply the texture of 'Pale Beige Bricks' and 'Precast Concrete' from **[Neues Museum]**. 
* **Grounding**: Ensure the mass sits heavily on the ground like the **[James-Simon-Galerie]**. 

# 2. Propositional Constraints (Must-Haves)
* **The Facade IS:** A rhythmic composition of vertical columns with a depth of 60cm. 
* **The Material IS:** Matte, non-reflective, and textured (Sandblasted). 
* **The Structure IS:** Monolithic and heavy. DO NOT create floating masses or pilotis. 
* **The Color Palette IS:** Desaturated Earth Tones (Stone Grey, Cream, Travertine Beige). 

# 3. Technical Specifications
* **Lighting: Soft overcast ambient light to highlight material texture. No harsh shadows. 
* **Quality: 8k, Photorealistic, Architectural Photography. 

# Instruction for Sketch processing
* Treat rough outlines as solid, heavy masonry walls. 
* Correct any perspective errors in the sketch to align with a strict orthogonal grid.
\`\`\`
`,
      B: `
# Richard Meier
------------------------------------
**활용:** User Sketch -> Richard Meier Style Rendering
**원칙:** Geometric Propositions, Absolute Whiteness, Optical Control

## 1. General Requirements
### 1.1 Persona & Tone
* **Role:** Geometric Purist & Master of Light.
* **Mood:** Clarity, Purity, Rationality.

### 1.2 Sketch Interpretation Logic
* **Grid Logic:** All lines snap to invisible 1m grid. Correct to Orthogonal.
* **Curve Interpretation:** Curves are "Free-form Walls", independent of grid.
* **Volume:** Collection of Planes (Skin), not solid mass.

## 2. Material & Finish Schedule
Force Color: #FFFFFF
| Code | Location | Specification | Reference |
| --- | --- | --- | --- |
| **MAT-01** | **Exterior Skin** | **White Porcelain Enameled Panel** | *MACBA Facade (1m x 1m Grid)* |
| **MAT-02** | **Glazing** | **Clear Float Glass** (No Tint/Reflectivity) | *Douglas House Windows* |
| **MAT-03** | **Structure** | **White Painted Steel / Concrete** | *Getty Center Columns* |
| **MAT-04** | **Circulation** | **White Stucco / Plaster** | *High Museum Ramp* |

## 3. Tectonics & Geometric Logic
### 3.1 Relationship with Site
* **Rule:** **Lifted Volume.**
* **Constraint:** Must use **Cylindrical Pilotis** or Podium. Distinct from ground.

### 3.2 Facade Syntax
* **Rule:** **Layering.**
* **Description:** [Structure] - [Glass] - [Brise-soleil]. Deep layering.
* **Detail:** Black joints visible on white panels.

### 3.3 Transparency
* **Rule:** Physical Transparency. Glass = Void. Reveal interior ramps/stairs.

## 4. Lighting & Environment
* **Type:** **Hard Direct Sunlight**.
* **Shadow:** **Chiaroscuro.** Sharp, geometric shadows.
* **Sky:** **Deep Azure Blue.** Clear sky for maximum contrast.

## 5. Winning Strategy Prompt (Master Prompt)
\`\`\`
# Role & Context
Act as a strict Architectural Geometry Specialist following Richard Meier's design principles. 
Convert the input sketch into a pristine, white architectural visualization. 

# 1. Reference Logic (Masterpiece Mapping)
Synthesize the architectural DNA from the following sources:
* **Grid System**: Apply the 1m x 1m enamel panel grid from **[MACBA]** to all solid surfaces. 
* **Massing**: Interpret the volume as a layered composition like **[The Douglas House]**, lifted from the ground. 
* **Circulation**: If a ramp or stair is visible, render it as a projecting element like in **[The High Museum of Art]**. 

# 2. Propositional Constraints (Must-Haves)
* **The Color IS**: Absolute White (#FFFFFF). No beige, no grey, no warm tones. 
* **The Material IS**: Glossy Porcelain Enameled Panels with visible black joints. 
* **The Structure IS**: Supported by white cylindrical pilotis. 
* **The Geometry IS**: A strict interplay of rectilinear grids and free-form curves. 

# 3. Technical Specifications
* **Lighting**: High-contrast daylight. Hard shadows cast by screen walls and mullions. 
* **Sky**: Clear, deep blue sky to maximize contrast with the white building. 
* **Quality**: 8k, Photorealistic, Sharp Focus. 

# Instruction for Sketch processing
* Straighten all hand-drawn lines to a perfect orthogonal grid. 
* Interpret any hatching in the sketch as a 'Brise-soleil' (Sun breaker) grid. 
* Treat empty spaces between lines as clear glass revealing the interior.
\`\`\`
`,
      C: `
# Kengo Kuma
------------------------------------
**활용:** User Sketch -> Kengo Kuma Style Rendering
**원칙:** Particlization, Material Layering, Organic Integration

## 1. General Requirements
### 1.1 Persona & Tone
* **Role:** Master of Wood Joinery & Organic Architecture.
* **Mood:** Warmth, Porosity, Harmony with Nature.

### 1.2 Sketch Interpretation Logic
* **Line to Louver:** Line = Array of Louvers.
* **Mass to Layers:** Volume = Stratum (Layered slabs).
* **Edge Dissolution:** Blurred Edge (Not sharp).

## 2. Material & Finish Schedule
| Code | Location | Specification | Reference |
| --- | --- | --- | --- |
| **MAT-01** | **Main Facade** | **Japanese Cedar (Cryptomeria) Louvers** | *Japan National Stadium Eaves* |
| **MAT-02** | **Structure** | **Interlocking Wood Joinery (Kigumi)** | *Sunny Hills / GC Prostho* |
| **MAT-03** | **Solid Wall** | **Rough Hewn Stone Slats** | *V&A Dundee / Stone Museum* |
| **MAT-04** | **Screen** | **Washi Paper / Bamboo Mesh** | *Nezu Museum Interior* |

## 3. Tectonics & Geometric Logic
### 3.1 Particlization
* **Rule:** **"Divide and Dissolve."**
* **Constraint:** No Big Blank Walls.
* **Logic:** All surfaces broken down into 10-15cm slats/louvers. Erase weight.

### 3.2 Joinery Syntax
* **Rule:** **Jigoku-gumi (Hell Assembly).**
* **Description:** X mark in sketch = Wood Joinery Grid (Not brace).

### 3.3 Roof & Eaves
* **Rule:** **Deep Eaves (Noki).**
* **Logic:** Exaggerated eaves with exposed rafters. Deep shadow.

## 4. Lighting & Environment
* **Type:** **Komorebi (Dappled Light).**
* **Shadow:** Dappled pattern through louvers.
* **Surroundings:** Nature elements (Bamboo, Stone, Water) infiltrating.

## 5. Winning Strategy Prompt (Master Prompt)
\`\`\`
# Role & Context
Act as an architect specializing in Kengo Kuma's design philosophy ("Particlization"). 
Transform the input sketch into a warm, organic architectural visualization defined by wood and natural light. 

# 1. Reference Logic (Masterpiece Mapping)
Synthesize the architectural DNA from the following sources:
* **Facade Texture**: Apply the stacked stone/wood louver layers from **[V&A Dundee]**. 
* **Roof Detail**: Interpret roof lines as deep eaves with exposed wooden rafters like the **[Japan National Stadium]**. 
* **Joinery Pattern**: Convert cross-hatching or mesh lines into the 'Jigoku-gumi' wood joint pattern from **[Sunny Hills]**. 

# 2. Propositional Constraints (Must-Haves)
* **The Material IS**: Natural Japanese Cedar (Cryptomeria) and Rough Stone. 
* **The Form IS**: A stratified assembly of small parts, NOT a solid monolithic volume. 
* **The Facade IS**: Porous (allowing light to pass through), defined by vertical or horizontal slats. 
* **The Atmosphere IS**: Warm, Zen-like, and blended with nature. 

# 3. Technical Specifications
* **Lighting**: 'Komorebi' effect (dappled light filtering through louvers). 
* **Quality**: 8k, Photorealistic, Macro detail on wood grain. 

#Instruction for Sketch processing
* Break down all continuous lines into repetitive louver patterns. 
* Interpret the building edge as soft and dissolving into the sky/ground. 
* Fill any solid areas with a texture of stacked thin slabs.
\`\`\`
`
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
              * **Diagnosis:** [${mode}] / [${styleMode === 'A' ? 'David Chipperfield' :
                  styleMode === 'B' ? 'Richard Meier' :
                    styleMode === 'C' ? 'Kengo Kuma' :
                      'None'
                }]
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
