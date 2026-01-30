export const MODEL_ANALYSIS = 'gemini-3-pro-preview';
export const MODEL_IMAGE_GEN = 'gemini-3-pro-image-preview'; // Required for high quality

export const MODEL_ANALYSIS_FALLBACK = 'gemini-2.5-pro'; // Fallback for Analysis
export const MODEL_IMAGE_GEN_FALLBACK = 'gemini-2.5-flash-image'; // Fallback for Image Gen
export const MODEL_IMAGE_REFINE = 'gemini-exp-1206'; // Step 3 Primary: Experimental High-Fidelity
export const MODEL_IMAGE_REFINE_FALLBACK = 'imagen-3.0-generate-001'; // Step 3 Fallback: Stable High-Fidelity (Imagen 3)

// Timeouts (Milliseconds)
export const TIMEOUT_ANALYSIS = 60000; // 60s
export const TIMEOUT_IMAGE_GEN = 60000; // 60s
export const TIMEOUT_REFINE = 90000; // 90s (Longer for refinement)

export const metadata = {
    title: 'Sketch to Image',
    description: 'AI Drawing App',
};
